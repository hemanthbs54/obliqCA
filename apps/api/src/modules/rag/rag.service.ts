import type { RagQuery, RagQueryResponse, TypedSupabaseClient } from '@obliq/shared';
import { ApiError } from '../../plugins/error-handler.js';
import { getAIProvider } from '../../ai/provider.js';
import { buildChatPrompt } from '../../ai/prompts/chat.prompt.js';
import { similaritySearch } from '../../rag/retrieval.js';

export async function queryRag(
  supabase: TypedSupabaseClient,
  ownerId: string,
  clientId: string,
  question: string,
  documentId?: string,
): Promise<RagQueryResponse> {
  const embeddingProvider = getAIProvider('embedding');
  const { embeddings } = await embeddingProvider.embed({ input: [question] });
  const queryEmbedding = embeddings[0];
  if (!queryEmbedding) throw new ApiError(500, 'Failed to embed question');

  const matches = await similaritySearch(supabase, {
    ownerId,
    clientId,
    queryEmbedding,
    documentId,
    matchCount: 6,
  });

  const documentNames = new Map<string, string>();
  if (matches.length > 0) {
    const { data: docs } = await supabase
      .from('documents')
      .select('id, file_name')
      .in('id', [...new Set(matches.map((m) => m.documentId))]);
    for (const d of docs ?? []) documentNames.set(d.id, d.file_name);
  }

  const chatProvider = getAIProvider('chat');
  const messages = buildChatPrompt(
    question,
    matches.map((m) => ({ content: m.content, documentName: documentNames.get(m.documentId) ?? 'document' })),
  );
  const completion = await chatProvider.complete({ messages });

  const { error: insertError } = await supabase.from('rag_queries').insert({
    owner_id: ownerId,
    client_id: clientId,
    question,
    answer: completion.content,
    source_chunk_ids: matches.map((m) => m.chunkId),
    provider: completion.provider,
  });
  if (insertError) throw new ApiError(500, insertError.message);

  return {
    answer: completion.content,
    sources: matches.map((m) => ({
      chunkId: m.chunkId,
      documentId: m.documentId,
      documentName: documentNames.get(m.documentId) ?? 'document',
      excerpt: m.content.slice(0, 200),
      similarity: m.similarity,
    })),
    provider: completion.provider,
  };
}

export async function listRagHistory(
  supabase: TypedSupabaseClient,
  ownerId: string,
  clientId: string,
): Promise<RagQuery[]> {
  const { data, error } = await supabase
    .from('rag_queries')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw new ApiError(500, error.message);
  return data ?? [];
}
