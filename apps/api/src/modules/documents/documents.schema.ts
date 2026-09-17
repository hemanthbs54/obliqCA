import { z } from 'zod';
import { MIN_CORRECTION_COMMENT_LENGTH } from '@obliq/shared';

export const documentIdParams = z.object({ id: z.string().uuid() });
export const versionParams = z.object({ id: z.string().uuid(), versionId: z.string().uuid() });

export const signedUrlQuery = z.object({
  download: z
    .enum(['0', '1', 'true', 'false'])
    .optional()
    .transform((v) => v === '1' || v === 'true'),
});

const expectedRowVersion = z.number().int().positive();

export const startReviewBody = z.object({ expectedRowVersion });

export const approveBody = z.object({
  expectedRowVersion,
  comment: z.string().trim().max(2000).optional(),
});

export const requestCorrectionBody = z.object({
  expectedRowVersion,
  comment: z
    .string()
    .trim()
    .min(MIN_CORRECTION_COMMENT_LENGTH, `Explain what needs to be corrected (at least ${MIN_CORRECTION_COMMENT_LENGTH} characters)`)
    .max(2000),
});
