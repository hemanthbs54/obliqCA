import type { DashboardSummary, ComplianceStatusValue, TypedSupabaseClient } from '@obliq/shared';
import { ApiError } from '../../plugins/error-handler.js';
import { listClients } from '../clients/clients.service.js';

const EMPTY_STATUS_COUNTS: Record<ComplianceStatusValue, number> = {
  on_track: 0,
  due_soon: 0,
  overdue: 0,
  missing_docs: 0,
};

export async function getDashboardSummary(
  supabase: TypedSupabaseClient,
  ownerId: string,
): Promise<DashboardSummary> {
  const clients = await listClients(supabase, ownerId);

  const statusCounts = { ...EMPTY_STATUS_COUNTS };
  for (const client of clients) {
    statusCounts[client.compliance_status] += 1;
  }

  const in7Days = new Date();
  in7Days.setUTCDate(in7Days.getUTCDate() + 7);

  const { data: upcomingTasks, error: taskError } = await supabase
    .from('tasks')
    .select('due_date, client_id, clients(name), client_filings(filing_types(name))')
    .eq('owner_id', ownerId)
    .neq('status', 'completed')
    .lte('due_date', in7Days.toISOString().slice(0, 10))
    .order('due_date')
    .limit(10);
  if (taskError) throw new ApiError(500, taskError.message);

  const upcomingDeadlines = (upcomingTasks ?? []).map((row) => {
    const r = row as unknown as {
      due_date: string;
      client_id: string;
      clients: { name: string } | null;
      client_filings: { filing_types: { name: string } | null } | null;
    };
    return {
      clientId: r.client_id,
      clientName: r.clients?.name ?? 'Unknown client',
      filingType: r.client_filings?.filing_types?.name ?? 'Filing',
      dueDate: r.due_date,
    };
  });

  const { data: recentRuns, error: runsError } = await supabase
    .from('agent_runs')
    .select('id, client_id, run_type, status, started_at, clients(name)')
    .eq('owner_id', ownerId)
    .order('started_at', { ascending: false })
    .limit(5);
  if (runsError) throw new ApiError(500, runsError.message);

  const recentAgentRuns = (recentRuns ?? []).map((row) => {
    const r = row as unknown as {
      id: string;
      client_id: string | null;
      run_type: string;
      status: string;
      started_at: string;
      clients: { name: string } | null;
    };
    return {
      id: r.id,
      clientId: r.client_id,
      clientName: r.clients?.name ?? null,
      runType: r.run_type,
      status: r.status,
      startedAt: r.started_at,
    };
  });

  return {
    totalClients: clients.length,
    statusCounts,
    upcomingDeadlines,
    recentAgentRuns,
  };
}
