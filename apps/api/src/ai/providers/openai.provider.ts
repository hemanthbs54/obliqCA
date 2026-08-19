import OpenAI from 'openai';
import { EMBEDDING_DIM } from '@obliq/shared';
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

const CHAT_MODEL = 'gpt-4o-mini';
const EMBEDDING_MODEL = 'text-embedding-3-small';

export function createOpenAIProvider(apiKey: string): AIProvider {
  const client = new OpenAI({ apiKey });

  return {
    name: 'openai',

    async complete(req: CompletionRequest): Promise<CompletionResult> {
      const response = await client.chat.completions.create({
        model: CHAT_MODEL,
        messages: req.messages,
        temperature: req.temperature ?? 0.3,
        max_tokens: req.maxTokens,
      });
      return {
        content: response.choices[0]?.message.content ?? '',
        provider: 'openai',
        model: CHAT_MODEL,
      };
    },

    async embed(req: EmbeddingRequest): Promise<EmbeddingResult> {
      const response = await client.embeddings.create({
        model: EMBEDDING_MODEL,
        input: req.input,
        dimensions: EMBEDDING_DIM,
      });
      return {
        embeddings: response.data.map((d) => d.embedding),
        provider: 'openai',
        model: EMBEDDING_MODEL,
      };
    },

    async extractFields(req: ExtractionRequest): Promise<ExtractionResult> {
      const response = await client.chat.completions.create({
        model: CHAT_MODEL,
        messages: buildExtractionPrompt(req),
        temperature: 0,
      });
      const content = response.choices[0]?.message.content ?? '[]';
      return { fields: parseExtractionResponse(content, req.fieldsToExtract), provider: 'openai' };
    },
  };
}
