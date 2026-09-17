-- Row Level Security + privileges.
--
-- The Fastify API queries Supabase with the *end user's* JWT, so these
-- policies apply to every read the app makes. Even if an API route forgot a
-- firm filter, Postgres would still only return the caller's firm's rows.
-- Writes are not granted on any table: they happen only through the workflow
-- functions in 0004.

alter table public.firms enable row level security;
alter table public.profiles enable row level security;
alter table public.firm_memberships enable row level security;
alter table public.clients enable row level security;
alter table public.client_assignments enable row level security;
alter table public.documents enable row level security;
alter table public.document_versions enable row level security;
alter table public.review_decisions enable row level security;
alter table public.audit_events enable row level security;

create policy firms_select on public.firms
  for select to authenticated
  using (id = public.current_firm_id());

create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id in (select user_id from public.firm_memberships where firm_id = public.current_firm_id())
  );

create policy memberships_select on public.firm_memberships
  for select to authenticated
  using (firm_id = public.current_firm_id());

create policy clients_select on public.clients
  for select to authenticated
  using (firm_id = public.current_firm_id() and public.can_access_client(id));

create policy client_assignments_select on public.client_assignments
  for select to authenticated
  using (firm_id = public.current_firm_id() and public.can_access_client(client_id));

create policy documents_select on public.documents
  for select to authenticated
  using (firm_id = public.current_firm_id() and public.can_access_client(client_id));

create policy document_versions_select on public.document_versions
  for select to authenticated
  using (firm_id = public.current_firm_id() and public.can_access_document(document_id));

create policy review_decisions_select on public.review_decisions
  for select to authenticated
  using (firm_id = public.current_firm_id() and public.can_access_document(document_id));

-- Reviewers/partners see the whole firm log. Staff see the history of the
-- clients they're assigned to (so they can read correction reasons), but not
-- security events.
create policy audit_events_select on public.audit_events
  for select to authenticated
  using (
    firm_id = public.current_firm_id()
    and (
      public.current_member_role() in ('reviewer', 'partner')
      or (client_id is not null and action <> 'access.denied' and public.can_access_client(client_id))
    )
  );

-- ---------------------------------------------------------------------------
-- Table privileges
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon;
revoke insert, update, delete, truncate on all tables in schema public from authenticated;
grant select on all tables in schema public to authenticated;

-- Not even the service role (backend admin key) may write history rows.
revoke insert, update, delete, truncate on public.audit_events from service_role;
revoke update, delete, truncate on public.document_versions, public.review_decisions from service_role;

-- ---------------------------------------------------------------------------
-- Function privileges: Supabase grants EXECUTE on new public functions to
-- anon/authenticated/service_role by default, so lock everything down first
-- and re-grant only the intended API surface.
-- ---------------------------------------------------------------------------

revoke execute on all functions in schema public from public, anon, authenticated, service_role;

grant execute on function
  public.current_firm_id(),
  public.current_member_role(),
  public.can_access_client(uuid),
  public.can_access_document(uuid),
  public.verify_audit_chain(),
  public.create_client(text, text, text, text[]),
  public.assign_staff(uuid, uuid),
  public.add_required_document(uuid, text),
  public.record_document_upload(uuid, text, text, text, bigint, text, text),
  public.start_review(uuid, integer),
  public.approve_document(uuid, integer, text),
  public.request_correction(uuid, text, integer),
  public.log_access_denied(text, uuid)
to authenticated;

-- RLS helper functions are also evaluated for the service role's own reads.
grant execute on function
  public.current_firm_id(),
  public.current_member_role(),
  public.can_access_client(uuid),
  public.can_access_document(uuid)
to service_role;
