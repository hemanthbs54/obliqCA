import { DUE_SOON_WINDOW_DAYS, type ComplianceFlag, type ComplianceStatusValue } from '@obliq/shared';

export interface EvaluableTask {
  id: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  filingTypeName: string;
  hasLinkedDocument: boolean;
}

export interface ComplianceEvaluationInput {
  tasks: EvaluableTask[];
  today: Date;
  dueSoonWindowDays?: number;
}

export interface ComplianceEvaluationResult {
  status: ComplianceStatusValue;
  flags: ComplianceFlag[];
  nextDueDate: string | null;
  nextDueFilingType: string | null;
  overdueCount: number;
  missingDocsCount: number;
}

/**
 * Pure, deterministic — no LLM involved. Dates must never be hallucinated;
 * the AI provider is only used afterwards to phrase the narrative summary.
 * Precedence when multiple conditions apply: overdue > missing_docs > due_soon > on_track.
 */
export function evaluateCompliance(input: ComplianceEvaluationInput): ComplianceEvaluationResult {
  const windowDays = input.dueSoonWindowDays ?? DUE_SOON_WINDOW_DAYS;
  const today = new Date(Date.UTC(input.today.getUTCFullYear(), input.today.getUTCMonth(), input.today.getUTCDate()));
  const dueSoonCutoff = new Date(today);
  dueSoonCutoff.setUTCDate(dueSoonCutoff.getUTCDate() + windowDays);

  const openTasks = input.tasks.filter((t) => t.status !== 'completed');

  const flags: ComplianceFlag[] = [];
  let overdueCount = 0;
  let missingDocsCount = 0;
  let nextDueDate: string | null = null;
  let nextDueFilingType: string | null = null;

  for (const task of openTasks.sort((a, b) => a.dueDate.localeCompare(b.dueDate))) {
    const dueDate = new Date(task.dueDate);
    const isOverdue = dueDate < today;
    const isDueSoon = !isOverdue && dueDate <= dueSoonCutoff;

    if (nextDueDate === null) {
      nextDueDate = task.dueDate;
      nextDueFilingType = task.filingTypeName;
    }

    if (isOverdue) {
      overdueCount += 1;
      flags.push({
        type: 'overdue_filing',
        taskId: task.id,
        message: `${task.filingTypeName} was due ${task.dueDate} and is now overdue.`,
        severity: 'critical',
      });
    } else if (isDueSoon) {
      flags.push({
        type: 'due_soon_filing',
        taskId: task.id,
        message: `${task.filingTypeName} is due ${task.dueDate}.`,
        severity: 'warning',
      });
    }

    if ((isOverdue || isDueSoon) && !task.hasLinkedDocument) {
      missingDocsCount += 1;
      flags.push({
        type: 'missing_document',
        taskId: task.id,
        message: `No supporting document has been uploaded yet for ${task.filingTypeName} (${task.dueDate}).`,
        severity: isOverdue ? 'critical' : 'warning',
      });
    }
  }

  let status: ComplianceStatusValue = 'on_track';
  if (overdueCount > 0) status = 'overdue';
  else if (missingDocsCount > 0) status = 'missing_docs';
  else if (flags.some((f) => f.type === 'due_soon_filing')) status = 'due_soon';

  return { status, flags, nextDueDate, nextDueFilingType, overdueCount, missingDocsCount };
}
