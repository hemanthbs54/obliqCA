import { COMPLIANCE_STATUS_META, type ComplianceStatusValue } from '@obliq/shared';
import { Badge } from '@/components/ui/Badge';

const TONE_MAP = {
  green: 'green',
  amber: 'amber',
  orange: 'orange',
  red: 'red',
} as const;

export function ComplianceStatusBadge({ status }: { status: ComplianceStatusValue }) {
  const meta = COMPLIANCE_STATUS_META[status];
  return <Badge tone={TONE_MAP[meta.color]}>{meta.label}</Badge>;
}
