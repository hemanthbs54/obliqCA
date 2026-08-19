import type { DocumentRecord, DocumentStatus, DocumentType, TypedSupabaseClient } from '@obliq/shared';
import { ApiError } from '../../plugins/error-handler.js';

const BUCKET = 'documents';

export async function createDocument(
  supabase: TypedSupabaseClient,
  ownerId: string,
  clientId: string,
  file: { fileName: string; mimeType: string | null; buffer: Buffer; docType: DocumentType; taskId?: string | null },
): Promise<DocumentRecord> {
  const { data: doc, error: insertError } = await supabase
    .from('documents')
    .insert({
      owner_id: ownerId,
      client_id: clientId,
      task_id: file.taskId ?? null,
      file_name: file.fileName,
      storage_path: '',
      mime_type: file.mimeType,
      file_size_bytes: file.buffer.byteLength,
      doc_type: file.docType,
      status: 'uploaded',
    })
    .select('*')
    .single();
  if (insertError) throw new ApiError(500, insertError.message);

  const storagePath = `${ownerId}/${clientId}/${doc.id}-${file.fileName}`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file.buffer, { contentType: file.mimeType ?? undefined, upsert: true });
  if (uploadError) throw new ApiError(500, uploadError.message);

  const { data: updated, error: updateError } = await supabase
    .from('documents')
    .update({ storage_path: storagePath })
    .eq('id', doc.id)
    .select('*')
    .single();
  if (updateError) throw new ApiError(500, updateError.message);

  return updated;
}

export async function listDocuments(
  supabase: TypedSupabaseClient,
  ownerId: string,
  clientId: string,
): Promise<DocumentRecord[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
  if (error) throw new ApiError(500, error.message);
  return data ?? [];
}

export async function getDocument(
  supabase: TypedSupabaseClient,
  ownerId: string,
  documentId: string,
): Promise<DocumentRecord> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('id', documentId)
    .maybeSingle();
  if (error) throw new ApiError(500, error.message);
  if (!data) throw new ApiError(404, 'Document not found');
  return data;
}

export async function downloadDocumentBuffer(supabase: TypedSupabaseClient, storagePath: string): Promise<Buffer> {
  const { data, error } = await supabase.storage.from(BUCKET).download(storagePath);
  if (error) throw new ApiError(500, error.message);
  return Buffer.from(await data.arrayBuffer());
}

export async function updateDocumentStatus(
  supabase: TypedSupabaseClient,
  documentId: string,
  patch: { status?: DocumentStatus; extractedSummary?: unknown; errorMessage?: string | null },
): Promise<void> {
  const update: Record<string, unknown> = {};
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.extractedSummary !== undefined) update.extracted_summary = patch.extractedSummary;
  if (patch.errorMessage !== undefined) update.error_message = patch.errorMessage;

  const { error } = await supabase.from('documents').update(update).eq('id', documentId);
  if (error) throw new ApiError(500, error.message);
}

export async function deleteDocument(supabase: TypedSupabaseClient, ownerId: string, documentId: string): Promise<void> {
  const doc = await getDocument(supabase, ownerId, documentId);
  await supabase.storage.from(BUCKET).remove([doc.storage_path]);
  const { error } = await supabase.from('documents').delete().eq('owner_id', ownerId).eq('id', documentId);
  if (error) throw new ApiError(500, error.message);
}
