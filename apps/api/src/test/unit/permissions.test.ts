import { describe, expect, it } from 'vitest';
import { can } from '@obliq/shared';

describe('role capabilities (from the brief)', () => {
  it('staff can upload but cannot review, create clients, or read the firm audit log', () => {
    expect(can('staff', 'document.upload')).toBe(true);
    expect(can('staff', 'document.review')).toBe(false);
    expect(can('staff', 'client.create')).toBe(false);
    expect(can('staff', 'audit.view_firm_log')).toBe(false);
    expect(can('staff', 'client.view_all')).toBe(false);
  });

  it('reviewers review and read audit history but do not upload client files', () => {
    expect(can('reviewer', 'document.review')).toBe(true);
    expect(can('reviewer', 'audit.view_firm_log')).toBe(true);
    expect(can('reviewer', 'document.upload')).toBe(false);
  });

  it('partners can do everything', () => {
    for (const capability of ['document.upload', 'document.review', 'client.create', 'audit.view_firm_log'] as const) {
      expect(can('partner', capability)).toBe(true);
    }
  });
});
