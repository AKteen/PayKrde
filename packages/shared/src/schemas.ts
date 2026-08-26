import { z } from 'zod';
import { ALLOWED_TAGS, TRANSACTION_TYPES } from './tags.js';

const allowedTagSet = new Set<string>(ALLOWED_TAGS);

export const tagsSchema = z
  .array(z.string())
  .default([])
  .refine((tags) => tags.every((tag) => allowedTagSet.has(tag)), {
    message: 'One or more tags are not in the allowed set',
  });

export const TransactionSchema = z.object({
  amount: z.number().positive(),
  note: z
    .string()
    .max(280)
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  type: z.enum(TRANSACTION_TYPES).default('spend'),
  tags: tagsSchema,
  occurred_at: z.string().datetime(),
});

export const TransactionUpdateSchema = TransactionSchema.partial();

export const BalanceAdjustSchema = z.object({
  change_amount: z.number().refine((n) => n !== 0, {
    message: 'change_amount must be non-zero',
  }),
  reason: z.string().max(280).optional(),
});

export const InvestmentSchema = z.object({
  name: z.string().min(1).max(120),
  amount_invested: z.number().nonnegative(),
  current_value: z.number().nonnegative(),
  notes: z
    .string()
    .max(500)
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
});

export const InvestmentUpdateSchema = InvestmentSchema.partial();

export const ProfilePatchSchema = z.object({
  full_name: z.string().max(120).optional(),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')
    .nullable()
    .optional(),
});
