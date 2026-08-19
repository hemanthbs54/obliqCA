create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated_at before update on profiles
  for each row execute function set_updated_at();
create trigger trg_clients_updated_at before update on clients
  for each row execute function set_updated_at();
create trigger trg_tasks_updated_at before update on tasks
  for each row execute function set_updated_at();
create trigger trg_documents_updated_at before update on documents
  for each row execute function set_updated_at();

-- Cosine-similarity search over a single client's document chunks, scoped by
-- owner_id/client_id inside the function body so it stays safe even if ever
-- called outside of the trusted backend service-role context.
create or replace function match_document_chunks(
  query_embedding vector(768),
  match_owner_id uuid,
  match_client_id uuid,
  match_document_id uuid default null,
  match_count int default 6
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  similarity float,
  metadata jsonb
)
language sql stable security definer set search_path = public as $$
  select
    dc.id,
    dc.document_id,
    dc.content,
    1 - (dc.embedding <=> query_embedding) as similarity,
    dc.metadata
  from document_chunks dc
  where dc.owner_id = match_owner_id
    and dc.client_id = match_client_id
    and (match_document_id is null or dc.document_id = match_document_id)
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;
