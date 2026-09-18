-- Audit trail: append-only, tamper-evident, per-firm hash chain.
--
-- 1. Nobody can UPDATE, DELETE or TRUNCATE audit rows — the triggers below
--    fire for every role, including the backend's service role.
-- 2. Application users can't INSERT directly either; rows are written only by
--    the SECURITY DEFINER workflow functions, in the same transaction as the
--    state change they describe (so there is never a change without an event).
-- 3. Each event stores sha256(previous hash || its own fields). Editing or
--    removing any historical row (e.g. by a DB superuser bypassing triggers)
--    breaks the chain, which verify_audit_chain() detects.

create type public.audit_action as enum (
  'client.created',
  'client.staff_assigned',
  'document.requirement_added',
  'document.uploaded',
  'document.reuploaded',
  'review.started',
  'review.approved',
  'review.correction_requested',
  'access.denied'
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms (id),
  seq bigint not null default 0,
  occurred_at timestamptz not null default clock_timestamp(),
  -- Actor and names are snapshots (no FKs): the history must stay readable
  -- even if a user, client or document is later renamed or removed.
  actor_id uuid,
  actor_name text not null,
  actor_role public.member_role,
  action public.audit_action not null,
  client_id uuid,
  client_name text,
  document_id uuid,
  document_name text,
  version_id uuid,
  file_name text,
  from_status public.document_status,
  to_status public.document_status,
  comment text,
  metadata jsonb not null default '{}'::jsonb,
  prev_hash text not null default '',
  hash text not null default '',
  unique (firm_id, seq)
);

create index audit_events_firm_time_idx on public.audit_events (firm_id, seq desc);
create index audit_events_document_idx on public.audit_events (document_id, seq);
create index audit_events_client_idx on public.audit_events (client_id, seq);

create function public._audit_event_hash(e public.audit_events)
returns text
language sql
stable
set search_path = public, extensions
as $$
  select encode(
    extensions.digest(
      concat_ws(
        '|',
        e.prev_hash,
        e.firm_id::text,
        e.seq::text,
        to_char(e.occurred_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
        coalesce(e.actor_id::text, ''),
        e.actor_name,
        coalesce(e.actor_role::text, ''),
        e.action::text,
        coalesce(e.client_id::text, ''),
        coalesce(e.client_name, ''),
        coalesce(e.document_id::text, ''),
        coalesce(e.document_name, ''),
        coalesce(e.version_id::text, ''),
        coalesce(e.file_name, ''),
        coalesce(e.from_status::text, ''),
        coalesce(e.to_status::text, ''),
        coalesce(e.comment, ''),
        e.metadata::text
      ),
      'sha256'
    ),
    'hex'
  )
$$;

-- Assigns seq / prev_hash / hash on insert. A per-firm advisory lock
-- serialises concurrent writers so the chain never forks.
create function public._audit_events_chain()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_last_seq bigint;
  v_last_hash text;
begin
  perform pg_advisory_xact_lock(hashtextextended('audit_chain:' || new.firm_id::text, 0));

  select seq, hash into v_last_seq, v_last_hash
  from public.audit_events
  where firm_id = new.firm_id
  order by seq desc
  limit 1;

  new.seq := coalesce(v_last_seq, 0) + 1;
  new.prev_hash := coalesce(v_last_hash, repeat('0', 64));
  new.occurred_at := clock_timestamp();
  new.hash := public._audit_event_hash(new);
  return new;
end;
$$;

create trigger audit_events_chain
  before insert on public.audit_events
  for each row execute function public._audit_events_chain();

create function public._forbid_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception '% is append-only; % is not allowed', tg_table_name, tg_op
    using errcode = 'PT403';
end;
$$;

-- Immutable history tables: audit events, uploaded versions, review decisions.
create trigger audit_events_immutable
  before update or delete on public.audit_events
  for each row execute function public._forbid_mutation();
create trigger audit_events_no_truncate
  before truncate on public.audit_events
  for each statement execute function public._forbid_mutation();

create trigger document_versions_immutable
  before update or delete on public.document_versions
  for each row execute function public._forbid_mutation();

create trigger review_decisions_immutable
  before update or delete on public.review_decisions
  for each row execute function public._forbid_mutation();

-- Internal writer. Execute is revoked from every API role (see 0005); only
-- the workflow functions (running as the owner) can call it.
create function public._append_audit_event(
  p_firm_id uuid,
  p_action public.audit_action,
  p_client_id uuid default null,
  p_document_id uuid default null,
  p_version_id uuid default null,
  p_from public.document_status default null,
  p_to public.document_status default null,
  p_comment text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns public.audit_events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.audit_events;
begin
  insert into public.audit_events (
    firm_id, actor_id, actor_name, actor_role, action,
    client_id, client_name, document_id, document_name, version_id, file_name,
    from_status, to_status, comment, metadata
  )
  values (
    p_firm_id,
    auth.uid(),
    coalesce((select full_name from public.profiles where id = auth.uid()), 'System'),
    (select role from public.firm_memberships where user_id = auth.uid() and firm_id = p_firm_id),
    p_action,
    p_client_id,
    (select name from public.clients where id = p_client_id),
    p_document_id,
    (select name from public.documents where id = p_document_id),
    p_version_id,
    (select file_name from public.document_versions where id = p_version_id),
    p_from,
    p_to,
    nullif(btrim(p_comment), ''),
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning * into v_row;

  return v_row;
end;
$$;

-- Recomputes the caller's firm chain from the first event. Returns the first
-- sequence number that doesn't verify, if any.
create function public.verify_audit_chain()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  v_firm_id uuid := public.current_firm_id();
  v_prev text := repeat('0', 64);
  v_expected bigint := 1;
  r public.audit_events;
begin
  if v_firm_id is null or public.current_member_role() not in ('reviewer', 'partner') then
    raise exception 'Only reviewers and partners can verify the audit log' using errcode = 'PT403';
  end if;

  for r in select * from public.audit_events where firm_id = v_firm_id order by seq loop
    if r.seq <> v_expected or r.prev_hash <> v_prev or r.hash <> public._audit_event_hash(r) then
      return jsonb_build_object('ok', false, 'events', v_expected - 1, 'firstBrokenSeq', r.seq, 'headHash', v_prev);
    end if;
    v_prev := r.hash;
    v_expected := v_expected + 1;
  end loop;

  return jsonb_build_object('ok', true, 'events', v_expected - 1, 'firstBrokenSeq', null, 'headHash', v_prev);
end;
$$;
