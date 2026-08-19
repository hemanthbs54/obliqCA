import { describe, expect, it } from 'vitest';
import { createMockProvider } from '../ai/providers/mock.provider.js';
import { buildChatPrompt } from '../ai/prompts/chat.prompt.js';

const SAMPLE_INVOICE = `
Tax Invoice
Invoice Number: INV-2026-0042
Invoice Date: 15/07/2026
GSTIN: 27ABCDE1234F1Z5
Taxable Value: Rs. 50,000
CGST: Rs. 4,500
SGST: Rs. 4,500
Grand Total: Rs. 59,000
`;

describe('mock AI provider', () => {
  const provider = createMockProvider();

  it('embeds deterministically: same text -> identical vector, different text -> different vector', async () => {
    const { embeddings } = await provider.embed({ input: [SAMPLE_INVOICE, SAMPLE_INVOICE, 'unrelated text'] });
    expect(embeddings[0]).toHaveLength(768);
    expect(embeddings[0]).toEqual(embeddings[1]);
    expect(embeddings[0]).not.toEqual(embeddings[2]);
  });

  it('extracts real figures from document text via regex heuristics, not canned values', async () => {
    const { fields } = await provider.extractFields({
      documentText: SAMPLE_INVOICE,
      documentType: 'invoice',
      fieldsToExtract: ['gstin', 'taxable_amount', 'gst_liability', 'igst'],
    });
    const byField = Object.fromEntries(fields.map((f) => [f.field, f]));

    expect(byField.gstin?.value).toBe('27ABCDE1234F1Z5');
    expect(byField.taxable_amount?.value).toBe(50000);
    expect(byField.gst_liability?.value).toBe(9000); // CGST + SGST
    expect(byField.igst?.value).toBeNull(); // genuinely absent from the text
    expect(byField.igst?.confidence).toBe(0);
  });

  it('answers RAG questions grounded in the retrieved context', async () => {
    const messages = buildChatPrompt('What was the taxable value?', [
      { content: SAMPLE_INVOICE, documentName: 'invoice.pdf' },
    ]);
    const result = await provider.complete({ messages });
    expect(result.content).toContain('50,000');
  });

  it('says so when there is no matching document content', async () => {
    const messages = buildChatPrompt('What was the taxable value?', []);
    const result = await provider.complete({ messages });
    expect(result.content.toLowerCase()).toContain("couldn't find");
  });

  it('phrases a compliance narrative from structured flags', async () => {
    const evaluation = {
      status: 'overdue',
      flags: [{ message: 'GSTR-3B for Jul 2026 is overdue.', severity: 'critical', type: 'overdue_filing' }],
    };
    const result = await provider.complete({
      messages: [
        { role: 'system', content: 'narrative' },
        { role: 'user', content: `COMPLIANCE_JSON: ${JSON.stringify(evaluation)}` },
      ],
    });
    expect(result.content).toContain('overdue');
    expect(result.content).toContain('GSTR-3B for Jul 2026 is overdue.');
  });
});
