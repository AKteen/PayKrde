export const TRANSACTION_TYPES = [
  'spend',
  'udhar_taken',
  'udhar_given',
  'emergency',
] as const;

export const MAJOR_TAGS = ['want', 'need', 'udhar_taken', 'udhar_given'] as const;

export const CATEGORY_TAGS = [
  'grocery',
  'daily',
  'food',
  'medical',
  'petrol',
  'chiri_miri',
  'stationary',
] as const;

export const ALLOWED_TAGS = [...MAJOR_TAGS, ...CATEGORY_TAGS] as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[number];
export type MajorTag = (typeof MAJOR_TAGS)[number];
export type CategoryTag = (typeof CATEGORY_TAGS)[number];
export type AllowedTag = (typeof ALLOWED_TAGS)[number];

export const TYPE_LABELS: Record<TransactionType, string> = {
  spend: 'Spend',
  udhar_taken: 'Udhar taken',
  udhar_given: 'Udhar given',
  emergency: 'Emergency',
};

export const TAG_LABELS: Record<AllowedTag, string> = {
  want: 'Want',
  need: 'Need',
  udhar_taken: 'Udhar taken',
  udhar_given: 'Udhar given',
  grocery: 'Grocery',
  daily: 'Daily',
  food: 'Food',
  medical: 'Medical',
  petrol: 'Petrol',
  chiri_miri: 'Chiri miri',
  stationary: 'Stationary',
};
