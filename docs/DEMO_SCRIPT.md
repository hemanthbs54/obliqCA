# Demo video script (3–5 minutes)

Follows the seven points in the brief. A plain screen recording is enough. Log in with the demo buttons on `/login` (password `AuditDemo@2026`). All documents come from the synthetic datasets the OBLIQ-in team suggested; see `samples/README.md`.

## 1. Login and role (0:00–0:30)
- Open `/login`: two firms, Staff / Reviewer / Partner accounts, no public sign-up.
- Log in as **Aman Verma (Reviewer, ABC & Co.)**. The top bar shows firm and role.
- **Work queue**: the Salary Register is under review and the Vendor Master is waiting.

## 2. Client (0:30–1:00)
- **Clients** → *Indus Novate Technologies Pvt Ltd*: 5 required documents in different states, with progress, assigned staff and recent activity.
- Optional: **New client** with the default checklist, then **Assign staff**. Say: "Staff only see clients they're assigned to."

## 3. Correction with real data (1:00–2:15)
- Open **Purchase Register** (status *Correction required*). Read the reason: the June 2026 books register doesn't reconcile with GSTR-2B (value mismatches, wrong GSTINs, missing invoices). These mismatches are seeded in the team's synthetic dataset.
- Log in as **Rohit Sharma (Staff)**. The queue puts this correction first.
- **Upload corrected file** → `samples/synthetic-finance-data/indus-novate_purchase-register_jun-2026_reconciled.csv`, with a note such as "Reconciled to GSTR-2B; ITC held on 5 unmatched invoices." It becomes *Uploaded*, v2 appears with its SHA-256, and Rohit sees no review buttons.

## 4. Review and approve (2:15–3:00)
- Log in as **Aman**. Open the Purchase Register → **Start review** → **Approve** with a short note.
- The **Versions** list shows v1 *Correction requested* and v2 *Approved*.

## 5. Audit history (3:00–3:45)
- Document page: the timeline reads like the brief's example (who, role, what, file, reason).
- Open **Trade Links India → Bank Statement** to show the brief's own scenario: the 2-page upload, "page 3 onwards is missing", the complete statement, approval.
- **Audit log**: filter by client or person, **✓ Hash chain verified**, **Export CSV**. Say: "Events can't be edited or deleted, even with the backend admin key."

## 6. Isolation (3:45–4:15)
- Copy a Trade Links document URL. Log in as **Vikram Rao (XYZ & Co.)** and paste it: "Document not found". In Vikram's audit log, filter **Access denied** to see the blocked attempt.
- Optional: as **Priya (Partner)**, upload the Trade Links Expense Summary and show maker-checker blocking her own review.

## 7. Architecture (4:15–5:00)
"The API verifies the token, loads firm and role from the database, and queries Postgres with the user's own JWT, so Row Level Security isolates firms even if a route forgets a filter. Every state change is a database function that writes the audit event in the same transaction, and the audit table is append-only and hash-chained." Show `supabase/migrations/0005_rls_and_grants.sql` and `apps/api/src/test/integration/security.test.ts`.
