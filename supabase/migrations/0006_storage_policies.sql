-- Private bucket: the API's Supabase service-role client is the sole writer.
-- Path convention: {owner_id}/{client_id}/{document_id}-{filename}
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy storage_documents_owner_read on storage.objects for select
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
