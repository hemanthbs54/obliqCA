const IST: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Kolkata' };

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { ...IST, day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { ...IST, hour: 'numeric', minute: '2-digit' });
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)}, ${formatTime(iso)}`;
}
