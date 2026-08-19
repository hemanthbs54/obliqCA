import type { ChatMessage } from '../provider.js';

export interface RagContextChunk {
  content: string;
  documentName: string;
}

/**
 * The `RAG_CONTEXT:` / `QUESTION:` markers are a convention the mock
 * provider parses to ground its canned-but-real answers in the retrieved
 * text. Real LLM providers ignore the markers and just read the prompt
 * naturally, so the same builder works for both.
 */
export function buildChatPrompt(question: string, chunks: RagContextChunk[]): ChatMessage[] {
  const context = chunks
    .map((c, i) => `[${i + 1}] (${c.documentName}) ${c.content}`)
    .join('\n\n');

  return [
    {
      role: 'system',
      content:
        'You are Obliq, an assistant for a Chartered Accountant firm. Answer the question using ONLY the provided document context. Cite figures exactly as they appear. If the context does not contain the answer, say so plainly.',
    },
    {
      role: 'user',
      content: `RAG_CONTEXT:\n${context || '(no matching document content found)'}\n\nQUESTION: ${question}`,
    },
  ];
}
