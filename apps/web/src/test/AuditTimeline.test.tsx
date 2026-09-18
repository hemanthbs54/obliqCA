import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { AuditEvent } from '@obliq/shared';
import { AuditTimeline } from '@/components/audit/AuditTimeline';

function event(overrides: Partial<AuditEvent>): AuditEvent {
  return {
    id: crypto.randomUUID(),
    firm_id: 'firm-a',
    seq: 1,
    occurred_at: '2026-09-17T04:50:00Z', // 10:20 AM IST
    actor_id: 'u1',
    actor_name: 'Rohit Sharma',
    actor_role: 'staff',
    action: 'document.uploaded',
    client_id: 'c1',
    client_name: 'ABC Traders Pvt. Ltd.',
    document_id: 'd1',
    document_name: 'Bank Statement',
    version_id: 'v1',
    file_name: 'Bank_Statement.pdf',
    from_status: 'pending',
    to_status: 'uploaded',
    comment: null,
    metadata: {},
    prev_hash: '0'.repeat(64),
    hash: 'a'.repeat(64),
    ...overrides,
  };
}

describe('AuditTimeline', () => {
  it('shows who did what, when, to which document, and the reason', () => {
    render(
      <AuditTimeline
        events={[
          event({}),
          event({
            seq: 2,
            occurred_at: '2026-09-17T05:04:00Z', // 10:34 AM IST
            actor_name: 'Aman Verma',
            actor_role: 'reviewer',
            action: 'review.correction_requested',
            comment: 'Page 3 was missing',
          }),
        ]}
      />,
    );

    expect(screen.getByText('Rohit Sharma uploaded Bank Statement (Bank_Statement.pdf)')).toBeInTheDocument();
    expect(screen.getByText('Aman Verma requested a correction on Bank Statement (Bank_Statement.pdf)')).toBeInTheDocument();
    expect(screen.getByText('Page 3 was missing')).toBeInTheDocument();
    expect(screen.getByText('Reason')).toBeInTheDocument();
    expect(screen.getByText(/10:34/i)).toBeInTheDocument();
    expect(screen.getByText('17 Sept 2026')).toBeInTheDocument();
  });

  it('renders an empty message', () => {
    render(<AuditTimeline events={[]} emptyText="Nothing yet" />);
    expect(screen.getByText('Nothing yet')).toBeInTheDocument();
  });
});
