/**
 * Standardized across every AI provider (OpenAI truncated via its `dimensions`
 * param, Gemini's text-embedding-004 is natively 768-dim, mock matches) so
 * `document_chunks.embedding` never needs a per-provider column width.
 */
export const EMBEDDING_DIM = 768;
