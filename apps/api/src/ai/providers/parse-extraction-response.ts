import type { ExtractedField } from '../provider.js';

/** Real providers are asked to return a bare JSON array; strips markdown fences defensively and falls back to empty fields on malformed output. */
export function parseExtractionResponse(content: string, fields: string[]): ExtractedField[] {
  const cleaned = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  try {
    const parsed = JSON.parse(cleaned) as unknown;
    if (!Array.isArray(parsed)) throw new Error('not an array');

    const byField = new Map<string, ExtractedField>();
    for (const item of parsed) {
      if (item && typeof item === 'object' && 'field' in item) {
        const field = String((item as Record<string, unknown>).field);
        byField.set(field, {
          field,
          value: (item as Record<string, unknown>).value as string | number | null,
          confidence: Number((item as Record<string, unknown>).confidence) || 0,
          sourceExcerpt: (item as Record<string, unknown>).sourceExcerpt as string | undefined,
        });
      }
    }

    return fields.map((field) => byField.get(field) ?? { field, value: null, confidence: 0 });
  } catch {
    return fields.map((field) => ({ field, value: null, confidence: 0 }));
  }
}
