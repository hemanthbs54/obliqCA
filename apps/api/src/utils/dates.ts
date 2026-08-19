/** Adds `count` of `unit` to a date, returned as a YYYY-MM-DD string (UTC, no time component). */
export function addPeriod(from: Date, unit: 'month' | 'quarter' | 'year', count = 1): string {
  const result = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  if (unit === 'month') result.setUTCMonth(result.getUTCMonth() + count);
  if (unit === 'quarter') result.setUTCMonth(result.getUTCMonth() + count * 3);
  if (unit === 'year') result.setUTCFullYear(result.getUTCFullYear() + count);
  return result.toISOString().slice(0, 10);
}

export function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}
