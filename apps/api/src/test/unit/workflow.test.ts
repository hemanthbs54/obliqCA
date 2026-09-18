import { describe, expect, it } from 'vitest';
import {
  availableActions,
  getActionAvailability,
  validateCorrectionComment,
  type DocumentActionContext,
} from '@obliq/shared';

const STAFF = 'staff-1';
const REVIEWER = 'reviewer-1';
const OTHER_REVIEWER = 'reviewer-2';
const PARTNER = 'partner-1';

function ctx(overrides: Partial<DocumentActionContext>): DocumentActionContext {
  return {
    role: 'reviewer',
    userId: REVIEWER,
    status: 'pending',
    reviewerId: null,
    currentVersionUploadedBy: STAFF,
    ...overrides,
  };
}

describe('document workflow', () => {
  it('lets staff upload a pending document but not review it', () => {
    expect(availableActions(ctx({ role: 'staff', userId: STAFF, status: 'pending', currentVersionUploadedBy: null }))).toEqual(['upload']);
  });

  it('only offers "start review" on an uploaded document to reviewers', () => {
    expect(availableActions(ctx({ status: 'uploaded' }))).toEqual(['start_review']);
    expect(availableActions(ctx({ role: 'staff', userId: STAFF, status: 'uploaded' }))).toEqual(['upload']);
  });

  it('offers approve and request correction to the reviewer who started the review', () => {
    expect(availableActions(ctx({ status: 'under_review', reviewerId: REVIEWER }))).toEqual(['approve', 'request_correction']);
  });

  it("blocks a different reviewer from deciding someone else's review, but not a partner", () => {
    const other = getActionAvailability('approve', ctx({ userId: OTHER_REVIEWER, status: 'under_review', reviewerId: REVIEWER }));
    expect(other).toEqual({ allowed: false, reason: 'Another reviewer is reviewing this document' });

    const partner = getActionAvailability('approve', ctx({ role: 'partner', userId: PARTNER, status: 'under_review', reviewerId: REVIEWER }));
    expect(partner).toEqual({ allowed: true });
  });

  it('enforces maker-checker: the uploader of the current version cannot review it', () => {
    const own = ctx({ role: 'partner', userId: PARTNER, status: 'uploaded', currentVersionUploadedBy: PARTNER });
    expect(getActionAvailability('start_review', own)).toMatchObject({ allowed: false, reason: expect.stringContaining('maker-checker') });
  });

  it('lets staff respond to a correction by uploading again, and freezes approved documents', () => {
    expect(availableActions(ctx({ role: 'staff', userId: STAFF, status: 'correction_required' }))).toEqual(['upload']);
    expect(availableActions(ctx({ role: 'partner', userId: PARTNER, status: 'approved' }))).toEqual([]);
    expect(availableActions(ctx({ role: 'staff', userId: STAFF, status: 'under_review' }))).toEqual([]);
  });

  it('requires a meaningful correction comment', () => {
    expect(validateCorrectionComment('   bad   ')).toMatch(/at least 10 characters/);
    expect(validateCorrectionComment('Page 3 is missing.')).toBeNull();
  });
});
