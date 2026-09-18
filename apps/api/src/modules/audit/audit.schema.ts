import { z } from 'zod';
import { AUDIT_ACTIONS } from '@obliq/shared';

export const auditFiltersQuery = z.object({
  clientId: z.string().uuid().optional(),
  documentId: z.string().uuid().optional(),
  actorId: z.string().uuid().optional(),
  action: z.enum(AUDIT_ACTIONS).optional(),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  beforeSeq: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export type AuditFilters = z.infer<typeof auditFiltersQuery>;
