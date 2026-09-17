import type { MemberRole } from './workflow.js';

/**
 * Role → capability matrix from the brief (Staff / Reviewer, plus the
 * optional Partner role). Used by the API's route guards and the UI; the
 * database re-checks every write independently.
 */
export const CAPABILITIES = [
  'client.view_all',
  'client.create',
  'client.assign_staff',
  'document.add_requirement',
  'document.upload',
  'document.review',
  'audit.view_firm_log',
] as const;
export type Capability = (typeof CAPABILITIES)[number];

export const ROLE_CAPABILITIES: Record<MemberRole, readonly Capability[]> = {
  // Staff: view assigned clients, upload, view status, respond to corrections.
  staff: ['document.upload'],
  // Reviewer: view, review, approve, request corrections, view audit history.
  reviewer: [
    'client.view_all',
    'client.create',
    'client.assign_staff',
    'document.add_requirement',
    'document.review',
    'audit.view_firm_log',
  ],
  // Partner: everything (still subject to maker-checker on their own uploads).
  partner: [...CAPABILITIES],
};

export function can(role: MemberRole, capability: Capability): boolean {
  return ROLE_CAPABILITIES[role].includes(capability);
}

export const ROLE_META: Record<MemberRole, { label: string; summary: string }> = {
  staff: { label: 'Staff', summary: 'Uploads client documents and responds to correction requests' },
  reviewer: { label: 'Reviewer', summary: 'Reviews documents, approves or requests corrections' },
  partner: { label: 'Partner', summary: 'Full access within the firm' },
};
