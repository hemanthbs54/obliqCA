# Obliq — Mini Audit Document Review System

A working prototype for OBLIQ-in's **Audit Workflow Challenge**: a CA firm collects audit documents from a client, reviews them, requests corrections or approves, and keeps a history of every action that nobody can edit.

```
Create/View Client → Add Audit Documents → Upload → Review → Approve or Request Correction → Audit History
```

| | |
|---|---|
| **Live demo** | _Not deployed yet — see [Deployment](#deployment). Until then, [Running locally](#running-locally) takes about 5 minutes._ |
| **Demo accounts** | Buttons on the login page. Password for all: `AuditDemo@2026` |
| **API docs** | `GET /docs` on the API (OpenAPI/Swagger UI: route list; request shapes are validated with Zod in code) |
| **Stack** | Next.js 14 · Fastify · Supabase (Postgres, Auth, Storage) · TypeScript · pnpm + Turborepo |

---

## What it does

### Workflow
1. **Client:** a reviewer or partner creates a client and ticks the documents needed (Bank Statement, Sales Register, Purchase Register, GST Return, Expense Summary, plus any custom ones) and assigns staff.
2. **Documents:** each required document has a status and a version history.
3. **Upload:** assigned staff upload the file (PDF, image, CSV, Excel ≤ 15 MB). Every upload is a new immutable version with a SHA-256 fingerprint.
4. **Review:** a reviewer opens the document page (name, client, uploaded by, upload date/time, status, review comment), starts the review, then **approves** or **requests a correction**, which requires a reason.
5. **Correction loop:** staff see the reason, upload a corrected file, and it goes back to review.
6. **Audit history:** every step is recorded (who, role, what, when, which document and file, from/to status, reason) on the document page and in the firm-wide audit log.

### Status design

```mermaid
stateDiagram-v2
    [*] --> Pending : document requested
    Pending --> Uploaded : staff uploads v1
    Uploaded --> Uploaded : staff replaces file before review
    Uploaded --> UnderReview : reviewer starts review
    UnderReview --> Approved : reviewer approves
    UnderReview --> CorrectionRequired : reviewer requests correction (reason required)
    CorrectionRequired --> Uploaded : staff uploads again (v2, v3…)
    Approved --> [*]
```

I kept the brief's statuses and made two choices:
- "Uploaded Again" is not a separate status; it is the `document.reuploaded` audit event plus a new version number. The document is simply back in *Uploaded*, waiting for review.
- *Under Review* is an explicit step, so the history shows when a reviewer picked the file up, and two reviewers can't decide on the same file at once.

### Roles

| Capability | Staff | Reviewer | Partner (optional) |
|---|:-:|:-:|:-:|
| View clients | assigned only | all in firm | all in firm |
| Upload / respond to correction requests | ✅ | — | ✅ |
| View document status and its history | ✅ | ✅ | ✅ |
| Start review, approve, request correction | — | ✅ | ✅ |
| Create clients, request documents, assign staff | — | ✅ | ✅ |
| Firm-wide audit log, integrity check, CSV export | — | ✅ | ✅ |

**Maker-checker:** whoever uploaded the current version cannot review it, even a partner. The database enforces this.

### Beyond the minimum (all inside the brief's scope)
- **Tamper-evident audit log:** events can't be updated, deleted or truncated by anyone using the app, including the backend's service-role key. Each event is SHA-256 hash-chained to the previous one, and the audit page verifies the chain.
- **Versioned documents:** nothing is overwritten, so the history shows exactly which file was rejected and which was approved.
- **Stale-screen protection:** every review action sends the `row_version` it saw. If someone else changed the document first, the API returns `409` instead of silently overwriting.
- **Blocked access is logged:** opening another firm's document returns `404` and writes an `access.denied` event to the *caller's* firm log, without leaking anything about the other firm.
- **Upload hardening:** extension allow-list, checks that the file's bytes match its extension, sanitised file names, private bucket, 60-second signed URLs.
- **Role-aware work queue:** staff see what to upload or correct; reviewers see what to review.
- **Audit CSV export:** protected against spreadsheet formula injection.

---

## Architecture

```mermaid
flowchart TD
    B["Browser · Next.js (Vercel)<br/>Supabase Auth session"] -->|"Bearer JWT"| A
    A["Fastify API (Render)<br/>1 verify token · 2 load firm + role from DB<br/>3 role guard · 4 Zod validation"] -->|"queries with the USER's JWT"| P
    A -->|"service key: Storage objects only"| S[("Supabase Storage<br/>private bucket")]
    P[("Postgres<br/>RLS on every table")] --> F["Workflow functions (SECURITY DEFINER)<br/>authorise + validate transition + apply"]
    F -->|"same transaction"| L[("audit_events<br/>append-only · hash-chained")]
```

**Why this shape:** the brief is about traceability and isolation, so those rules live in the database, the one layer every path goes through. The API adds validation, file handling and clear errors. It is deliberately not the only guard.

**Data model:** `firms` → `firm_memberships (user, role)` → `clients` → `client_assignments` → `documents` → `document_versions` / `review_decisions`, plus `audit_events`. Child tables carry `firm_id` with **composite foreign keys** (`(firm_id, client_id)`), so a row can never reference another firm's parent. SQL lives in [`supabase/migrations`](supabase/migrations).

**Atomic history:** every state change is a Postgres function (`record_document_upload`, `start_review`, `approve_document`, `request_correction`, …). Each one checks the caller, locks the row, validates the transition, updates the document and appends the audit event **in one transaction**, so there can't be a change without its event, or an event without its change.

### How Firm A stays isolated from Firm B

*Authentication ≠ authorization.* Supabase Auth only proves **who** the user is. **What they may see** is decided like this:

1. **The firm comes from the database, never the request.** The API looks up the user's membership (`firm_id`, `role`) using their verified user ID. No body, query parameter or header can choose a firm.
2. **Postgres RLS on every table.** The API queries Supabase *with the user's own JWT*, not an admin key. Policies such as `firm_id = current_firm_id() AND can_access_client(client_id)` mean Firm A's queries cannot return Firm B's rows, even if an API route forgot a filter. Staff are further limited to assigned clients.
3. **Writes only through functions.** Users have no INSERT/UPDATE/DELETE grants. Workflow functions take the actor from `auth.uid()` and re-check firm, role, state and maker-checker, so calling them directly through Supabase's REST API with a stolen UI flow gains nothing.
4. **404, not 403.** Cross-firm IDs look exactly like missing IDs, so they can't be probed, and the attempt is logged as `access.denied`.
5. **Storage:** object paths are `firm/client/document/…`. The database rejects a version whose path isn't inside its own document's folder, and files are served only through short-lived signed URLs after an RLS-checked lookup.

*Frontend hiding a button ≠ security.* The UI hides actions for convenience; [`security.test.ts`](apps/api/src/test/integration/security.test.ts) calls the API **and** Supabase directly as a Firm B user and as staff, and proves each attempt is refused.

---

## Running locally

Prerequisites: Node 22+, pnpm 9, Docker (for the local Supabase stack), [Supabase CLI](https://supabase.com/docs/guides/cli).

```bash
pnpm install
supabase start                 # local Postgres + Auth + Storage; applies supabase/migrations
supabase status                # copy the API URL, anon key and service_role key

cp apps/api/.env.example apps/api/.env              # fill SUPABASE_URL / keys
cp apps/web/.env.local.example apps/web/.env.local  # fill NEXT_PUBLIC_SUPABASE_URL / anon key

pnpm seed                      # two firms, six users, clients and a real review history
pnpm dev                       # web on http://localhost:3000, API on http://localhost:4000 (/docs)
```

To start over: `supabase db reset && pnpm seed`.

**Hosted Supabase instead of Docker:** run the files in `supabase/migrations` in order in the SQL editor, put the project URL and keys in both env files, then `pnpm seed`. To re-seed a hosted project, run `supabase/reset_demo.sql` first.

### Demo accounts (password `AuditDemo@2026`)

| Firm | Name | Role | Try this |
|---|---|---|---|
| ABC & Co. | Rohit Sharma | Staff | Upload the reconciled Purchase Register for Indus Novate (file in `samples/synthetic-finance-data/`) |
| ABC & Co. | Aman Verma | Reviewer | Review the Salary Register; read the Trade Links bank statement history |
| ABC & Co. | Priya Iyer | Partner | Upload the Trade Links Expense Summary, then see maker-checker block your own review |
| ABC & Co. | Meera Nair | Staff | Sees only Indus Novate, not Trade Links India |
| XYZ & Co. | Neha Kapoor | Staff | Sees only Pixelcraft Studios |
| XYZ & Co. | Vikram Rao | Reviewer | Paste a Trade Links document URL: 404, and it's logged |

### Test data: the OBLIQ-in synthetic datasets

The demo documents are **real files from the synthetic datasets the OBLIQ-in team suggested** (no real client or bank data). `pnpm seed` uploads them through the actual workflow, so every version has a genuine SHA-256 in the audit trail:

| Client | Dataset | Documents and what they demonstrate |
|---|---|---|
| Trade Links India | [AgamiAI Indian Bank Statements](https://huggingface.co/datasets/AgamiAI/Indian-Bank-Statements) | The brief's example: a 2-of-6-page upload gets a correction request, the full statement is re-uploaded and approved |
| Indus Novate Technologies | [synthetic-finance-data](https://github.com/AnujSureshkumar/synthetic-finance-data) | The books purchase register is sent back with the dataset's **real seeded GSTR-2B mismatches** in the reason (value, GSTIN, missing invoices); vendor tax invoice approved; salary register under review |
| Pixelcraft Studios | [LedgerBridge](https://github.com/PearlThoughts/LedgerBridge) | HDFC bank export approved, RazorpayX payroll uploaded, monthly MIS workbook under review |

A reconciled purchase register, derived from the dataset's own GSTR-2B, is included so the correction can be fixed live in a demo. Sources, licenses, derived-file notes, and why the unlicensed Invoice Sandbox Benchmark isn't bundled are in [`samples/README.md`](samples/README.md).

Scope follows the team's guidance of 1–2 clients and 5–10 documents *per firm*: ABC & Co. has 2 clients with 8 documents, XYZ & Co. has 1 client with 3 documents. The second firm exists only to demonstrate isolation.

## Deployment

The web app is a standard Next.js project (Vercel) and the API ships as a Docker image (Render); `apps/web/vercel.json`, `apps/api/Dockerfile` and `render.yaml` are already configured.

**1. Database (hosted Supabase).** In the SQL editor, run `supabase/migrations/0001…0006` in order. On a project that still has the old prototype schema, run `supabase/reset_legacy.sql` first. Then point `apps/api/.env` at the hosted project and run `pnpm seed` locally to load the demo firms. To re-seed later, run `supabase/reset_demo.sql` first.

**2. API (Render → New → Blueprint).** `render.yaml` creates the `obliq-api` service and prompts for the values it marks `sync: false`:

| Variable | Value |
|---|---|
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | From Supabase → Project Settings → API. The service-role key belongs **only** here, never in the web app. |
| `WEB_ORIGIN` | The Vercel URL, no trailing slash. CORS allows exactly this origin (comma-separate for more). |
| `NODE_ENV`, `PORT` | Already set to `production` / `4000` by the blueprint. |

Health check: `GET /health`. The free plan sleeps after ~15 minutes idle, so the first request afterwards takes 30–60 seconds.

**3. Web (Vercel → Import project).** Root directory `apps/web`, Node.js 22.x, and:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project URL and **anon** key |
| `NEXT_PUBLIC_API_URL` | The Render URL, no trailing slash |
| `NEXT_PUBLIC_DEMO_MODE` | `true` to show the demo-account buttons on the login page |

These are read at build time, so redeploy after changing one.

**4. Supabase Auth → URL Configuration.** Set the Site URL to the Vercel URL and add `<vercel-url>/auth/callback` to the redirect URLs.

**5. Verify.** `./scripts/ops/smoke-test.ps1 -WebUrl <vercel-url> -ApiUrl <render-url>` checks the landing page, login page, API health and docs.

**Optional CI deploys.** `.github/workflows/deploy.yml` redeploys after CI passes on `main` once these repository secrets exist: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID_WEB`, `RENDER_DEPLOY_HOOK`; plus the `WEB_URL` and `API_URL` variables for the post-deploy smoke test. Without them the jobs no-op. If you use it, turn off Render/Vercel auto-deploy so each push deploys once.

## Testing

```bash
pnpm test               # unit tests: workflow rules, permissions, upload validation, CSV export, UI components
pnpm test:integration   # against the seeded database: isolation, roles, maker-checker, 409s, immutability, hash chain
pnpm lint && pnpm typecheck
```

## Screenshots

| | |
|---|---|
| ![Login with demo accounts](docs/screenshots/01-login.png) | ![Reviewer work queue](docs/screenshots/02-queue.png) |
| ![Client documents](docs/screenshots/03-client.png) | ![Document review page](docs/screenshots/04-review.png) |
| ![Request correction](docs/screenshots/05-correction.png) | ![Firm audit log](docs/screenshots/06-audit-log.png) |
| ![Firm B user opening a Firm A document](docs/screenshots/07-isolation.png) | |

## Project layout

```
apps/web          Next.js UI: login, work queue, clients, document review, audit log
apps/api          Fastify API: auth + firm context, clients, documents, queue, audit
packages/shared   Workflow state machine, role matrix, audit wording, shared types
supabase/         Migrations (schema, audit log, workflow functions, RLS, storage) + reset scripts
samples/          synthetic documents from the OBLIQ-in suggested datasets (with licenses)
scripts/          seed-demo.ts, ops/smoke-test.ps1, ops/health-check.py
```

## Deliberately out of scope
Following the brief, there is no WhatsApp integration, OCR, AI, tax logic, notifications, or public sign-up (users are provisioned per firm). The previous GST-compliance prototype in this repository is preserved at git tag `legacy-compliance-v1`.

---

## What would you improve if you had one more week?

**Client-side upload portal with expiring request links.** Today staff still receive files over WhatsApp or email and re-upload them, which is the part of the "scattered" workflow the prototype doesn't remove yet. I'd let a reviewer send a client a single-use, time-limited link scoped to the requested documents. The client uploads directly, and each upload is attributed to the client contact in the same audit trail. This reuses the existing version, review and audit model, removes the manual handoff, and makes the audit trail start at the true source of the evidence.

Alongside it, two smaller, high-value fixes:
- **Reminders and ageing:** a daily job that flags documents stuck in *Pending* or *Correction Required* past an agreed number of days, surfaced in the work queue and by email. Follow-ups are the other big manual cost named in the brief.
- **Hardening what exists:** an audit-log checkpoint (periodically publishing the chain's head hash outside the database, so even a superuser rewrite is detectable), virus scanning on upload, rate limiting, and Playwright end-to-end tests for the full upload → correction → approval flow.

I would not add dashboards or AI yet: the most valuable next step is collecting documents at the source with less chasing.

---

AI Tools Used:
ChatGPT: Not used
Claude: Yes (Claude Code, Anthropic)
Gemini: Not used
Cursor: Not used
GitHub Copilot: Not used

How AI was used:
Claude Code was used as a pair programmer. I read the brief with it and agreed on scope: a focused review workflow, dropping the unrelated GST/AI features from my earlier prototype. It helped design the data model and the database-enforced security (RLS, workflow functions, append-only hash-chained audit log), wrote a first draft of the migrations, API, UI and tests, and ran them locally. I reviewed the decisions, tested the workflow as each role, and can explain every part: tenant isolation, the state machine, maker-checker, and how the audit chain is verified.
