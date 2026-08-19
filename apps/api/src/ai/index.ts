import { env } from '../config/env.js';
import { registerProvider } from './provider.js';
import { createMockProvider } from './providers/mock.provider.js';
import { createOpenAIProvider } from './providers/openai.provider.js';
import { createGeminiProvider } from './providers/gemini.provider.js';
import { createGroqProvider } from './providers/groq.provider.js';

registerProvider('mock', createMockProvider);

// Real providers only register when their API key is present — selecting
// them via AI_*_PROVIDER without a key throws a clear "not registered"
// error from getAIProvider() rather than failing silently.
if (env.OPENAI_API_KEY) {
  registerProvider('openai', () => createOpenAIProvider(env.OPENAI_API_KEY!));
}
if (env.GEMINI_API_KEY) {
  registerProvider('gemini', () => createGeminiProvider(env.GEMINI_API_KEY!));
}
if (env.GROQ_API_KEY) {
  registerProvider('groq', () => createGroqProvider(env.GROQ_API_KEY!));
}
