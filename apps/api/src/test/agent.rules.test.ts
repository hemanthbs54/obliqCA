import { describe, expect, it } from 'vitest';
import { evaluateCompliance, type EvaluableTask } from '../modules/agent/agent.rules.js';

const TODAY = new Date('2026-08-19T00:00:00Z');

function task(overrides: Partial<EvaluableTask>): EvaluableTask {
  return {
    id: 't1',
    dueDate: '2026-09-01',
    status: 'pending',
    filingTypeName: 'GSTR-3B',
    hasLinkedDocument: true,
    ...overrides,
  };
}

describe('evaluateCompliance', () => {
  it('returns on_track when there are no open tasks', () => {
    const result = evaluateCompliance({ today: TODAY, tasks: [] });
    expect(result.status).toBe('on_track');
    expect(result.nextDueDate).toBeNull();
    expect(result.flags).toHaveLength(0);
  });

  it('ignores completed tasks entirely', () => {
    const result = evaluateCompliance({
      today: TODAY,
      tasks: [task({ dueDate: '2026-01-01', status: 'completed', hasLinkedDocument: false })],
    });
    expect(result.status).toBe('on_track');
  });

  it('flags overdue tasks and takes precedence over everything else', () => {
    const result = evaluateCompliance({
      today: TODAY,
      tasks: [
        task({ id: 'overdue', dueDate: '2026-08-01', hasLinkedDocument: false }),
        task({ id: 'due-soon', dueDate: '2026-08-22', hasLinkedDocument: true }),
      ],
    });
    expect(result.status).toBe('overdue');
    expect(result.overdueCount).toBe(1);
    expect(result.flags.map((f) => f.type)).toContain('overdue_filing');
  });

  it('flags missing_docs above due_soon when a near-due task has no document', () => {
    const result = evaluateCompliance({
      today: TODAY,
      tasks: [task({ dueDate: '2026-08-24', hasLinkedDocument: false })],
    });
    expect(result.status).toBe('missing_docs');
    expect(result.missingDocsCount).toBe(1);
  });

  it('is due_soon when a near-due task already has its document linked', () => {
    const result = evaluateCompliance({
      today: TODAY,
      tasks: [task({ dueDate: '2026-08-24', hasLinkedDocument: true })],
    });
    expect(result.status).toBe('due_soon');
    expect(result.missingDocsCount).toBe(0);
  });

  it('does not flag missing documents for tasks far in the future', () => {
    const result = evaluateCompliance({
      today: TODAY,
      tasks: [task({ dueDate: '2027-01-01', hasLinkedDocument: false })],
    });
    expect(result.status).toBe('on_track');
    expect(result.missingDocsCount).toBe(0);
  });

  it('reports the earliest open task as nextDueDate', () => {
    const result = evaluateCompliance({
      today: TODAY,
      tasks: [
        task({ id: 'a', dueDate: '2026-12-01', filingTypeName: 'ITR' }),
        task({ id: 'b', dueDate: '2026-08-25', filingTypeName: 'GSTR-3B' }),
      ],
    });
    expect(result.nextDueDate).toBe('2026-08-25');
    expect(result.nextDueFilingType).toBe('GSTR-3B');
  });
});
