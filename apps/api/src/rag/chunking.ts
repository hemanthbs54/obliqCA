import { encode } from 'gpt-tokenizer';

export interface ChunkOptions {
  maxTokens?: number;
  overlapTokens?: number;
}

export interface TextChunk {
  index: number;
  content: string;
  tokenCount: number;
}

const DEFAULT_MAX_TOKENS = 400;
const DEFAULT_OVERLAP_TOKENS = 50;

/** Splits on paragraph boundaries, then greedily packs into ~maxTokens windows with overlap. */
export function chunkText(text: string, options: ChunkOptions = {}): TextChunk[] {
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
  const overlapTokens = options.overlapTokens ?? DEFAULT_OVERLAP_TOKENS;

  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return [];

  const chunks: TextChunk[] = [];
  let currentParts: string[] = [];
  let currentTokens = 0;

  // Carries the tail of the just-flushed chunk into the next one (bounded by
  // overlapTokens) so context isn't lost at chunk boundaries.
  const flush = (): string | null => {
    if (currentParts.length === 0) return null;
    const content = currentParts.join('\n\n');
    chunks.push({ index: chunks.length, content, tokenCount: encode(content).length });
    const tail = currentParts[currentParts.length - 1] ?? '';
    return encode(tail).length <= overlapTokens ? tail : null;
  };

  const addPart = (part: string, tokens: number) => {
    if (currentTokens + tokens > maxTokens) {
      const overlap = flush();
      currentParts = overlap ? [overlap, part] : [part];
      currentTokens = (overlap ? encode(overlap).length : 0) + tokens;
    } else {
      currentParts.push(part);
      currentTokens += tokens;
    }
  };

  for (const paragraph of paragraphs) {
    const paragraphTokens = encode(paragraph).length;

    if (paragraphTokens > maxTokens) {
      // A single oversized paragraph — split on sentences as a fallback.
      for (const sentence of paragraph.split(/(?<=[.!?])\s+/)) {
        addPart(sentence, encode(sentence).length);
      }
      continue;
    }

    addPart(paragraph, paragraphTokens);
  }
  flush();

  return chunks;
}
