import type { SVGProps } from 'react';

function Base(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  );
}

export function IconCalendar(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01" />
    </Base>
  );
}

export function IconFileSearch(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8" />
      <path d="M14 3l5 5v3" />
      <path d="M14 3v5h5" />
      <circle cx="15.5" cy="16.5" r="2.5" />
      <path d="M17.3 18.3 19 20" />
    </Base>
  );
}

export function IconBot(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <rect x="4" y="8" width="16" height="12" rx="2" />
      <path d="M12 8V4M9 4h6" />
      <circle cx="9" cy="14" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="14" r="1.2" fill="currentColor" stroke="none" />
      <path d="M9 17.5h6" />
    </Base>
  );
}

export function IconMessage(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M4 5h16v11H8l-4 4V5Z" />
      <path d="M8 9h8M8 12.5h5" />
    </Base>
  );
}

export function IconGauge(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M4 15a8 8 0 1 1 16 0" />
      <path d="M12 15l3.5-4.5" />
      <path d="M12 15h.01" />
    </Base>
  );
}

export function IconPlug(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M9 3v5M15 3v5" />
      <path d="M7 8h10v3a5 5 0 0 1-10 0V8Z" />
      <path d="M12 16v5" />
    </Base>
  );
}
