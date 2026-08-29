import type { z } from 'zod';
import type {
  BalanceAdjustSchema,
  InvestmentSchema,
  InvestmentUpdateSchema,
  ProfilePatchSchema,
  TransactionSchema,
  TransactionUpdateSchema,
  VehicleExpenseSchema,
  VehicleSchema,
  VehicleUpdateSchema,
} from './schemas.js';
import type { AllowedTag, MealTag, TransactionType, VehicleKind, VehicleTag } from './tags.js';

export type TransactionInput = z.infer<typeof TransactionSchema>;
export type TransactionUpdate = z.infer<typeof TransactionUpdateSchema>;
export type BalanceAdjustInput = z.infer<typeof BalanceAdjustSchema>;
export type InvestmentInput = z.infer<typeof InvestmentSchema>;
export type InvestmentUpdate = z.infer<typeof InvestmentUpdateSchema>;
export type ProfilePatch = z.infer<typeof ProfilePatchSchema>;
export type VehicleInput = z.infer<typeof VehicleSchema>;
export type VehicleUpdate = z.infer<typeof VehicleUpdateSchema>;
export type VehicleExpenseInput = z.infer<typeof VehicleExpenseSchema>;

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

export type WalletKind = 'bank' | 'cash';

export type Profile = {
  id: string;
  full_name: string | null;
  date_of_birth: string | null;
  bank_balance: number;
  cash_balance: number;
  created_at: string;
};

export type BalanceLog = {
  id: string;
  user_id: string;
  change_amount: number;
  reason: string | null;
  balance_after: number;
  wallet: WalletKind;
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

export type Vehicle = {
  id: string;
  user_id: string;
  name: string;
  kind: VehicleKind;
  image_url: string | null;
  number_plate: string | null;
  created_at: string;
};

export type VehicleExpense = {
  id: string;
  user_id: string;
  vehicle_id: string;
  amount: number;
  note: string | null;
  tags: VehicleTag[];
  occurred_at: string;
  created_at: string;
};

export type DayTotal = {
  date: string;
  total: number;
};

export type MealTotals = Record<MealTag, number>;

export type PeriodTotals = {
  today: number;
  week: number;
  month: number;
};

export type TagTotal = {
  tag: string;
  total: number;
};

export type MealDay = {
  date: string;
  meals: MealTag[];
};

export type TransactionSummary = {
  today: number;
  week: number;
  month: number;
  spent: PeriodTotals;
  additions: PeriodTotals;
  balance: number;
  cashBalance: number;
  meals: MealTotals;
  mealsLoggedToday: MealTag[];
  mealsCalendar: MealDay[];
  calendar: DayTotal[];
  udhar: {
    borrowed: number;
    lent: number;
  };
  byTypeMonth: Record<TransactionType, number>;
  byCategoryMonth: TagTotal[];
  byCategoryYear: TagTotal[];
  dailyAvg: number;
  daysElapsed: number;
  food: PeriodTotals & { dailyAvg: number };
  paymentMonth: Record<'cash' | 'upi' | 'card', number>;
  lastPetrolAt: string | null;
};
