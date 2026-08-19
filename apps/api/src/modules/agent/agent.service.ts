import type { AgentRun, TypedSupabaseClient } from '@obliq/shared';
import { ApiError } from '../../plugins/error-handler.js';
import { getAIProvider } from '../../ai/provider.js';
import { evaluateCompliance, type ComplianceEvaluationResult, type EvaluableTask } from './agent.rules.js';

interface TaskRow {
  id: string;
  client_id: string;
  due_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  client_filings: { filing_types: { name: string } | null } | null;
}

/** Fetches every open (non-completed) task for the owner, joined with its filing type name, grouped by client. */
async function fetchEvaluableTasksByClient(
  supabase: TypedSupabaseClient,
  ownerId: string,
): Promise<Map<string, EvaluableTask[]>> {
  const { data: taskRows, error: taskError } = await supabase
    .from('tasks')
    .select('id, client_id, due_date, status, client_filings(filing_types(name))')
    .eq('owner_id', ownerId);
  if (taskError) throw new ApiError(500, taskError.message);

  const { data: docRows, error: docError } = await supabase
    .from('documents')
    .select('task_id')
    .eq('owner_id', ownerId)
    .not('task_id', 'is', null);
  if (docError) throw new ApiError(500, docError.message);

  const linkedTaskIds = new Set((docRows ?? []).map((d) => d.task_id));

  const byClient = new Map<string, EvaluableTask[]>();
  for (const row of (taskRows ?? []) as unknown as TaskRow[]) {
    const list = byClient.get(row.client_id) ?? [];
    list.push({
      id: row.id,
      dueDate: row.due_date,
      status: row.status,
      filingTypeName: row.client_filings?.filing_types?.name ?? 'Filing',
      hasLinkedDocument: linkedTaskIds.has(row.id),
    });
    byClient.set(row.client_id, list);
  }
  return byClient;
}

/** Live, pure-function status for every client an owner has — no persistence, no AI call. Cheap enough to run on every dashboard read. */
export async function evaluateAllClientsCompliance(
  supabase: TypedSupabaseClient,
  ownerId: string,
  today: Date = new Date(),
): Promise<Map<string, ComplianceEvaluationResult>> {
  const tasksByClient = await fetchEvaluableTasksByClient(supabase, ownerId);
  const results = new Map<string, ComplianceEvaluationResult>();
  for (const [clientId, tasks] of tasksByClient) {
    results.set(clientId, evaluateCompliance({ tasks, today }));
  }
  return results;
}

export async function evaluateClientCompliance(
  supabase: TypedSupabaseClient,
  ownerId: string,
  clientId: string,
  today: Date = new Date(),
): Promise<ComplianceEvaluationResult> {
  const all = await evaluateAllClientsCompliance(supabase, ownerId, today);
  return all.get(clientId) ?? evaluateCompliance({ tasks: [], today });
}

export interface RunComplianceAgentResult {
  agentRunId: string;
  evaluation: ComplianceEvaluationResult;
  narrative: string;
}

/** Manual/triggered run: evaluates, persists to compliance_status, and asks the AI provider to phrase a narrative. */
export async function runComplianceAgent(
  supabase: TypedSupabaseClient,
  ownerId: string,
  clientId: string,
): Promise<RunComplianceAgentResult> {
  const { data: run, error: runInsertError } = await supabase
    .from('agent_runs')
    .insert({
      owner_id: ownerId,
      client_id: clientId,
      run_type: 'compliance_check',
      status: 'running',
      provider: 'pending',
      input: { clientId },
    })
    .select('*')
    .single();
  if (runInsertError) throw new ApiError(500, runInsertError.message);

  try {
    const evaluation = await evaluateClientCompliance(supabase, ownerId, clientId);

    const chatProvider = getAIProvider('chat');
    const narrativeResult = await chatProvider.complete({
      messages: [
        {
          role: 'system',
          content: 'Summarize this CA-firm client compliance evaluation in 1-2 plain-English sentences.',
        },
        { role: 'user', content: `COMPLIANCE_JSON: ${JSON.stringify(evaluation)}` },
      ],
    });

    const { error: statusError } = await supabase.from('compliance_status').upsert(
      {
        owner_id: ownerId,
        client_id: clientId,
        status: evaluation.status,
        next_due_date: evaluation.nextDueDate,
        next_due_filing_type: evaluation.nextDueFilingType,
        overdue_count: evaluation.overdueCount,
        missing_docs_count: evaluation.missingDocsCount,
        details: evaluation.flags,
        last_evaluated_at: new Date().toISOString(),
      },
      { onConflict: 'client_id' },
    );
    if (statusError) throw new ApiError(500, statusError.message);

    await supabase
      .from('agent_runs')
      .update({
        status: 'completed',
        provider: narrativeResult.provider,
        output: { evaluation, narrative: narrativeResult.content },
        completed_at: new Date().toISOString(),
      })
      .eq('id', run.id);

    return { agentRunId: run.id, evaluation, narrative: narrativeResult.content };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown agent error';
    await supabase
      .from('agent_runs')
      .update({ status: 'failed', error_message: message, completed_at: new Date().toISOString() })
      .eq('id', run.id);
    throw err;
  }
}

export async function runComplianceAgentForAllClients(
  supabase: TypedSupabaseClient,
  ownerId: string,
): Promise<RunComplianceAgentResult[]> {
  const { data: clients, error } = await supabase.from('clients').select('id').eq('owner_id', ownerId);
  if (error) throw new ApiError(500, error.message);

  const results: RunComplianceAgentResult[] = [];
  for (const client of clients ?? []) {
    results.push(await runComplianceAgent(supabase, ownerId, client.id));
  }
  return results;
}

export async function getAgentRun(supabase: TypedSupabaseClient, ownerId: string, runId: string): Promise<AgentRun> {
  const { data, error } = await supabase
    .from('agent_runs')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('id', runId)
    .maybeSingle();
  if (error) throw new ApiError(500, error.message);
  if (!data) throw new ApiError(404, 'Agent run not found');
  return data;
}

export async function listAgentRunsForClient(
  supabase: TypedSupabaseClient,
  ownerId: string,
  clientId: string,
): Promise<AgentRun[]> {
  const { data, error } = await supabase
    .from('agent_runs')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('client_id', clientId)
    .order('started_at', { ascending: false })
    .limit(20);
  if (error) throw new ApiError(500, error.message);
  return data ?? [];
}
