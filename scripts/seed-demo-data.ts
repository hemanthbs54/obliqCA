/**
 * Seeds a Supabase project with a demo CA firm, four clients spanning every
 * compliance status, and their filings/tasks — so the dashboard looks real
 * the moment you log in, with no manual data entry.
 *
 * Usage: pnpm seed
 * Requires apps/api/.env (or the shell env) to have SUPABASE_URL and
 * SUPABASE_SERVICE_ROLE_KEY set, and the migrations + supabase/seed.sql
 * (filing_types catalog) already applied.
 */
import 'dotenv/config';
import { config as loadEnv } from 'dotenv';
import { createSupabaseAdminClient, type Client, type ClientType, type FilingType } from '@obliq/shared';

loadEnv({ path: 'apps/api/.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    'Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.\n' +
      'Set them in apps/api/.env (copy from apps/api/.env.example) or export them in your shell, then re-run `pnpm seed`.',
  );
  process.exit(1);
}

const DEMO_EMAIL = 'demo@obliq.io';
const DEMO_PASSWORD = 'ObliqDemo123!';

const supabase = createSupabaseAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function daysFromNow(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function getOrCreateDemoUser(): Promise<string> {
  const { data: existing } = await supabase.auth.admin.listUsers();
  const found = existing?.users.find((u) => u.email === DEMO_EMAIL);
  if (found) {
    console.log(`Using existing demo user (${DEMO_EMAIL})`);
    return found.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`Failed to create demo user: ${error?.message}`);
  console.log(`Created demo user (${DEMO_EMAIL})`);
  return data.user.id;
}

async function main() {
  const ownerId = await getOrCreateDemoUser();

  await supabase.from('profiles').upsert(
    { id: ownerId, firm_name: 'Sharma & Associates', full_name: 'Demo CA', phone: null },
    { onConflict: 'id' },
  );

  const { data: filingTypes, error: filingTypesError } = await supabase.from('filing_types').select('*');
  if (filingTypesError || !filingTypes?.length) {
    throw new Error(
      'No filing_types found — run `supabase/seed.sql` against your project before seeding demo data.',
    );
  }
  const byCode = new Map(filingTypes.map((f) => [f.code, f]));
  const gstr3b = byCode.get('GST_GSTR3B')!;
  const tds24q = byCode.get('TDS_24Q')!;
  const itr = byCode.get('ITR')!;

  // Wipe any previous demo run for this owner so re-seeding is idempotent.
  await supabase.from('clients').delete().eq('owner_id', ownerId);

  interface DemoClientInput {
    name: string;
    client_type: ClientType;
    pan: string | null;
    gstin: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    notes: string | null;
  }
  const blankClient = (overrides: Partial<DemoClientInput> & Pick<DemoClientInput, 'name' | 'client_type'>): DemoClientInput => ({
    pan: null,
    gstin: null,
    email: null,
    phone: null,
    address: null,
    notes: null,
    ...overrides,
  });

  const clients: DemoClientInput[] = [
    blankClient({ name: 'Sunrise Textiles Pvt Ltd', client_type: 'company', gstin: '27ABCDE1234F1Z5' }),
    blankClient({ name: 'Kiran Enterprises', client_type: 'proprietorship', gstin: '29PQRSX5678K1Z2' }),
    blankClient({ name: 'Meera & Co', client_type: 'partnership', gstin: '07LMNOP4321Q1Z9' }),
    blankClient({ name: 'Arjun Rao', client_type: 'individual', pan: 'ABCPR1234D' }),
  ];

  const { data: insertedClients, error: clientsError } = await supabase
    .from('clients')
    .insert(clients.map((c) => ({ owner_id: ownerId, ...c })))
    .select('*');
  if (clientsError || !insertedClients) throw new Error(`Failed to create clients: ${clientsError?.message}`);
  const [sunrise, kiran, meera, arjun] = insertedClients;

  async function attachAndTask(
    client: Client,
    filingType: FilingType,
    dueDate: string,
    periodLabel: string,
    taskStatus: 'pending' | 'in_progress' | 'completed',
  ) {
    const { data: filing, error: filingError } = await supabase
      .from('client_filings')
      .insert({
        owner_id: ownerId,
        client_id: client.id,
        filing_type_id: filingType.id,
        frequency_override: null,
        is_active: true,
      })
      .select('*')
      .single();
    if (filingError) throw new Error(filingError.message);

    const { error: taskError } = await supabase.from('tasks').insert({
      owner_id: ownerId,
      client_id: client.id,
      client_filing_id: filing.id,
      period_label: periodLabel,
      due_date: dueDate,
      status: taskStatus,
      checklist: [],
    });
    if (taskError) throw new Error(taskError.message);
    return filing;
  }

  // Sunrise: overdue GST filing, no document uploaded -> status: overdue.
  await attachAndTask(sunrise, gstr3b, daysFromNow(-5), 'Jul 2026', 'pending');

  // Kiran: TDS due in 3 days, no document yet -> status: missing_docs.
  await attachAndTask(kiran, tds24q, daysFromNow(3), 'Q2 FY26-27', 'pending');

  // Meera: ITR due in 4 days, with a document already linked -> status: due_soon.
  const meeraFiling = await attachAndTask(meera, itr, daysFromNow(4), 'FY 2025-26', 'in_progress');
  const { data: meeraTask } = await supabase
    .from('tasks')
    .select('id')
    .eq('client_filing_id', meeraFiling.id)
    .single();
  if (meeraTask) {
    await supabase.from('documents').insert({
      owner_id: ownerId,
      client_id: meera.id,
      task_id: meeraTask.id,
      file_name: 'meera-financials-fy25-26.pdf',
      storage_path: `${ownerId}/${meera.id}/placeholder-meera-financials-fy25-26.pdf`,
      mime_type: 'application/pdf',
      doc_type: 'financial_statement',
      status: 'processed',
      extracted_summary: {
        fields: [
          { field: 'total_revenue', value: 4200000, confidence: 0.8 },
          { field: 'net_profit', value: 610000, confidence: 0.8 },
        ],
      },
    });
  }

  // Arjun: everything far in the future -> status: on_track.
  await attachAndTask(arjun, itr, daysFromNow(120), 'FY 2026-27', 'pending');

  console.log('\nSeeded demo data:');
  console.log(`  ${sunrise.name} — overdue GSTR-3B, no document (expect: overdue)`);
  console.log(`  ${kiran.name} — TDS due in 3 days, no document (expect: missing_docs)`);
  console.log(`  ${meera.name} — ITR due in 4 days, document linked (expect: due_soon)`);
  console.log(`  ${arjun.name} — ITR due in 120 days (expect: on_track)`);
  console.log('\nLog in with:');
  console.log(`  email:    ${DEMO_EMAIL}`);
  console.log(`  password: ${DEMO_PASSWORD}`);
}

main().catch((err) => {
  console.error('\nSeed failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
