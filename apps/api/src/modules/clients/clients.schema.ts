import { z } from 'zod';

export const clientTypeSchema = z.enum(['individual', 'proprietorship', 'partnership', 'llp', 'company']);

export const createClientSchema = z.object({
  name: z.string().min(1),
  clientType: clientTypeSchema.default('individual'),
  pan: z.string().optional(),
  gstin: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export const updateClientSchema = createClientSchema.partial();

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
