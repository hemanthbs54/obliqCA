import type { AIProvider } from '../ai/provider.js';
import type { TextChunk } from './chunking.js';

const BATCH_SIZE = 20;

export interface EmbeddedChunk extends TextChunk {
  embedding: number[];
}

export async function embedChunks(chunks: TextChunk[], provider: AIProvider): Promise<EmbeddedChunk[]> {
  const results: EmbeddedChunk[] = [];

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const { embeddings } = await provider.embed({ input: batch.map((c) => c.content) });
    batch.forEach((chunk, idx) => {
      const embedding = embeddings[idx];
      if (embedding) results.push({ ...chunk, embedding });
    });
  }

  return results;
}
