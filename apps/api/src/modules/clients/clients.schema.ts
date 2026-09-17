import { z } from 'zod';

export const clientIdParams = z.object({ id: z.string().uuid() });

const emptyToNull = (value: unknown) => (typeof value === 'string' && value.trim() === '' ? null : value);

export const createClientBody = z.object({
  name: z.string().trim().min(2, 'Client name must be at least 2 characters').max(200),
  pan: z.preprocess(
    emptyToNull,
    z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'PAN must look like ABCDE1234F')
      .nullish(),
  ),
  gstin: z.preprocess(
    emptyToNull,
    z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/, 'GSTIN must be 15 characters, e.g. 27ABCDE1234F1Z5')
      .nullish(),
  ),
  documentNames: z
    .array(z.string().trim().min(2).max(120))
    .max(30)
    .default([]),
});

export const assignStaffBody = z.object({ userId: z.string().uuid() });

export const addDocumentBody = z.object({
  name: z.string().trim().min(2, 'Document name must be at least 2 characters').max(120),
});
