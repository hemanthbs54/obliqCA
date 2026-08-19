-- Which filing types apply to which client.
create table client_filings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  filing_type_id uuid not null references filing_types(id),
  frequency_override text check (frequency_override in ('monthly', 'quarterly', 'annually')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (client_id, filing_type_id)
);
create index client_filings_client_id_idx on client_filings(client_id);
create index client_filings_owner_id_idx on client_filings(owner_id);

-- A single filing-period obligation, e.g. "GSTR-3B for Jul 2026, due 2026-08-20".
create table tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  client_filing_id uuid not null references client_filings(id) on delete cascade,
  period_label text not null,
  due_date date not null,
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'completed', 'overdue')),
  checklist jsonb not null default '[]',
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tasks_client_id_idx on tasks(client_id);
create index tasks_owner_id_due_date_idx on tasks(owner_id, due_date);
create index tasks_status_idx on tasks(status);

-- A file uploaded against a client (optionally tied to the task it supports).
create table documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  task_id uuid references tasks(id) on delete set null,
  file_name text not null,
  storage_path text not null,
  mime_type text,
  file_size_bytes bigint,
  doc_type text not null default 'other'
    check (doc_type in ('invoice', 'ledger', 'financial_statement', 'other')),
  status text not null default 'uploaded'
    check (status in ('uploaded', 'processing', 'processed', 'failed')),
  extracted_summary jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index documents_client_id_idx on documents(client_id);
create index documents_owner_id_idx on documents(owner_id);
