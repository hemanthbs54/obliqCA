-- Chunked + embedded document text for RAG retrieval.
-- Embedding dimension is standardized at 768 across all AI providers
-- (OpenAI truncated via the `dimensions` param, Gemini native, mock matches).
create table document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  chunk_index int not null,
  content text not null,
  token_count int,
  embedding vector(768) not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index document_chunks_document_id_idx on document_chunks(document_id);
create index document_chunks_client_id_idx on document_chunks(client_id);
-- HNSW: no list-count tuning needed, good default for pgvector on Supabase.
create index document_chunks_embedding_idx
  on document_chunks using hnsw (embedding vector_cosine_ops);

-- Persisted cache/audit-trail of the Compliance Agent's last evaluation per client.
-- Source of truth is still the live evaluateCompliance() read; this table is for
-- history + fast dashboard reads without recomputation.
create table compliance_status (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null unique references clients(id) on delete cascade,
  status text not null default 'on_track'
    check (status in ('on_track', 'due_soon', 'overdue', 'missing_docs')),
  next_due_date date,
  next_due_filing_type text,
  overdue_count int not null default 0,
  missing_docs_count int not null default 0,
  details jsonb not null default '[]',
  last_evaluated_at timestamptz not null default now()
);

-- Audit trail of every AI-agent invocation (compliance check, extraction, RAG query).
create table agent_runs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references clients(id) on delete cascade,
  document_id uuid references documents(id) on delete cascade,
  run_type text not null check (run_type in ('compliance_check', 'document_extraction', 'rag_query')),
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed')),
  provider text not null default 'mock',
  input jsonb,
  output jsonb,
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);
create index agent_runs_client_id_idx on agent_runs(client_id);

-- History of RAG chat questions/answers per client, for the chat UI.
create table rag_queries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  question text not null,
  answer text,
  source_chunk_ids uuid[],
  provider text,
  created_at timestamptz not null default now()
);
