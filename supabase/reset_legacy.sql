-- ONE-TIME: run in the Supabase SQL editor on a project that still has the
-- previous GST/RAG compliance schema, BEFORE applying migrations 0001–0006.
-- The old product is preserved in git at tag `legacy-compliance-v1`.
-- (The old private `documents` storage bucket is left in place; empty and
-- delete it from Storage in the dashboard if you no longer need it.)

drop function if exists public.match_document_chunks cascade;
drop function if exists public.set_updated_at cascade;

drop table if exists
  public.rag_queries,
  public.agent_runs,
  public.compliance_status,
  public.document_chunks,
  public.documents,
  public.tasks,
  public.client_filings,
  public.filing_types,
  public.clients,
  public.profiles
cascade;

drop policy if exists storage_documents_owner_read on storage.objects;
