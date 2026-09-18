import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  /** Comma-separated list of allowed browser origins. */
  WEB_ORIGIN: z.string().default('http://localhost:3000'),

  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  STORAGE_BUCKET: z.string().default('audit-documents'),
  MAX_UPLOAD_BYTES: z.coerce.number().default(15 * 1024 * 1024),
  SIGNED_URL_TTL_SECONDS: z.coerce.number().default(60),
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
