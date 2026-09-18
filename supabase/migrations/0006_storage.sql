-- Private bucket for uploaded audit documents.
-- Object path: {firm_id}/{client_id}/{document_id}/v{n}-{file_name}
--
-- Users get no direct write access. The API uploads after the database has
-- authorised the user, and record_document_upload() re-checks the path
-- prefix. Reads happen through short-lived signed URLs issued by the API
-- after an RLS-checked lookup; the select policy below additionally lets a
-- signed-in user read only their own firm's accessible documents.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'audit-documents',
  'audit-documents',
  false,
  15 * 1024 * 1024,
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do nothing;

create function public.storage_object_accessible(p_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_parts text[] := storage.foldername(p_name);
begin
  if array_length(v_parts, 1) < 3 or v_parts[1] <> public.current_firm_id()::text then
    return false;
  end if;
  return public.can_access_document(v_parts[3]::uuid);
exception
  when invalid_text_representation then
    return false;
end;
$$;

revoke execute on function public.storage_object_accessible(text) from public, anon;
grant execute on function public.storage_object_accessible(text) to authenticated;

create policy audit_documents_read on storage.objects
  for select to authenticated
  using (bucket_id = 'audit-documents' and public.storage_object_accessible(name));
