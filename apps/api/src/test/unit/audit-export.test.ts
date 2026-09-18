import { describe, expect, it, vi } from 'vitest';
import { describeAuditEvent, type AuditEvent } from '@obliq/shared';

vi.mock('../../config/env.js', () => ({ env: {} }));
const { csvCell, eventsToCsv } = await import('../../modules/audit/audit.service.js');

function event(overrides: Partial<AuditEvent>): AuditEvent {
  return {
    id: 'e1',
    firm_id: 'f1',
    seq: 3,
    occurred_at: '2026-09-17T05:04:00.000Z',
    actor_id: 'u1',
    actor_name: 'Aman Verma',
    actor_role: 'reviewer',
    action: 'review.correction_requested',
    client_id: 'c1',
    client_name: 'ABC Traders Pvt. Ltd.',
    document_id: 'd1',
    document_name: 'Bank Statement',
    version_id: 'v1',
    file_name: 'Bank_Statement.pdf',
    from_status: 'under_review',
    to_status: 'correction_required',
    comment: 'Page 3 is missing. Please upload the complete bank statement.',
    metadata: { versionNo: 1 },
    prev_hash: '0'.repeat(64),
    hash: 'a'.repeat(64),
    ...overrides,
  };
}

describe('audit event presentation', () => {
  it('describes who did what to which document', () => {
    expect(describeAuditEvent(event({}))).toBe('Aman Verma requested a correction on Bank Statement (Bank_Statement.pdf)');
    expect(describeAuditEvent(event({ action: 'document.reuploaded', actor_name: 'Rohit Sharma', metadata: { versionNo: 2 } }))).toBe(
      'Rohit Sharma uploaded a revised Bank Statement (Bank_Statement.pdf) — version 2',
    );
  });

  it('exports CSV with who, what, when, document and reason', () => {
    const [header, row] = eventsToCsv([event({})]).trim().split('\r\n');
    expect(header).toBe('seq,occurred_at_utc,actor,actor_role,action,client,document,file,from_status,to_status,comment,summary,hash');
    expect(row).toContain('Aman Verma,reviewer,Correction requested,ABC Traders Pvt. Ltd.,Bank Statement,Bank_Statement.pdf,Under review,Correction required');
    expect(row).toContain('Page 3 is missing. Please upload the complete bank statement.');
  });

  it('quotes delimiters and neutralises spreadsheet formulas', () => {
    expect(csvCell('a,b "c"')).toBe('"a,b ""c"""');
    expect(csvCell('=HYPERLINK("http://evil")')).toBe(`"'=HYPERLINK(""http://evil"")"`);
    expect(csvCell(null)).toBe('');
  });
});
