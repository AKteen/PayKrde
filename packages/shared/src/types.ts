import type { z } from 'zod';
import type {
  BalanceAdjustSchema,
  InvestmentSchema,
  InvestmentUpdateSchema,
  ProfilePatchSchema,
  TransactionSchema,
  TransactionUpdateSchema,
} from './schemas.js';
import type { AllowedTag, TransactionType } from './tags.js';

export type TransactionInput = z.infer<typeof TransactionSchema>;
export type TransactionUpdate = z.infer<typeof TransactionUpdateSchema>;
export type BalanceAdjustInput = z.infer<typeof BalanceAdjustSchema>;
export type InvestmentInput = z.infer<typeof InvestmentSchema>;
export type InvestmentUpdate = z.infer<typeof InvestmentUpdateSchema>;
export type ProfilePatch = z.infer<typeof ProfilePatchSchema>;

export type Transaction = {
  id: string;
  user_id: string;
  amount: number;
  note: string | null;
  type: TransactionType;
  tags: AllowedTag[];
  occurred_at: string;
  created_at: string;
};

export type Profile = {
  id: string;
  full_name: string | null;
  date_of_birth: string | null;
  bank_balance: number;
  created_at: string;
};

export type BalanceLog = {
  id: string;
  user_id: string;
  change_amount: number;
  reason: string | null;
  balance_after: number;
  created_at: string;
};

export type Investment = {
  id: string;
  user_id: string;
  name: string;
  amount_invested: number;
  current_value: number;
  notes: string | null;
  updated_at: string;
};

export type DayTotal = {
  date: string;
  total: number;
};

export type TransactionSummary = {
  today: number;
  week: number;
  month: number;
  calendar: DayTotal[];
};
