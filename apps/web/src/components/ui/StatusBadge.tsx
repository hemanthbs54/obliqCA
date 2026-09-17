import { DOCUMENT_STATUS_META, ROLE_META, type DocumentStatus, type MemberRole } from '@obliq/shared';
import { Badge } from '@/components/ui/Badge';

export function StatusBadge({ status }: { status: DocumentStatus }) {
  const meta = DOCUMENT_STATUS_META[status];
  return (
    <Badge tone={meta.tone} title={meta.hint}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {meta.label}
    </Badge>
  );
}

export function RoleBadge({ role }: { role: MemberRole }) {
  return (
    <Badge tone={role === 'staff' ? 'default' : 'accent'} title={ROLE_META[role].summary}>
      {ROLE_META[role].label}
    </Badge>
  );
}
