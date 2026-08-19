import { GoogleGenerativeAI } from '@google/generative-ai';
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

const CHAT_MODEL = 'gemini-1.5-flash';
const EMBEDDING_MODEL = 'text-embedding-004';

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
      const model = client.getGenerativeModel({ model: EMBEDDING_MODEL });
      const { embeddings } = await model.batchEmbedContents({
        requests: req.input.map((text) => ({
          content: { role: 'user', parts: [{ text }] },
          model: `models/${EMBEDDING_MODEL}`,
        })),
      });
      return {
        embeddings: embeddings.map((e) => e.values),
        provider: 'gemini',
        model: EMBEDDING_MODEL,
      };
    },

    async extractFields(req: ExtractionRequest): Promise<ExtractionResult> {
      const result = await complete({ messages: buildExtractionPrompt(req), temperature: 0 });
      return { fields: parseExtractionResponse(result.content, req.fieldsToExtract), provider: 'gemini' };
    },
  };
}
