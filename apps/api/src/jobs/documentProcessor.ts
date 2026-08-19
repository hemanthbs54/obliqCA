import { EXTRACTION_FIELDS_BY_DOC_TYPE, type TypedSupabaseClient } from '@obliq/shared';
import { getAIProvider } from '../ai/provider.js';
import { chunkText } from '../rag/chunking.js';
import { embedChunks } from '../rag/embeddings.js';
import { extractText } from '../rag/extraction/index.js';
import {
  downloadDocumentBuffer,
  getDocument,
  updateDocumentStatus,
} from '../modules/documents/documents.service.js';

/**
 * Full pipeline: download -> extract text -> chunk -> embed -> store ->
 * extract key fields. Fire-and-forget from the upload route; the web app
 * polls document status (uploaded -> processing -> processed/failed).
 */
export async function processDocument(
  supabase: TypedSupabaseClient,
  ownerId: string,
  documentId: string,
): Promise<void> {
  const doc = await getDocument(supabase, ownerId, documentId);

  await updateDocumentStatus(supabase, documentId, { status: 'processing' });

  try {
    const buffer = await downloadDocumentBuffer(supabase, doc.storage_path);
    const text = await extractText(buffer, doc.mime_type, doc.file_name);

    if (!text.trim()) {
      throw new Error('No extractable text found in this document.');
    }

    const chunks = chunkText(text);
    const embeddingProvider = getAIProvider('embedding');
    const embedded = await embedChunks(chunks, embeddingProvider);

    if (embedded.length > 0) {
      const { error: chunkError } = await supabase.from('document_chunks').insert(
        embedded.map((chunk) => ({
          document_id: documentId,
          owner_id: doc.owner_id,
          client_id: doc.client_id,
          chunk_index: chunk.index,
          content: chunk.content,
          token_count: chunk.tokenCount,
          embedding: chunk.embedding,
          metadata: {},
        })),
      );
      if (chunkError) throw new Error(chunkError.message);
    }

    const extractionProvider = getAIProvider('extraction');
    const fields = EXTRACTION_FIELDS_BY_DOC_TYPE[doc.doc_type];
    const { fields: extractedFields } = await extractionProvider.extractFields({
      documentText: text,
      documentType: doc.doc_type,
      fieldsToExtract: fields,
    });

    await supabase.from('agent_runs').insert({
      owner_id: doc.owner_id,
      client_id: doc.client_id,
      document_id: documentId,
      run_type: 'document_extraction',
      status: 'completed',
      provider: extractionProvider.name,
      input: { docType: doc.doc_type, fields },
      output: { fields: extractedFields },
      completed_at: new Date().toISOString(),
    });

    await updateDocumentStatus(supabase, documentId, {
      status: 'processed',
      extractedSummary: { fields: extractedFields },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown processing error';
    await updateDocumentStatus(supabase, documentId, { status: 'failed', errorMessage: message });
  }
}
