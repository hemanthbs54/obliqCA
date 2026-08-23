# Obliq-io

AI-powered compliance & workflow automation for Chartered Accountant (CA) firms — track client GST/TDS/ITR filings, extract key figures from uploaded documents via a RAG pipeline, and let a Compliance Agent flag what's overdue or missing before your client has to ask.

The whole product runs **fully offline in a deterministic mock AI mode** with zero API keys — every RAG answer, extracted figure, and compliance narrative is real (grounded in whatever you actually upload), not canned. Flipping to a live LLM (Gemini, Groq, or OpenAI) is a one-line env var change.

## Monorepo layout

```
apps/web         Next.js 14 (App Router) + TypeScript + Tailwind — landing page, auth, dashboard
apps/api          Fastify + TypeScript — REST API, RAG pipeline, AI provider abstraction, compliance agent
packages/shared   Shared TypeScript types, Supabase client helpers, constants
supabase/         SQL migrations + seed data for the Postgres/pgvector schema
scripts/          seed-demo-data.ts, bootstrap.sh, and ops/ (smoke-test.ps1, health-check.py)
.github/          CI (lint/typecheck/test/build) + deploy (Vercel + Render + smoke test) + PR automation
```

## Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, TanStack Query |
| Backend | Node.js, Fastify, TypeScript, Zod |
| Database | Supabase (Postgres) + `pgvector` for embeddings |
| Auth | Supabase Auth (email/password) |
| AI | Pluggable provider abstraction — mock (default) / OpenAI / Gemini / Groq |
| Tooling | pnpm workspaces + Turborepo, GitHub Actions, Vercel (web) + Render (api) |

## Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm` if you don't have it)
- A free [Supabase](https://supabase.com) project (needed for auth + database + storage — the app cannot run without one)

## Setup

> **Shortcut:** `./scripts/bootstrap.sh` checks your Node/pnpm versions, runs `pnpm install`, and scaffolds both `.env` files from their `.example` templates in one go (steps 1 and 3 below). You still need to fill in real Supabase values afterward.

### 1. Install dependencies

```bash
pnpm install
```

### 2. Create a Supabase project and apply the schema

1. Create a new project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run each file in `supabase/migrations/` **in order** (`0001_...` through `0006_...`).
3. Run `supabase/seed.sql` once to load the GST/TDS/ITR filing-type catalog.
4. In **Authentication → Providers**, confirm Email is enabled. In **Authentication → Settings**, turning **off** "Confirm email" is recommended for a frictionless demo (the app doesn't require it, but it saves a step).
5. Copy your Project URL, `anon` key, and `service_role` key from **Project Settings → API**.

### 3. Configure environment variables

```bash
cp apps/web/.env.local.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
```

Fill in `apps/web/.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Fill in `apps/api/.env`:

```
PORT=4000
WEB_ORIGIN=http://localhost:3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Leave the `AI_*` lines commented out to run in mock mode (recommended for first run — see [Going live with a real LLM](#going-live-with-a-real-llm) below).

### 4. (Optional) Seed demo data

Populates your project with a demo firm and four clients that deliberately land in every compliance status (overdue, missing docs, due soon, on track), so the dashboard looks real immediately:

```bash
pnpm seed
```

This prints a login (`demo@obliq.io` / `ObliqDemo123!`) you can use right away. Safe to re-run — it wipes and re-creates that user's clients each time.

### 5. Run the app

```bash
pnpm dev
```

This starts both `apps/web` (http://localhost:3000) and `apps/api` (http://localhost:4000, Swagger docs at `/docs`) via Turborepo. Sign up (or log in with the seeded demo account), and you'll land on the dashboard.

## Going live with a real LLM

Every AI-touching feature (RAG chat, document field extraction, compliance narratives) works out of the box with **no API keys** via a deterministic mock provider — see [`apps/api/src/ai/providers/mock.provider.ts`](apps/api/src/ai/providers/mock.provider.ts). It's not canned text: it deterministically embeds real content for pgvector similarity search, and regex/heuristically extracts real figures (GSTIN, amounts, dates) from whatever you upload.

To switch a purpose over to a real model, set the corresponding env var in `apps/api/.env` and restart the API:

```bash
# Uses OpenAI for chat, Gemini for embeddings, mock for extraction — mix and match freely.
AI_CHAT_PROVIDER=openai
AI_EMBEDDING_PROVIDER=gemini
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...

# Or set one blanket default for everything:
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

Groq has no embeddings API — don't set `AI_EMBEDDING_PROVIDER=groq` (it fails fast with a clear error). Check what's active anytime at `GET /api/ai/status`.

## Architecture notes

- **Auth**: Supabase Auth handles email/password + sessions; `apps/web/middleware.ts` gates `/dashboard/*`. The API verifies the bearer token on every `/api/*` request via `supabase.auth.getUser()`.
- **Multi-tenancy**: every table carries a denormalized `owner_id` so both Postgres RLS policies (`supabase/migrations/0005_rls_policies.sql`) and the API's own scoping are flat `owner_id = auth.uid()` checks — no joins needed to enforce isolation.
- **Compliance status is computed live**, not just read from a cache: `apps/api/src/modules/agent/agent.rules.ts` is a pure function over open tasks + linked documents, evaluated on every dashboard/client read so a status never silently goes stale as a due date passes. The `compliance_status` table is a persisted audit trail written when you explicitly run the agent (for its AI-phrased narrative), not the source of truth for the badge you see.
- **RAG pipeline**: upload → pdf-parse/xlsx text extraction → paragraph-aware token chunking → embed → pgvector (`document_chunks`, HNSW cosine index) → `match_document_chunks` similarity search → grounded chat answer. See `apps/api/src/rag/` and `apps/api/src/jobs/documentProcessor.ts`.
- **"Missing document" detection** keys off a document's optional `task_id` link (set at upload time via the task picker in the Documents tab) — without an explicit link, every near-due task would trivially read as missing its paperwork.

## Testing

```bash
pnpm turbo run test
```

Runs Vitest across the workspace: on `apps/api`, unit tests for the RAG chunker, the compliance rule engine (all status-precedence cases), and the mock AI provider (deterministic embeddings, real extraction, grounded answers); on `apps/web`, React Testing Library coverage for the login/signup flows (success, Supabase error messages, and the no-session email-confirmation path) and the `ComplianceStatusBadge` component.

## Ops tooling

`scripts/ops/` holds standalone operational scripts — each works against local dev or a live deployment, and each is used by CI as well as being runnable by hand:

- **`smoke-test.ps1`** (PowerShell) — hits the landing page, login page, API health check, and Swagger docs; fails (non-zero exit) if any of them don't return 2xx. This is the real "did the deploy actually work" check, run automatically after every deploy (see below).
  ```powershell
  ./scripts/ops/smoke-test.ps1                                                          # local
  ./scripts/ops/smoke-test.ps1 -WebUrl https://your-app.vercel.app -ApiUrl https://your-api.onrender.com
  ```
- **`health-check.py`** (Python, stdlib only) — polls one or more endpoints and exits non-zero once an endpoint fails N times in a row. `--once` makes it a single CI-style gate; without it, it runs forever on an interval, so it also doubles as a lightweight uptime monitor you can point cron/Task Scheduler/systemd at.
  ```bash
  python scripts/ops/health-check.py --once https://your-api.onrender.com/health
  python scripts/ops/health-check.py -i 30 -r 3 https://your-api.onrender.com/health   # long-running monitor
  ```
- **`bootstrap.sh`** (Bash) — one-shot dev environment setup, see [Setup](#setup) above.

## Deployment

CI (`.github/workflows/ci.yml`) runs lint/typecheck/test/build on every push and PR to `main`. Deploy (`.github/workflows/deploy.yml`) fires after CI succeeds on `main` and no-ops safely until you add these repository secrets:

| Secret | Where to get it |
|---|---|
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel project → Settings → General |
| `VERCEL_PROJECT_ID_WEB` | Same page, after linking `apps/web` as a Vercel project (Root Directory: `apps/web`) |
| `RENDER_DEPLOY_HOOK` | Render → your web service → Settings → Deploy Hook |

Once both deploys are live, set these repository **variables** (Settings → Secrets and variables → Actions → Variables tab — not Secrets, these aren't sensitive) so the post-deploy smoke test has something to check:

| Variable | Value |
|---|---|
| `WEB_URL` | Your Vercel deployment URL, e.g. `https://obliq.vercel.app` |
| `API_URL` | Your Render deployment URL, e.g. `https://obliq-api.onrender.com` |

Without these, the `smoke-test` job in `deploy.yml` no-ops with a notice, same pattern as the deploy jobs themselves.

Runtime environment variables (`SUPABASE_URL`, AI provider keys, etc.) are **not** GitHub secrets — set them directly in the Vercel project dashboard (web) and the Render service dashboard (api), matching `apps/web/.env.local.example` and `apps/api/.env.example`.

`apps/api/Dockerfile` is a multi-stage Turborepo-pruned build; `render.yaml` documents every env var Render needs (all as `sync: false` placeholders — nothing sensitive is committed).

## Pull request automation

`.github/workflows/pr-automation.yml` runs on every PR: `actions/labeler` applies path-based labels (`frontend`, `backend`, `database`, `ai`, `ci/cd`, `ops`, `docs` — see `.github/labeler.yml`) so reviewers can tell what a PR touches at a glance, and a small `actions/github-script` step labels the PR by diff size (`size/XS` through `size/XL`), auto-creating those labels the first time they're needed.

## Development philosophy

- No feature ships in a state where it only works with live API keys — mock mode is the default and the thing that gets tested.
- The compliance status you see is always freshly computed, never a stale cache.
- Going from demo to production AI provider is a config change, not a code change.
