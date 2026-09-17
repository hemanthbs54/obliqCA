-- Required audit documents, their uploaded versions, and review decisions.
--
-- Status flow (enforced by the workflow functions in 0004, not by clients):
--   pending ──upload──▶ uploaded ──start review──▶ under_review ──approve──▶ approved
--                          ▲                            │
--                          └──── re-upload ◀── correction_required ◀─┘ (request correction)

create type public.document_status as enum (
  'pending',
  'uploaded',
  'under_review',
  'correction_required',
  'approved'
);

create type public.review_decision as enum ('approved', 'correction_requested');

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null,
  client_id uuid not null,
  name text not null check (char_length(btrim(name)) between 2 and 120),
  status public.document_status not null default 'pending',
  current_version_id uuid,
  reviewer_id uuid references public.profiles (id) on delete set null,
  last_review_comment text,
  -- Optimistic concurrency token: every transition must quote the version it
  -- saw, so two reviewers acting on a stale screen can't both win.
  row_version integer not null default 1,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (firm_id, id),
  unique (client_id, name),
  foreign key (firm_id, client_id) references public.clients (firm_id, id) on delete cascade,
  check (status = 'pending' or current_version_id is not null)
);

create index documents_client_idx on public.documents (client_id);
create index documents_firm_status_idx on public.documents (firm_id, status);

-- Every upload is a new immutable version; nothing is overwritten, so the
-- history always shows exactly which file was rejected and which approved.
create table public.document_versions (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null,
  document_id uuid not null,
  version_no integer not null check (version_no > 0),
  storage_path text not null unique,
  file_name text not null check (char_length(file_name) between 1 and 255),
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  response_note text,
  uploaded_by uuid not null references public.profiles (id),
  uploaded_at timestamptz not null default now(),
  unique (document_id, version_no),
  unique (firm_id, id),
  foreign key (firm_id, document_id) references public.documents (firm_id, id) on delete cascade
);

alter table public.documents
  add constraint documents_current_version_fk
  foreign key (firm_id, current_version_id)
  references public.document_versions (firm_id, id)
  deferrable initially deferred;

create table public.review_decisions (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null,
  document_id uuid not null,
  version_id uuid not null,
  decision public.review_decision not null,
  comment text,
  reviewer_id uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  foreign key (firm_id, document_id) references public.documents (firm_id, id) on delete cascade,
  foreign key (firm_id, version_id) references public.document_versions (firm_id, id) on delete cascade,
  check (decision = 'approved' or char_length(btrim(coalesce(comment, ''))) >= 10)
);

create index review_decisions_document_idx on public.review_decisions (document_id, created_at);

create function public.can_access_document(p_document_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.documents d
    where d.id = p_document_id
      and d.firm_id = public.current_firm_id()
      and public.can_access_client(d.client_id)
  )
$$;
