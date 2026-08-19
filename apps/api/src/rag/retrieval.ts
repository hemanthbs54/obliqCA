import type { TypedSupabaseClient } from '@obliq/shared';
import { ApiError } from '../plugins/error-handler.js';

export interface SimilaritySearchParams {
  ownerId: string;
  clientId: string;
  queryEmbedding: number[];
  documentId?: string;
  matchCount?: number;
}

export interface SimilaritySearchResult {
  chunkId: string;
  documentId: string;
  content: string;
  similarity: number;
  metadata: Record<string, unknown>;
}

export async function similaritySearch(
  supabase: TypedSupabaseClient,
  params: SimilaritySearchParams,
): Promise<SimilaritySearchResult[]> {
  const { data, error } = await supabase.rpc('match_document_chunks', {
    query_embedding: params.queryEmbedding,
    match_owner_id: params.ownerId,
    match_client_id: params.clientId,
    match_document_id: params.documentId ?? null,
    match_count: params.matchCount ?? 6,
  });

  if (error) throw new ApiError(500, error.message);

  return (data ?? []).map((row) => ({
    chunkId: row.id,
    documentId: row.document_id,
    content: row.content,
    similarity: row.similarity,
    metadata: row.metadata,
  }));
}
