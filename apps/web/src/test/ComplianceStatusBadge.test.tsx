import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComplianceStatusBadge } from '@/components/dashboard/ComplianceStatusBadge';

describe('ComplianceStatusBadge', () => {
  it.each([
    ['overdue', 'Overdue'],
    ['missing_docs', 'Missing documents'],
    ['due_soon', 'Due soon'],
    ['on_track', 'On track'],
  ] as const)('renders the correct label for status "%s"', (status, label) => {
    render(<ComplianceStatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
