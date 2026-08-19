import type { ChatMessage, ExtractionRequest } from '../provider.js';

export function buildExtractionPrompt(req: ExtractionRequest): ChatMessage[] {
  return [
    {
      role: 'system',
      content:
        'You extract structured data from CA-firm documents (invoices, ledgers, financial statements). ' +
        'Respond with ONLY a JSON array, no prose, no markdown fences. ' +
        'Each element: {"field": string, "value": string | number | null, "confidence": number between 0 and 1, "sourceExcerpt": string | null}. ' +
        'Use null for value and 0 confidence when a field is genuinely not present in the text — never invent figures.',
    },
    {
      role: 'user',
      content: `Document type: ${req.documentType}\nFields to extract: ${req.fieldsToExtract.join(', ')}\n\nDocument text:\n${req.documentText.slice(0, 8000)}`,
    },
  ];
}
