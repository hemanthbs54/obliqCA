-- Wipes all firm data so `pnpm seed` can rebuild the demo from scratch.
-- Must run as the database owner (Supabase SQL editor / `postgres`): the
-- audit tables are append-only for every application role, and only the
-- owner can temporarily disable those triggers. Locally, prefer
-- `supabase db reset`, which rebuilds the whole database.

begin;

alter table public.audit_events disable trigger user;
alter table public.document_versions disable trigger user;
alter table public.review_decisions disable trigger user;

truncate public.audit_events, public.review_decisions, public.document_versions,
  public.documents, public.client_assignments, public.clients,
  public.firm_memberships, public.profiles, public.firms
cascade;

alter table public.audit_events enable trigger user;
alter table public.document_versions enable trigger user;
alter table public.review_decisions enable trigger user;

delete from auth.users where email like '%@abc-co.demo' or email like '%@xyz-co.demo';

commit;
