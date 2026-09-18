-- Workflow commands. Each function is one transaction that (a) authorises the
-- caller from auth.uid() — the actor is never a parameter, (b) validates the
-- state transition, (c) applies it, and (d) appends the audit event.
--
-- Error codes use PostgREST's "PTxxx" convention, which it maps to HTTP xxx,
-- so calling these directly through the Supabase REST API (bypassing our
-- Fastify API entirely) is exactly as safe as calling them through it.

create function public._actor()
returns public.firm_memberships
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  m public.firm_memberships;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated' using errcode = 'PT401';
  end if;
  select * into m from public.firm_memberships where user_id = auth.uid();
  if not found then
    raise exception 'Your account is not a member of any firm' using errcode = 'PT403';
  end if;
  return m;
end;
$$;

create function public._require_role(m public.firm_memberships, variadic p_roles public.member_role[])
returns void
language plpgsql
immutable
as $$
begin
  if not (m.role = any (p_roles)) then
    raise exception 'Your role (%) is not allowed to perform this action', m.role using errcode = 'PT403';
  end if;
end;
$$;

-- Locks the document row for the rest of the transaction. Documents in other
-- firms (or unassigned clients, for staff) are reported as "not found" so the
-- response never reveals that the ID exists.
create function public._lock_document(p_document_id uuid)
returns public.documents
language plpgsql
security definer
set search_path = public
as $$
declare
  d public.documents;
begin
  select * into d from public.documents where id = p_document_id for update;
  if not found
     or d.firm_id is distinct from public.current_firm_id()
     or not public.can_access_client(d.client_id) then
    raise exception 'Document not found' using errcode = 'PT404';
  end if;
  return d;
end;
$$;

create function public._check_row_version(d public.documents, p_expected integer)
returns void
language plpgsql
immutable
as $$
begin
  if p_expected is not null and p_expected <> d.row_version then
    raise exception 'This document was updated by someone else. Refresh and try again.'
      using errcode = 'PT409';
  end if;
end;
$$;

-- Maker-checker: whoever uploaded the version under review can't review it.
create function public._check_not_uploader(d public.documents)
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.document_versions v
    where v.id = d.current_version_id and v.uploaded_by = auth.uid()
  ) then
    raise exception 'You uploaded this version, so a different person must review it (maker-checker).'
      using errcode = 'PT403';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Clients
-- ---------------------------------------------------------------------------

create function public.create_client(
  p_name text,
  p_pan text default null,
  p_gstin text default null,
  p_document_names text[] default '{}'
)
returns public.clients
language plpgsql
security definer
set search_path = public
as $$
declare
  m public.firm_memberships := public._actor();
  c public.clients;
  v_doc_name text;
  v_doc_id uuid;
begin
  perform public._require_role(m, 'reviewer', 'partner');

  begin
    insert into public.clients (firm_id, name, pan, gstin, created_by)
    values (m.firm_id, btrim(p_name), nullif(upper(btrim(p_pan)), ''), nullif(upper(btrim(p_gstin)), ''), auth.uid())
    returning * into c;
  exception
    when unique_violation then
      raise exception 'A client named "%" already exists in your firm', btrim(p_name) using errcode = 'PT409';
    when check_violation then
      raise exception 'Invalid client details (check the name, PAN and GSTIN format)' using errcode = 'PT400';
  end;

  perform public._append_audit_event(
    m.firm_id, 'client.created', c.id,
    p_metadata => jsonb_strip_nulls(jsonb_build_object('pan', c.pan, 'gstin', c.gstin))
  );

  for v_doc_name in
    select distinct btrim(n) from unnest(coalesce(p_document_names, '{}')) as n where btrim(n) <> ''
  loop
    insert into public.documents (firm_id, client_id, name, created_by)
    values (m.firm_id, c.id, v_doc_name, auth.uid())
    returning id into v_doc_id;

    perform public._append_audit_event(
      m.firm_id, 'document.requirement_added', c.id, v_doc_id, p_to => 'pending'
    );
  end loop;

  return c;
end;
$$;

