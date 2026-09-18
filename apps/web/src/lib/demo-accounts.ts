import type { MemberRole } from '@obliq/shared';

/** Seeded by `pnpm seed`. Shown on the login page only when NEXT_PUBLIC_DEMO_MODE=true. */
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
export const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? 'AuditDemo@2026';

export interface DemoAccount {
  email: string;
  name: string;
  role: MemberRole;
  note: string;
}

export const DEMO_FIRMS: { firm: string; accounts: DemoAccount[] }[] = [
  {
    firm: 'ABC & Co.',
    accounts: [
      { email: 'rohit@abc-co.demo', name: 'Rohit Sharma', role: 'staff', note: 'Trade Links India, Indus Novate' },
      { email: 'aman@abc-co.demo', name: 'Aman Verma', role: 'reviewer', note: 'Reviews documents' },
      { email: 'priya@abc-co.demo', name: 'Priya Iyer', role: 'partner', note: 'Full firm access' },
      { email: 'meera@abc-co.demo', name: 'Meera Nair', role: 'staff', note: 'Only sees Indus Novate' },
    ],
  },
  {
    firm: 'XYZ & Co.',
    accounts: [
      { email: 'neha@xyz-co.demo', name: 'Neha Kapoor', role: 'staff', note: 'Assigned to Pixelcraft Studios' },
      { email: 'vikram@xyz-co.demo', name: 'Vikram Rao', role: 'reviewer', note: 'Try opening an ABC link' },
    ],
  },
];
