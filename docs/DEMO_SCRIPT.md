# Demo video script (3–5 minutes)

Follows the seven points the brief asks for. A plain screen recording is enough. Log in with the demo buttons on `/login` (password `AuditDemo@2026`).

## 1. Login and role (0:00–0:30)
- Open `/login`: two firms, each with Staff / Reviewer / Partner accounts; no public sign-up.
- Log in as **Aman Verma (Reviewer, ABC & Co.)**. The top bar shows the firm and role badge.
- The **Work queue** lists documents waiting for a review decision.

## 2. Client (0:30–1:00)
- **Clients → New client**: "Demo Traders", keep the five default documents, create.
- **Assign staff** → Rohit Sharma. Point out that Meera (another staff member) won't see this client.

## 3. Upload / add document (1:00–1:45)
- Log out and log in as **Rohit Sharma (Staff)**. The queue shows the new client's pending documents.
- Open **Bank Statement → Upload file**, pick a PDF. The status moves to *Uploaded*, v1 is listed with its SHA-256.

## 4. Review document (1:45–2:15)
- Log in as **Aman**. Open the document: name, client, uploaded by, upload date/time, status, review comment.
- **Start review**: the status becomes *Under review*.

## 5. Request correction, then approve (2:15–3:15)
- **Request correction**: try a short reason and show that it's rejected, then enter "Page 3 is missing. Please upload the complete bank statement."
- Log in as **Rohit**: the reason is shown; **Upload corrected file** with a note → v2.
- Log in as **Aman**: **Start review → Approve**. The version list shows v1 as correction requested and v2 as approved.

## 6. Audit history (3:15–4:00)
- The document's **Audit history** panel reads like the brief's example: time, who, what, file, reason.
- **Audit log** page: filter by client or person, **Hash chain verified ✓**, **Export CSV**.
- Mention: events can't be edited or deleted, even with the backend admin key.

## 7. Isolation and architecture (4:00–5:00)
- Copy the document URL. Log in as **Vikram Rao (XYZ & Co.)** and paste it: "Document not found". In Vikram's audit log, filter **Access denied** to see the blocked attempt.
- Optional: log in as **Priya (Partner)**, upload a file, and show maker-checker blocking her own review.
- Architecture in one breath: *"The API verifies the token, loads the firm and role from the database, and queries Postgres with the user's own JWT, so Row Level Security isolates firms even if a route forgets a filter. Every state change is a database function that writes the audit event in the same transaction, and the audit table is append-only and hash-chained."* Show `supabase/migrations/0005_rls_and_grants.sql` and `apps/api/src/test/integration/security.test.ts`.
