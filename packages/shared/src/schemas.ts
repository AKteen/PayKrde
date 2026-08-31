import { z } from 'zod';
import { ALLOWED_TAGS, TRANSACTION_TYPES, VEHICLE_KINDS, VEHICLE_TAGS } from './tags.js';

const allowedTagSet = new Set<string>(ALLOWED_TAGS);
const vehicleTagSet = new Set<string>(VEHICLE_TAGS);

export type FieldErrors = Record<string, string>;

export function zodFieldErrors(error: z.ZodError): { error: string; fields: FieldErrors } {
  const fields: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).filter(Boolean).join('.') || '_form';
    if (!fields[key]) fields[key] = issue.message;
  }
  return {
    error: Object.values(fields)[0] ?? 'Please check the form and try again.',
    fields,
  };
}

function emptyToUndef(v: unknown) {
  if (v === '' || v === null || v === undefined) return undefined;
  return v;
}

function parseMoney(v: unknown) {
  const next = emptyToUndef(v);
  if (typeof next === 'string') {
    const t = next.trim().replace(/,/g, '');
    if (!t) return undefined;
    return Number(t);
  }
  return next;
}

const moneyPositive = z.preprocess(
  parseMoney,
  z
    .number({ required_error: 'Enter amount', invalid_type_error: 'Enter a valid amount' })
    .finite('Enter a valid amount')
    .gt(0, 'Amount must be greater than 0')
    .lte(99_99_99_999, 'Amount is too large')
    .transform((n) => Math.round(n * 100) / 100),
);

const moneyNonNegative = z.preprocess(
  parseMoney,
  z
    .number({ required_error: 'Enter amount', invalid_type_error: 'Enter a valid amount' })
    .finite('Enter a valid amount')
    .min(0, 'Amount cannot be negative')
    .lte(99_99_99_999, 'Amount is too large')
    .transform((n) => Math.round(n * 100) / 100),
);

const moneyNonZero = z.preprocess(
  parseMoney,
  z
    .number({ required_error: 'Enter amount', invalid_type_error: 'Enter a valid amount' })
    .finite('Enter a valid amount')
    .refine((n) => n !== 0, 'Amount cannot be zero')
    .refine((n) => Math.abs(n) <= 99_99_99_999, 'Amount is too large')
    .transform((n) => Math.round(n * 100) / 100),
);

const noteField = z.preprocess(
  (v) => {
    if (typeof v !== 'string') return emptyToUndef(v);
    const t = v.trim();
    return t === '' ? undefined : t;
  },
  z.string().max(280, 'Note must be 280 characters or less').optional(),
);

const occurredAtField = z
  .string({ required_error: 'Pick a date and time', invalid_type_error: 'Pick a date and time' })
  .min(1, 'Pick a date and time')
  .refine((s) => !Number.isNaN(Date.parse(s)), 'Enter a valid date and time')
  .refine((s) => {
    const t = Date.parse(s);
    return t >= Date.UTC(2000, 0, 1) && t <= Date.now() + 86_400_000;
  }, 'Date must be between 2000 and tomorrow');

export const tagsSchema = z
  .array(z.string())
  .default([])
  .refine((tags) => tags.every((tag) => allowedTagSet.has(tag)), {
    message: 'One or more tags are not allowed',
  });

export const TransactionSchema = z.object({
  amount: moneyPositive,
  note: noteField,
  type: z.enum(TRANSACTION_TYPES, { errorMap: () => ({ message: 'Pick a valid type' }) }).default('spend'),
  tags: tagsSchema,
  occurred_at: occurredAtField,
});

export const TransactionUpdateSchema = TransactionSchema.partial();

export const BalanceAdjustSchema = z.object({
  change_amount: moneyNonZero,
  reason: noteField,
  wallet: z.enum(['bank', 'cash']).default('bank'),
});

export const InvestmentSchema = z.object({
  name: z
    .string({ required_error: 'Enter a name' })
    .trim()
    .min(1, 'Enter a name')
    .max(120, 'Name must be 120 characters or less'),
  amount_invested: moneyNonNegative,
  current_value: moneyNonNegative,
  notes: z.preprocess(
    (v) => {
      if (typeof v !== 'string') return emptyToUndef(v);
      const t = v.trim();
      return t === '' ? undefined : t;
    },
    z.string().max(500, 'Notes must be 500 characters or less').optional(),
  ),
});

export const InvestmentUpdateSchema = InvestmentSchema.partial();