create function public.assign_staff(p_client_id uuid, p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  m public.firm_memberships := public._actor();
  v_client public.clients;
  v_assignee public.firm_memberships;
  v_inserted integer;
begin
  perform public._require_role(m, 'reviewer', 'partner');

  select * into v_client from public.clients where id = p_client_id and firm_id = m.firm_id;
  if not found then
    raise exception 'Client not found' using errcode = 'PT404';
  end if;

  select * into v_assignee from public.firm_memberships where user_id = p_user_id and firm_id = m.firm_id;
  if not found or v_assignee.role <> 'staff' then
    raise exception 'That user is not a staff member of your firm' using errcode = 'PT400';
  end if;

  insert into public.client_assignments (client_id, user_id, firm_id, assigned_by)
  values (p_client_id, p_user_id, m.firm_id, auth.uid())
  on conflict do nothing;
  get diagnostics v_inserted = row_count;

  if v_inserted > 0 then
    perform public._append_audit_event(
      m.firm_id, 'client.staff_assigned', p_client_id,
      p_metadata => jsonb_build_object(
        'assigneeId', p_user_id,
        'assigneeName', (select full_name from public.profiles where id = p_user_id)
      )
    );
  end if;

  return v_inserted > 0;
end;
$$;

create function public.add_required_document(p_client_id uuid, p_name text)
returns public.documents
language plpgsql
security definer
set search_path = public
as $$
declare
  m public.firm_memberships := public._actor();
  d public.documents;
begin
  perform public._require_role(m, 'reviewer', 'partner');

  if not exists (select 1 from public.clients where id = p_client_id and firm_id = m.firm_id) then
    raise exception 'Client not found' using errcode = 'PT404';
  end if;

  begin
    insert into public.documents (firm_id, client_id, name, created_by)
    values (m.firm_id, p_client_id, btrim(p_name), auth.uid())
    returning * into d;
  exception
    when unique_violation then
      raise exception 'This client already has a document named "%"', btrim(p_name) using errcode = 'PT409';
    when check_violation then
      raise exception 'Document name must be 2–120 characters' using errcode = 'PT400';
  end;

  perform public._append_audit_event(m.firm_id, 'document.requirement_added', p_client_id, d.id, p_to => 'pending');
  return d;
end;
$$;

-- ---------------------------------------------------------------------------
-- Documents
-- ---------------------------------------------------------------------------

create function public.record_document_upload(
  p_document_id uuid,
  p_storage_path text,
  p_file_name text,
  p_mime_type text,
  p_size_bytes bigint,
  p_sha256 text,
  p_response_note text default null
)
returns public.document_versions
language plpgsql
security definer
set search_path = public
as $$
declare
  m public.firm_memberships := public._actor();
  d public.documents;
  v public.document_versions;
begin
  perform public._require_role(m, 'staff', 'partner');
  d := public._lock_document(p_document_id);

  if d.status not in ('pending', 'uploaded', 'correction_required') then
    raise exception 'A document that is % cannot receive a new upload', replace(d.status::text, '_', ' ')
      using errcode = 'PT409';
  end if;

  -- The API chooses the storage path; the database still checks it can only
  -- point inside this firm/client/document's folder.
  if p_storage_path not like (d.firm_id || '/' || d.client_id || '/' || d.id || '/%') then
    raise exception 'Storage path does not belong to this document' using errcode = 'PT400';
  end if;

  insert into public.document_versions (
    firm_id, document_id, version_no, storage_path, file_name, mime_type, size_bytes, sha256, response_note, uploaded_by
  )
  values (
    d.firm_id, d.id,
    coalesce((select max(version_no) from public.document_versions where document_id = d.id), 0) + 1,
    p_storage_path, p_file_name, p_mime_type, p_size_bytes, lower(p_sha256),
    nullif(btrim(p_response_note), ''), auth.uid()
  )
  returning * into v;

  update public.documents
  set status = 'uploaded',
      current_version_id = v.id,
      reviewer_id = null,
      row_version = row_version + 1,
      updated_at = now()
  where id = d.id;

  perform public._append_audit_event(
    d.firm_id,
    case when v.version_no = 1 then 'document.uploaded' else 'document.reuploaded' end::public.audit_action,
    d.client_id, d.id, v.id, d.status, 'uploaded', v.response_note,
    jsonb_build_object('versionNo', v.version_no, 'sizeBytes', v.size_bytes, 'mimeType', v.mime_type, 'sha256', v.sha256)
  );

  return v;
end;
$$;

create function public.start_review(p_document_id uuid, p_expected_row_version integer default null)
returns public.documents
language plpgsql
security definer
set search_path = public
as $$
declare
  m public.firm_memberships := public._actor();
  d public.documents;
begin
  perform public._require_role(m, 'reviewer', 'partner');
  d := public._lock_document(p_document_id);
  perform public._check_row_version(d, p_expected_row_version);

  if d.status <> 'uploaded' then
    raise exception 'Only uploaded documents can be taken for review (current status: %)', replace(d.status::text, '_', ' ')
      using errcode = 'PT409';
  end if;
  perform public._check_not_uploader(d);

  update public.documents
  set status = 'under_review', reviewer_id = auth.uid(), row_version = row_version + 1, updated_at = now()
  where id = d.id
  returning * into d;

  perform public._append_audit_event(
    d.firm_id, 'review.started', d.client_id, d.id, d.current_version_id, 'uploaded', 'under_review',
    p_metadata => jsonb_build_object('versionNo', (select version_no from public.document_versions where id = d.current_version_id))
  );
  return d;
end;
$$;

create function public._decide(
  p_document_id uuid,
  p_decision public.review_decision,
  p_comment text,
  p_expected_row_version integer
)
returns public.documents
language plpgsql
security definer
set search_path = public
as $$
declare
  m public.firm_memberships := public._actor();
  d public.documents;
  v_to public.document_status;
begin
  perform public._require_role(m, 'reviewer', 'partner');
  d := public._lock_document(p_document_id);
  perform public._check_row_version(d, p_expected_row_version);

  if d.status <> 'under_review' then
    raise exception 'Start the review before deciding (current status: %)', replace(d.status::text, '_', ' ')
      using errcode = 'PT409';
  end if;
  if d.reviewer_id is distinct from auth.uid() and m.role <> 'partner' then
    raise exception 'This document is being reviewed by someone else' using errcode = 'PT403';
  end if;
  perform public._check_not_uploader(d);

  if p_decision = 'correction_requested' and char_length(btrim(coalesce(p_comment, ''))) < 10 then
    raise exception 'Explain what needs to be corrected (at least 10 characters)' using errcode = 'PT400';
  end if;

  v_to := case p_decision when 'approved' then 'approved' else 'correction_required' end;

  insert into public.review_decisions (firm_id, document_id, version_id, decision, comment, reviewer_id)
  values (d.firm_id, d.id, d.current_version_id, p_decision, nullif(btrim(p_comment), ''), auth.uid());

  update public.documents
  set status = v_to,
      reviewer_id = auth.uid(),
      last_review_comment = coalesce(nullif(btrim(p_comment), ''), case when p_decision = 'approved' then null else last_review_comment end),
      row_version = row_version + 1,
      updated_at = now()
  where id = d.id
  returning * into d;

  perform public._append_audit_event(
    d.firm_id,
    case p_decision when 'approved' then 'review.approved' else 'review.correction_requested' end::public.audit_action,
    d.client_id, d.id, d.current_version_id, 'under_review', v_to, p_comment,
    jsonb_build_object('versionNo', (select version_no from public.document_versions where id = d.current_version_id))
  );
  return d;
end;
$$;

create function public.approve_document(
  p_document_id uuid,
  p_expected_row_version integer default null,
  p_comment text default null
)
returns public.documents
language sql
security definer
set search_path = public
as $$
  select * from public._decide(p_document_id, 'approved', p_comment, p_expected_row_version)
$$;

create function public.request_correction(
  p_document_id uuid,
  p_comment text,
  p_expected_row_version integer default null
)
returns public.documents
language sql
security definer
set search_path = public
as $$
  select * from public._decide(p_document_id, 'correction_requested', p_comment, p_expected_row_version)
$$;

-- ---------------------------------------------------------------------------
-- Security events
-- ---------------------------------------------------------------------------

-- Called by the API after a lookup came back empty. Records an access.denied
-- event in the *caller's* firm log only when the resource really exists but is
-- outside what the caller may see. Nothing about the other firm (names, IDs
-- of related rows) is copied — only the ID the caller already had.
create function public.log_access_denied(p_resource_type text, p_resource_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  m public.firm_memberships := public._actor();
  v_firm_id uuid;
  v_client_id uuid;
begin
  if p_resource_type = 'client' then
    select firm_id, id into v_firm_id, v_client_id from public.clients where id = p_resource_id;
  elsif p_resource_type = 'document' then
    select firm_id, client_id into v_firm_id, v_client_id from public.documents where id = p_resource_id;
  else
    raise exception 'Unknown resource type' using errcode = 'PT400';
  end if;

  if v_firm_id is null then
    return false; -- genuinely doesn't exist: nothing to record
  end if;

  if v_firm_id <> m.firm_id then
    perform public._append_audit_event(
      m.firm_id, 'access.denied',
      p_metadata => jsonb_build_object('resourceType', p_resource_type, 'resourceId', p_resource_id, 'reason', 'other_firm')
    );
    return true;
  end if;

  if not public.can_access_client(v_client_id) then
    perform public._append_audit_event(
      m.firm_id, 'access.denied', v_client_id,
      p_document_id => case when p_resource_type = 'document' then p_resource_id end,
      p_metadata => jsonb_build_object('resourceType', p_resource_type, 'resourceId', p_resource_id, 'reason', 'not_assigned')
    );
    return true;
  end if;

  return false;
end;
$$;
