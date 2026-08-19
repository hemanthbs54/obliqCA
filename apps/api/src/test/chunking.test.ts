import { describe, expect, it } from 'vitest';
import { chunkText } from '../rag/chunking.js';

describe('chunkText', () => {
  it('returns no chunks for empty input', () => {
    expect(chunkText('')).toEqual([]);
    expect(chunkText('   \n\n  ')).toEqual([]);
  });

  it('keeps short text in a single chunk', () => {
    const chunks = chunkText('Invoice total: Rs. 1,000.\n\nThank you.');
    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.index).toBe(0);
    expect(chunks[0]?.content).toContain('Invoice total');
  });

  it('splits long text into multiple token-bounded chunks', () => {
    const paragraph = 'Lorem ipsum dolor sit amet consectetur adipiscing elit. '.repeat(40);
    const longText = Array.from({ length: 20 }, (_, i) => `${paragraph} Section ${i}.`).join('\n\n');

    const chunks = chunkText(longText, { maxTokens: 100, overlapTokens: 20 });

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.tokenCount).toBeLessThanOrEqual(140); // maxTokens + a little overlap slack
    }
  });

  it('assigns sequential indexes', () => {
    const longText = Array.from({ length: 10 }, (_, i) => `Paragraph number ${i}. `.repeat(30)).join('\n\n');
    const chunks = chunkText(longText, { maxTokens: 50 });
    chunks.forEach((chunk, i) => expect(chunk.index).toBe(i));
  });
});
