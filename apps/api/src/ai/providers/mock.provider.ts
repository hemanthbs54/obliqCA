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
import { extractFieldsHeuristically } from './extraction-heuristics.js';

/** Deterministic string hash -> 32-bit seed. */
function hashString(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** mulberry32 PRNG — small, fast, deterministic given a seed. */
function mulberry32(seed: number) {
  let a = seed;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Same text always produces the same unit-normalized vector, giving pgvector real nearest-neighbor behavior across repeated demo queries. */
function embedText(text: string): number[] {
  const rand = mulberry32(hashString(text));
  const vector = Array.from({ length: EMBEDDING_DIM }, () => rand() * 2 - 1);
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vector.map((v) => v / norm);
}

function extractRagAnswer(userContent: string): string {
  const contextMatch = userContent.match(/RAG_CONTEXT:\n([\s\S]*?)\n\nQUESTION:/);
  const questionMatch = userContent.match(/QUESTION:\s*(.*)/);
  const context = contextMatch?.[1]?.trim() ?? '';
  const question = questionMatch?.[1]?.trim() ?? '';

  if (!context || context.startsWith('(no matching')) {
    return "I couldn't find any uploaded document content for this client yet — upload a document first, then ask again.";
  }

  const questionWords = question
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 3);

  const passages = context.split(/\n\n+/);
  let best = passages[0] ?? '';
  let bestScore = -1;
  for (const passage of passages) {
    const lower = passage.toLowerCase();
    const score = questionWords.reduce((s, w) => s + (lower.includes(w) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = passage;
    }
  }

  const cleaned = best.replace(/^\[\d+\]\s*\([^)]*\)\s*/, '').trim();
  return `Based on the uploaded document: "${cleaned.slice(0, 400)}"`;
}

function extractComplianceNarrative(userContent: string): string {
  const jsonMatch = userContent.match(/COMPLIANCE_JSON:\s*([\s\S]*)/);
  if (!jsonMatch) return 'Compliance status evaluated.';
  try {
    const data = JSON.parse(jsonMatch[1] ?? '{}') as {
      status: string;
      flags: { message: string }[];
    };
    if (data.flags.length === 0) {
      return 'This client is fully on track — no overdue filings or missing documents.';
    }
    const summary = data.flags.map((f) => f.message).join(' ');
    return `Status: ${data.status.replace('_', ' ')}. ${summary}`;
  } catch {
    return 'Compliance status evaluated.';
  }
}

export function createMockProvider(): AIProvider {
  return {
    name: 'mock',

    async complete(req: CompletionRequest): Promise<CompletionResult> {
      const userMessage = [...req.messages].reverse().find((m) => m.role === 'user');
      const content = userMessage?.content ?? '';

      let answer: string;
      if (content.includes('RAG_CONTEXT:')) {
        answer = extractRagAnswer(content);
      } else if (content.includes('COMPLIANCE_JSON:')) {
        answer = extractComplianceNarrative(content);
      } else {
        answer = "I don't have enough context to answer that in demo mode.";
      }

      return { content: answer, provider: 'mock', model: 'mock-echo-v1' };
    },

    async embed(req: EmbeddingRequest): Promise<EmbeddingResult> {
      return {
        embeddings: req.input.map(embedText),
        provider: 'mock',
        model: 'mock-embed-v1',
      };
    },

    async extractFields(req: ExtractionRequest): Promise<ExtractionResult> {
      return {
        fields: extractFieldsHeuristically(req.documentText, req.fieldsToExtract),
        provider: 'mock',
      };
    },
  };
}
