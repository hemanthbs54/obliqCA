import Groq from 'groq-sdk';
import type {
  AIProvider,
  CompletionRequest,
  CompletionResult,
  EmbeddingRequest,
  EmbeddingResult,
  ExtractionRequest,
  ExtractionResult,
} from '../provider.js';
import { buildExtractionPrompt } from '../prompts/extraction.prompt.js';
import { parseExtractionResponse } from './parse-extraction-response.js';

const CHAT_MODEL = 'llama-3.3-70b-versatile';

export function createGroqProvider(apiKey: string): AIProvider {
  const client = new Groq({ apiKey });

  return {
    name: 'groq',

    async complete(req: CompletionRequest): Promise<CompletionResult> {
      const response = await client.chat.completions.create({
        model: CHAT_MODEL,
        messages: req.messages,
        temperature: req.temperature ?? 0.3,
        max_tokens: req.maxTokens,
      });
      return {
        content: response.choices[0]?.message.content ?? '',
        provider: 'groq',
        model: CHAT_MODEL,
      };
    },

    // Groq is inference-only — no embeddings endpoint. Callers should route
    // embedding purpose to openai/gemini/mock (enforced in getAIProvider()).
    async embed(_req: EmbeddingRequest): Promise<EmbeddingResult> {
      throw new Error('Groq has no embeddings API. Set AI_EMBEDDING_PROVIDER to openai, gemini, or mock.');
    },

    async extractFields(req: ExtractionRequest): Promise<ExtractionResult> {
      const response = await client.chat.completions.create({
        model: CHAT_MODEL,
        messages: buildExtractionPrompt(req),
        temperature: 0,
      });
      const content = response.choices[0]?.message.content ?? '[]';
      return { fields: parseExtractionResponse(content, req.fieldsToExtract), provider: 'groq' };
    },
  };
}
