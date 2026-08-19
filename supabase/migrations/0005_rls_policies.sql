alter table profiles enable row level security;
alter table clients enable row level security;
alter table filing_types enable row level security;
alter table client_filings enable row level security;
alter table tasks enable row level security;
alter table documents enable row level security;
alter table document_chunks enable row level security;
alter table compliance_status enable row level security;
alter table agent_runs enable row level security;
alter table rag_queries enable row level security;

create policy profiles_self on profiles for all
  using (auth.uid() = id) with check (auth.uid() = id);

-- Reference/catalog data: everyone authenticated can read, no direct writes.
create policy filing_types_read_all on filing_types for select
  using (true);

-- Generic per-tenant pattern: owner_id is denormalized onto every child table
-- specifically so each policy is a flat equality check with no joins.
create policy clients_owner on clients for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy client_filings_owner on client_filings for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy tasks_owner on tasks for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy documents_owner on documents for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy document_chunks_owner on document_chunks for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy compliance_status_owner on compliance_status for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy agent_runs_owner on agent_runs for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy rag_queries_owner on rag_queries for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
