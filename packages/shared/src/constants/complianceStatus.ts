import type { ComplianceStatusValue } from '../types/domain.js';

export const COMPLIANCE_STATUS_META: Record<
  ComplianceStatusValue,
  { label: string; color: 'red' | 'amber' | 'orange' | 'green'; order: number }
> = {
  overdue: { label: 'Overdue', color: 'red', order: 0 },
  missing_docs: { label: 'Missing documents', color: 'orange', order: 1 },
  due_soon: { label: 'Due soon', color: 'amber', order: 2 },
  on_track: { label: 'On track', color: 'green', order: 3 },
};

/** Precedence used by the Compliance Agent's rule engine: lower index wins. */
export const COMPLIANCE_STATUS_PRECEDENCE: ComplianceStatusValue[] = [
  'overdue',
  'missing_docs',
  'due_soon',
  'on_track',
];

export const DUE_SOON_WINDOW_DAYS = 7;
