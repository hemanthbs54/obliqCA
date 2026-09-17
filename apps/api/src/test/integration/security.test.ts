/**
 * Integration tests against a real Supabase database seeded with `pnpm seed`.
 * Run: pnpm test:integration (requires apps/api/.env pointing at that database).
 *
 * These prove the security claims in the README: tenant isolation holds at
 * the API *and* at the database, roles are enforced server-side, and the
 * audit trail cannot be edited — not even with the service-role key.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createSupabaseAdminClient, createSupabaseClient, type TypedSupabaseClient } from '@obliq/shared';
import { buildApp } from '../../app.js';
import { env } from '../../config/env.js';

const PASSWORD = process.env.DEMO_PASSWORD ?? 'AuditDemo@2026';
const USERS = {
  rohit: 'rohit@abc-co.demo', // ABC staff, assigned to ABC Traders
  meera: 'meera@abc-co.demo', // ABC staff, NOT assigned to ABC Traders
  aman: 'aman@abc-co.demo', // ABC reviewer
  priya: 'priya@abc-co.demo', // ABC partner
  neha: 'neha@xyz-co.demo', // XYZ staff
  vikram: 'vikram@xyz-co.demo', // XYZ reviewer
} as const;
type UserKey = keyof typeof USERS;

let app: FastifyInstance;
const admin = createSupabaseAdminClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const sessions = {} as Record<UserKey, { token: string; db: TypedSupabaseClient }>;
const ids = {} as { abcFirm: string; abcTraders: string; bank: string; sales: string; purchase: string; expense: string; zenith: string };

async function call(user: UserKey, method: 'GET' | 'POST', url: string, payload?: object) {
  const res = await app.inject({
    method,
    url,
    headers: { authorization: `Bearer ${sessions[user].token}` },
    ...(payload ? { payload } : {}),
  });
  return { status: res.statusCode, body: res.body ? JSON.parse(res.body) : null };
}

async function docId(clientId: string, name: string) {
  const { data } = await admin.from('documents').select('id').eq('client_id', clientId).eq('name', name).single();
  return data!.id;
}

async function rowVersion(documentId: string) {
  const { data } = await admin.from('documents').select('row_version').eq('id', documentId).single();
  return data!.row_version;
}

beforeAll(async () => {
  app = await buildApp({ logger: false });

  for (const [key, email] of Object.entries(USERS) as [UserKey, string][]) {
    const db = createSupabaseClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
    const { data, error } = await db.auth.signInWithPassword({ email, password: PASSWORD });
    if (error || !data.session) throw new Error(`Sign-in failed for ${email} — did you run \`pnpm seed\`? (${error?.message})`);
    sessions[key] = { token: data.session.access_token, db };
  }

  const { data: abc } = await admin.from('firms').select('id').eq('slug', 'abc-co').single();
  const { data: traders } = await admin.from('clients').select('id').eq('name', 'ABC Traders Pvt. Ltd.').single();
  const { data: zenith } = await admin.from('clients').select('id').eq('name', 'Zenith Exports Pvt. Ltd.').single();
  ids.abcFirm = abc!.id;
  ids.abcTraders = traders!.id;
  ids.zenith = zenith!.id;
  ids.bank = await docId(traders!.id, 'Bank Statement');
  ids.sales = await docId(traders!.id, 'Sales Register');
  ids.purchase = await docId(traders!.id, 'Purchase Register');
  ids.expense = await docId(traders!.id, 'Expense Summary');
});

afterAll(async () => {
  await app?.close();
});

describe('tenant isolation (Firm A vs Firm B)', () => {
  it('lists only the caller’s own firm’s clients', async () => {
    const abc = await call('aman', 'GET', '/api/clients');
    const xyz = await call('vikram', 'GET', '/api/clients');
    expect(abc.body.map((c: { name: string }) => c.name)).not.toContain('Zenith Exports Pvt. Ltd.');
    expect(xyz.body.map((c: { name: string }) => c.name)).toEqual(['Zenith Exports Pvt. Ltd.']);
  });

  it('returns 404 (not 403) for another firm’s client and document, and logs the attempt in the caller’s firm', async () => {
    expect((await call('vikram', 'GET', `/api/clients/${ids.abcTraders}`)).status).toBe(404);
    expect((await call('vikram', 'GET', `/api/documents/${ids.bank}`)).status).toBe(404);

    const log = await call('vikram', 'GET', '/api/audit-events?action=access.denied&limit=20');
    expect(log.body.events.some((e: { metadata: { resourceId: string } }) => e.metadata.resourceId === ids.bank)).toBe(true);

    // ...and nothing about it leaks into Firm A's log.
    const abcLog = await call('aman', 'GET', '/api/audit-events?action=access.denied&limit=200');
    expect(abcLog.body.events.every((e: { actor_name: string }) => e.actor_name !== 'Vikram Rao')).toBe(true);
  });

  it('cannot act on another firm’s documents through the API', async () => {
    const res = await call('vikram', 'POST', `/api/documents/${ids.purchase}/start-review`, { expectedRowVersion: await rowVersion(ids.purchase) });
    expect(res.status).toBe(404);
  });

  it('holds even when bypassing our API and querying Supabase directly with a Firm B token (RLS)', async () => {
    const { db } = sessions.vikram;
    expect((await db.from('clients').select('id').eq('id', ids.abcTraders)).data).toEqual([]);
    expect((await db.from('documents').select('id').eq('client_id', ids.abcTraders)).data).toEqual([]);
    expect((await db.from('audit_events').select('id').eq('firm_id', ids.abcFirm)).data).toEqual([]);

    const rpc = await db.rpc('start_review', { p_document_id: ids.purchase, p_expected_row_version: await rowVersion(ids.purchase) });
    expect(rpc.error?.code).toBe('PT404');
  });

  it('blocks direct table writes for signed-in users', async () => {
    const { error } = await sessions.vikram.db.from('clients').insert({ firm_id: ids.abcFirm, name: 'Injected Client' });
    expect(error?.code).toBe('42501');
  });
});

describe('role enforcement is server-side', () => {
  it('staff only see assigned clients', async () => {
    const meera = await call('meera', 'GET', '/api/clients');
    expect(meera.body.map((c: { name: string }) => c.name)).toEqual(['Sharma Foods LLP']);
    expect((await call('meera', 'GET', `/api/documents/${ids.bank}`)).status).toBe(404);
  });

  it('staff cannot approve, even by calling the database function directly', async () => {
    const api = await call('rohit', 'POST', `/api/documents/${ids.sales}/approve`, { expectedRowVersion: await rowVersion(ids.sales) });
    expect(api.status).toBe(403);

    const rpc = await sessions.rohit.db.rpc('approve_document', { p_document_id: ids.sales, p_expected_row_version: await rowVersion(ids.sales) });
    expect(rpc.error?.code).toBe('PT403');
  });

  it('staff cannot read the firm-wide audit log', async () => {
    expect((await call('rohit', 'GET', '/api/audit-events')).status).toBe(403);
  });
});

describe('review rules', () => {
  it('requires a correction comment', async () => {
    const res = await call('aman', 'POST', `/api/documents/${ids.sales}/request-correction`, {
      expectedRowVersion: await rowVersion(ids.sales),
      comment: 'bad',
    });
    expect(res.status).toBe(400);
  });

  it('rejects a stale screen with 409 instead of silently overwriting', async () => {
    const res = await call('aman', 'POST', `/api/documents/${ids.purchase}/start-review`, { expectedRowVersion: 1 });
    expect(res.status).toBe(409);
  });

  it('enforces maker-checker for a partner who uploaded the file themselves', async () => {
    const form = new FormData();
    form.append('file', new Blob(['%PDF-1.4\n% expense summary']), 'Expense_Summary.pdf');
    const upload = await app.inject({
      method: 'POST',
      url: `/api/documents/${ids.expense}/versions`,
      headers: { authorization: `Bearer ${sessions.priya.token}` },
      payload: form,
    });
    expect(upload.statusCode).toBe(201);

    const review = await call('priya', 'POST', `/api/documents/${ids.expense}/start-review`, { expectedRowVersion: await rowVersion(ids.expense) });
    expect(review.status).toBe(403);
    expect(review.body.message).toMatch(/maker-checker/);
  });

  it('rejects uploads whose content does not match the extension', async () => {
    const form = new FormData();
    form.append('file', new Blob(['MZ this is an executable']), 'statement.pdf');
    const res = await app.inject({
      method: 'POST',
      url: `/api/documents/${ids.purchase}/versions`,
      headers: { authorization: `Bearer ${sessions.rohit.token}` },
      payload: form,
    });
    expect(res.statusCode).toBe(415);
  });
});

describe('audit trail integrity', () => {
  it('records the brief’s example history for the bank statement, in order', async () => {
    const res = await call('aman', 'GET', `/api/documents/${ids.bank}/audit-events`);
    // Security events (e.g. Meera's blocked attempt earlier in this suite) also attach to the document; skip them here.
    const workflow = res.body.filter((e: { action: string }) => e.action !== 'access.denied');
    expect(workflow.map((e: { action: string }) => e.action)).toEqual([
      'document.requirement_added',
      'document.uploaded',
      'review.started',
      'review.correction_requested',
      'document.reuploaded',
      'review.started',
      'review.approved',
    ]);
    const correction = workflow.find((e: { action: string }) => e.action === 'review.correction_requested');
    expect(correction).toMatchObject({ actor_name: 'Aman Verma', comment: 'Page 3 is missing. Please upload the complete bank statement.' });
  });

  it('cannot be updated or deleted by users', async () => {
    const { db } = sessions.priya;
    const update = await db.from('audit_events').update({ comment: 'tampered' }).eq('firm_id', ids.abcFirm);
    const remove = await db.from('audit_events').delete().eq('firm_id', ids.abcFirm);
    expect(update.error?.code).toBe('42501');
    expect(remove.error?.code).toBe('42501');
  });

  it('cannot be updated or deleted even with the backend service-role key', async () => {
    const update = await admin.from('audit_events').update({ comment: 'tampered' }).eq('firm_id', ids.abcFirm);
    const remove = await admin.from('audit_events').delete().eq('firm_id', ids.abcFirm);
    const insert = await admin.from('audit_events').insert({ firm_id: ids.abcFirm, actor_name: 'Mallory', action: 'review.approved' });
    expect(update.error).not.toBeNull();
    expect(remove.error).not.toBeNull();
    expect(insert.error).not.toBeNull();
  });

  it('verifies the hash chain', async () => {
    const res = await call('aman', 'GET', '/api/audit-events/verify');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true, firstBrokenSeq: null });
    expect(res.body.events).toBeGreaterThan(10);
  });
});
