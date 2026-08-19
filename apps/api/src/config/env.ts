import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  WEB_ORIGIN: z.string().default('http://localhost:3000'),

  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  AI_PROVIDER: z.enum(['mock', 'openai', 'gemini', 'groq']).default('mock'),
  AI_CHAT_PROVIDER: z.enum(['mock', 'openai', 'gemini', 'groq']).optional(),
  AI_EMBEDDING_PROVIDER: z.enum(['mock', 'openai', 'gemini', 'groq']).optional(),
  AI_EXTRACTION_PROVIDER: z.enum(['mock', 'openai', 'gemini', 'groq']).optional(),

  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment configuration — see errors above.');
  }
  return parsed.data;
}

export const env = loadEnv();
