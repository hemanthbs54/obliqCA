import type { FilingFrequency } from '@obliq/shared';

export interface NextPeriod {
  periodLabel: string;
  dueDate: string; // YYYY-MM-DD
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Simplified Indian filing-calendar heuristics for demo purposes — not a
 * substitute for the actual statutory due-date tables (which vary by
 * turnover, state, and notification). Good enough to drive realistic
 * task/due-date generation for the compliance dashboard.
 */
export function computeNextPeriod(frequency: FilingFrequency, from: Date): NextPeriod {
  if (frequency === 'monthly') {
    // GST-style: period = previous calendar month, due on the 20th of the following month.
    const periodDate = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1));
    const dueDate = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 20));
    return {
      periodLabel: `${MONTH_NAMES[periodDate.getUTCMonth()]} ${periodDate.getUTCFullYear()}`,
      dueDate: dueDate.toISOString().slice(0, 10),
    };
  }

  if (frequency === 'quarterly') {
    // TDS-style: quarter ending this month, due ~1 month after quarter end.
    const quarter = Math.floor(from.getUTCMonth() / 3) + 1;
    const quarterEndMonth = quarter * 3 - 1; // 0-indexed month of quarter end
    const dueDate = new Date(Date.UTC(from.getUTCFullYear(), quarterEndMonth + 1, 31));
    const fyStartYear = from.getUTCMonth() >= 3 ? from.getUTCFullYear() : from.getUTCFullYear() - 1;
    return {
      periodLabel: `Q${quarter} FY${String(fyStartYear).slice(2)}-${String(fyStartYear + 1).slice(2)}`,
      dueDate: dueDate.toISOString().slice(0, 10),
    };
  }

  // annually — ITR-style: FY ending March 31, due July 31 of the same calendar year.
  const fyStartYear = from.getUTCMonth() >= 3 ? from.getUTCFullYear() : from.getUTCFullYear() - 1;
  const dueDate = new Date(Date.UTC(fyStartYear + 1, 6, 31));
  return {
    periodLabel: `FY ${fyStartYear}-${String(fyStartYear + 1).slice(2)}`,
    dueDate: dueDate.toISOString().slice(0, 10),
  };
}
