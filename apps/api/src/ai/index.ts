import { registerProvider } from './provider.js';
import { createMockProvider } from './providers/mock.provider.js';

registerProvider('mock', createMockProvider);

// Real providers (openai/gemini/groq) register themselves here once their
// API key env vars are present — see milestone M6.
