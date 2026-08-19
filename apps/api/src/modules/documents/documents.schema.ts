import { z } from 'zod';

export const docTypeSchema = z.enum(['invoice', 'ledger', 'financial_statement', 'other']);
