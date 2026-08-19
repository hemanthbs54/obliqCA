import { env } from '../config/env.js';

export type AIProviderName = 'mock' | 'openai' | 'gemini' | 'groq';
export type AIPurpose = 'chat' | 'embedding' | 'extraction';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionRequest {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface CompletionResult {
  content: string;
  provider: AIProviderName;
  model: string;
}

export interface EmbeddingRequest {
  input: string[];
}

export interface EmbeddingResult {
  embeddings: number[][];
  provider: AIProviderName;
  model: string;
}

export interface ExtractionRequest {
  documentText: string;
  documentType: 'invoice' | 'ledger' | 'financial_statement' | 'other';
  fieldsToExtract: string[];
}

export interface ExtractedField {
  field: string;
  value: string | number | null;
  confidence: number;
  sourceExcerpt?: string;
}

export interface ExtractionResult {
  fields: ExtractedField[];
  provider: AIProviderName;
}

export interface AIProvider {
  readonly name: AIProviderName;
  complete(req: CompletionRequest): Promise<CompletionResult>;
  embed(req: EmbeddingRequest): Promise<EmbeddingResult>;
  extractFields(req: ExtractionRequest): Promise<ExtractionResult>;
}

const providerFactories: Partial<Record<AIProviderName, () => AIProvider>> = {};

/** Registered lazily by each provider module so unconfigured SDKs are never imported. */
export function registerProvider(name: AIProviderName, factory: () => AIProvider) {
  providerFactories[name] = factory;
}

const instances = new Map<AIProviderName, AIProvider>();

function resolveProviderName(purpose: AIPurpose): AIProviderName {
  const purposeKey =
    purpose === 'embedding' ? env.AI_EMBEDDING_PROVIDER
    : purpose === 'extraction' ? env.AI_EXTRACTION_PROVIDER
    : env.AI_CHAT_PROVIDER;
  const selected = purposeKey ?? env.AI_PROVIDER;

  if (purpose === 'embedding' && selected === 'groq') {
    throw new Error(
      'Groq has no embeddings API — set AI_EMBEDDING_PROVIDER to openai, gemini, or mock.',
    );
  }
  return selected;
}

export function getAIProvider(purpose: AIPurpose): AIProvider {
  const name = resolveProviderName(purpose);

  let instance = instances.get(name);
  if (!instance) {
    const factory = providerFactories[name];
    if (!factory) {
      throw new Error(`AI provider "${name}" is not registered/configured.`);
    }
    instance = factory();
    instances.set(name, instance);
  }
  return instance;
}
