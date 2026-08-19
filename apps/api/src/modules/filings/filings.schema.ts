import { z } from 'zod';

export const attachFilingSchema = z.object({
  filingTypeId: z.string().uuid(),
  frequencyOverride: z.enum(['monthly', 'quarterly', 'annually']).optional(),
});