export const ProfilePatchSchema = z.object({
  full_name: z
    .string()
    .trim()
    .max(120, 'Name must be 120 characters or less')
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  date_of_birth: z
    .union([
      z.null(),
      z.literal(''),
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
    ])
    .optional()
    .transform((v) => (v === '' ? null : v))
    .refine((v) => {
      if (!v) return true;
      const t = Date.parse(`${v}T00:00:00`);
      return !Number.isNaN(t) && t <= Date.now() && t >= Date.UTC(1920, 0, 1);
    }, 'Enter a valid date of birth'),
});

const imageUrlField = z.preprocess(
  (v) => (v === '' ? null : v),
  z
    .union([
      z.null(),
      z
        .string()
        .max(800_000, 'Image is too large')
        .refine(
          (s) =>
            /^data:image\/(jpeg|jpg|png|webp|gif);base64,/i.test(s) || /^https?:\/\//i.test(s),
          'Upload a JPEG, PNG, or WebP image',
        ),
    ])
    .optional(),
);

const numberPlateField = z.preprocess(
  (v) => {
    if (v === '' || v == null) return null;
    if (typeof v !== 'string') return v;
    const t = v.trim().toUpperCase().replace(/\s+/g, ' ');
    return t === '' ? null : t;
  },
  z
    .union([
      z.null(),
      z
        .string()
        .max(16, 'Number plate is too long')
        .regex(/^[A-Z0-9][A-Z0-9 \-]*$/, 'Use letters, numbers, spaces, or hyphens'),
    ])
    .optional(),
);

export const VehicleSchema = z.object({
  name: z
    .string({ required_error: 'Enter a vehicle name' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(80, 'Name must be 80 characters or less'),
  kind: z.enum(VEHICLE_KINDS, { errorMap: () => ({ message: 'Pick 2 wheeler or 4 wheeler' }) }),
  image_url: imageUrlField,
  number_plate: numberPlateField,
});

export const VehicleUpdateSchema = VehicleSchema.partial();

export const VehicleExpenseSchema = z.object({
  amount: moneyPositive,
  note: noteField,
  tags: z
    .array(z.string())
    .min(1, 'Pick at least one category')
    .refine((tags) => tags.every((tag) => vehicleTagSet.has(tag)), {
      message: 'Use petrol, maintenance, or accessories',
    }),
  occurred_at: occurredAtField,
});

const optionalQueryString = z.preprocess(
  (v) => (v === '' || v === undefined || v === null ? undefined : v),
  z.string().optional(),
);

const optionalMoney = z.preprocess((v) => {
  const next = emptyToUndef(v);
  if (typeof next === 'string') {
    const t = next.trim().replace(/,/g, '');
    if (!t) return undefined;
    return Number(t);
  }
  return next;
}, z.number().finite().min(0).lte(99_99_99_999).optional());

export const TransactionListQuerySchema = z
  .object({
    from: optionalQueryString,
    to: optionalQueryString,
    type: z.preprocess(
      (v) => (v === '' || v == null ? undefined : v),
      z.enum(TRANSACTION_TYPES).optional(),
    ),
    tag: optionalQueryString,
    payment: z.preprocess(
      (v) => (v === '' || v == null ? undefined : v),
      z.enum(['online', 'cash', 'upi', 'card']).optional(),
    ),
    sort: z.enum(['newest', 'oldest', 'amount']).default('newest'),
    minAmount: optionalMoney,
    maxAmount: optionalMoney,
    q: z.preprocess(
      (v) => (typeof v === 'string' ? v.trim().slice(0, 120) : v),
      z.string().max(120).optional(),
    ),
  })
  .superRefine((val, ctx) => {
    if (val.from && Number.isNaN(Date.parse(val.from))) {
      ctx.addIssue({ code: 'custom', path: ['from'], message: 'Enter a valid from date' });
    }
    if (val.to && Number.isNaN(Date.parse(val.to))) {
      ctx.addIssue({ code: 'custom', path: ['to'], message: 'Enter a valid to date' });
    }
    if (val.from && val.to && Date.parse(val.from) > Date.parse(val.to)) {
      ctx.addIssue({ code: 'custom', path: ['to'], message: 'To date must be after from date' });
    }
    if (val.minAmount != null && val.maxAmount != null && val.minAmount > val.maxAmount) {
      ctx.addIssue({
        code: 'custom',
        path: ['maxAmount'],
        message: 'Max amount must be at least min amount',
      });
    }
    if (val.tag && !allowedTagSet.has(val.tag)) {
      ctx.addIssue({ code: 'custom', path: ['tag'], message: 'Unknown category' });
    }
  });

export const AuthCredentialsSchema = z.object({
  email: z
    .string({ required_error: 'Enter your email' })
    .trim()
    .min(1, 'Enter your email')
    .email('Enter a valid email'),
  password: z
    .string({ required_error: 'Enter your password' })
    .min(6, 'Password must be at least 6 characters')
    .max(72, 'Password is too long'),
});
