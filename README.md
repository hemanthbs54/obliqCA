# Obliq-io

AI-powered compliance & workflow automation for Chartered Accountant (CA) firms — track client GST/TDS/ITR filings, auto-extract figures from uploaded documents via a RAG pipeline, and let a Compliance Agent flag what's overdue or missing.

> Status: under active scaffolding. See `/docs` (coming in later milestones) for full setup instructions.

## Monorepo layout

```
apps/web       Next.js 14 (App Router) + TypeScript + Tailwind — landing page, auth, dashboard
apps/api       Fastify + TypeScript — REST API, RAG pipeline, AI provider abstraction, compliance agent
packages/shared  Shared TypeScript types, Supabase client helpers, constants
supabase/      SQL migrations + seed data for the Postgres/pgvector schema
scripts/       One-off scripts (demo data seeding, etc.)
```

## Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Backend:** Node.js, Fastify, TypeScript
- **Database:** Supabase (Postgres) + `pgvector` for embeddings
- **Auth:** Supabase Auth (email/password)
- **AI:** pluggable provider abstraction (mock / OpenAI / Gemini / Groq) — runs fully offline in mock mode by default
- **Tooling:** pnpm workspaces + Turborepo, GitHub Actions CI/CD, Vercel (web) + Render (api)

## Getting started

```bash
pnpm install
pnpm dev
```

Environment variables and full local setup instructions are documented per-app in `apps/web/.env.local.example` and `apps/api/.env.example` (added as those apps are scaffolded).

## Development philosophy

Every AI-touching feature (RAG chat, document field extraction, compliance narratives) works out of the box in a deterministic **mock mode** with zero API keys, so the product is fully demoable without any external accounts. Flipping to a real LLM provider is a single environment variable change — no code changes required.
