export const TRANSACTION_TYPES = [
  'spend',
  'udhar_taken',
  'udhar_given',
  'emergency',
  'udhar_repay',
  'udhar_collect',
] as const;

/** Types shown when logging a new spend / borrow / lent (not settlements). */
export const ENTRY_TYPES = ['spend', 'udhar_taken', 'udhar_given', 'emergency'] as const;

export const MAJOR_TAGS = ['want', 'need', 'udhar_taken', 'udhar_given'] as const;

export const MEAL_TAGS = ['breakfast', 'lunch', 'snack', 'dinner'] as const;

export const CATEGORY_TAGS = [
  'grocery',
  'daily',
  'food',
  'medical',
  'petrol',
  'rent',
  'chiri_miri',
  'stationary',
] as const;

export const VEHICLE_TAGS = ['petrol', 'maintenance', 'accessories'] as const;

export const PAYMENT_MODES = ['online', 'cash', 'upi', 'card'] as const;
export type PaymentMode = (typeof PAYMENT_MODES)[number];
export const DEFAULT_PAYMENT_MODE: PaymentMode = 'online';

export const PAYMENT_MODE_LABELS: Record<PaymentMode, string> = {
  online: 'Online',
  cash: 'Cash',
  upi: 'UPI',
  card: 'Card',
};

export function hasPaymentMode(tags: readonly string[] | null | undefined): boolean {
  return Boolean(tags?.some((tag) => (PAYMENT_MODES as readonly string[]).includes(tag)));
}

/** Cash spends use cash in hand; anything else (online / UPI / card / unset) is bank. */
export function walletFromTags(tags: readonly string[] | null | undefined): 'bank' | 'cash' {
  return tags?.includes('cash') ? 'cash' : 'bank';
}

export function withDefaultPayment(tags: string[]): string[] {
  if (hasPaymentMode(tags)) return tags;
  return [...tags, DEFAULT_PAYMENT_MODE];
}

export const ALLOWED_TAGS = [
  ...MAJOR_TAGS,
  ...MEAL_TAGS,
  ...CATEGORY_TAGS,
  'maintenance',
  'accessories',
  ...PAYMENT_MODES,
] as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[number];
export type MajorTag = (typeof MAJOR_TAGS)[number];
export type MealTag = (typeof MEAL_TAGS)[number];
export type CategoryTag = (typeof CATEGORY_TAGS)[number];
export type VehicleTag = (typeof VEHICLE_TAGS)[number];
export type AllowedTag = (typeof ALLOWED_TAGS)[number];

export const TYPE_LABELS: Record<TransactionType, string> = {
  spend: 'Spend',
  udhar_taken: 'Borrow',
  udhar_given: 'Lent',
  emergency: 'Emergency',
  udhar_repay: 'Returned',
  udhar_collect: 'Collected',
};

export const TAG_LABELS: Record<string, string> = {
  want: 'Want',
  need: 'Need',
  udhar_taken: 'Borrow',
  udhar_given: 'Lent',
  udhar_repay: 'Returned',
  udhar_collect: 'Collected',
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snack: 'Snack',
  dinner: 'Dinner',
  grocery: 'Grocery',
  daily: 'Daily',
  food: 'Food',
  medical: 'Medical',
  petrol: 'Petrol',
  rent: 'Rent',
  chiri_miri: 'Chiri miri',
  stationary: 'Stationary',
  maintenance: 'Maintenance',
  accessories: 'Accessories',
  online: 'Online',
  cash: 'Cash',
  upi: 'UPI',
  card: 'Card',
};

/** Local hour as 0–24 (minutes as fraction). Breakfast 7–12, lunch 12–16, snack 16–19, dinner 19–23. */
export const CORE_MEALS = ['breakfast', 'lunch', 'dinner'] as const;
export type CoreMeal = (typeof CORE_MEALS)[number];

/** Food KPI counts only breakfast / lunch / dinner tags — not snack or the generic food category. */
export function isFoodTag(tag: string): boolean {
  return (CORE_MEALS as readonly string[]).includes(tag);
}

export function mealTagFromHour(hour: number): MealTag | null {
  if (hour >= 7 && hour < 12) return 'breakfast';
  if (hour >= 12 && hour < 16) return 'lunch';
  if (hour >= 16 && hour < 19) return 'snack';
  if (hour >= 19 && hour < 23) return 'dinner';
  return null;
}

export const VEHICLE_KINDS = ['2w', '4w'] as const;
export type VehicleKind = (typeof VEHICLE_KINDS)[number];

export const VEHICLE_KIND_LABELS: Record<VehicleKind, string> = {
  '2w': '2 wheeler',
  '4w': '4 wheeler',
};
