import { GoogleGenerativeAI } from '@google/generative-ai';
import { EMBEDDING_DIM } from '@obliq/shared';
import type {
  AIProvider,
  ChatMessage,
  CompletionRequest,
  CompletionResult,
  EmbeddingRequest,
  EmbeddingResult,
  ExtractionRequest,
  ExtractionResult,
} from '../provider.js';
import { buildExtractionPrompt } from '../prompts/extraction.prompt.js';
import { parseExtractionResponse } from './parse-extraction-response.js';

// Current as of this writing — Gemini retires model names over time, so if
// either of these ever 404s, check `GET /v1beta/models?key=...` for the
// current stable name and update here.
const CHAT_MODEL = 'gemini-2.5-flash';
const EMBEDDING_MODEL = 'gemini-embedding-001';

/** Gemini has no "system" role — fold system messages into a separate systemInstruction and map assistant -> model. */
function toGeminiRequest(messages: ChatMessage[]) {
  const systemInstruction = messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n\n');
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
  return { systemInstruction, contents };
}

export function createGeminiProvider(apiKey: string): AIProvider {
  const client = new GoogleGenerativeAI(apiKey);

  // The installed SDK's typed embedContent/batchEmbedContents methods predate
  // Gemini's `outputDimensionality` param, so we call the REST endpoint
  // directly to guarantee vectors come back at EMBEDDING_DIM (768) — the
  // width our pgvector column is fixed to — rather than the model's 3072-dim
  // default.
  async function embedBatch(texts: string[]): Promise<number[][]> {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:batchEmbedContents?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: texts.map((text) => ({
            model: `models/${EMBEDDING_MODEL}`,
            content: { parts: [{ text }] },
            outputDimensionality: EMBEDDING_DIM,
          })),
        }),
      },
    );
    if (!res.ok) {
      throw new Error(`Gemini embedContent failed: ${res.status} ${await res.text()}`);
    }
    const data = (await res.json()) as { embeddings: { values: number[] }[] };
    return data.embeddings.map((e) => e.values);
  }

  async function complete(req: CompletionRequest): Promise<CompletionResult> {
    const { systemInstruction, contents } = toGeminiRequest(req.messages);
    const model = client.getGenerativeModel({ model: CHAT_MODEL, systemInstruction });
    const result = await model.generateContent({
      contents,
      generationConfig: { temperature: req.temperature ?? 0.3, maxOutputTokens: req.maxTokens },
    });
    return { content: result.response.text(), provider: 'gemini', model: CHAT_MODEL };
  }

  return {
    name: 'gemini',
    complete,

    async embed(req: EmbeddingRequest): Promise<EmbeddingResult> {
      const embeddings = await embedBatch(req.input);
      return { embeddings, provider: 'gemini', model: EMBEDDING_MODEL };
    },

    async extractFields(req: ExtractionRequest): Promise<ExtractionResult> {
      const result = await complete({ messages: buildExtractionPrompt(req), temperature: 0 });
      return { fields: parseExtractionResponse(result.content, req.fieldsToExtract), provider: 'gemini' };
    },
  };
}
