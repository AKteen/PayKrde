import { TAG_LABELS } from '@kharcha/shared';
import { cn } from '@/lib/utils';

export const TAG_META: Record<
  string,
  { icon: string; fg: string; bg: string; border: string }
> = {
  breakfast: { icon: 'free_breakfast', fg: '#B45309', bg: '#FEF3C7', border: '#FDE68A' },
  lunch: { icon: 'lunch_dining', fg: '#15803D', bg: '#DCFCE7', border: '#86EFAC' },
  snack: { icon: 'bakery_dining', fg: '#7C3AED', bg: '#EDE9FE', border: '#C4B5FD' },
  dinner: { icon: 'dinner_dining', fg: '#1D4ED8', bg: '#DBEAFE', border: '#93C5FD' },
  want: { icon: 'favorite', fg: '#BE185D', bg: '#FCE7F3', border: '#F9A8D4' },
  need: { icon: 'verified', fg: '#0369A1', bg: '#E0F2FE', border: '#7DD3FC' },
  udhar_taken: { icon: 'south_west', fg: '#0F766E', bg: '#CCFBF1', border: '#5EEAD4' },
  udhar_given: { icon: 'north_east', fg: '#C2410C', bg: '#FFEDD5', border: '#FDBA74' },
  udhar_repay: { icon: 'undo', fg: '#0F766E', bg: '#CCFBF1', border: '#5EEAD4' },
  udhar_collect: { icon: 'download', fg: '#C2410C', bg: '#FFEDD5', border: '#FDBA74' },
  grocery: { icon: 'local_grocery_store', fg: '#4D7C0F', bg: '#ECFCCB', border: '#BEF264' },
  daily: { icon: 'today', fg: '#57534E', bg: '#F5F5F4', border: '#D6D3D1' },
  food: { icon: 'restaurant', fg: '#EA580C', bg: '#FFEDD5', border: '#FDBA74' },
  medical: { icon: 'medical_services', fg: '#B91C1C', bg: '#FEE2E2', border: '#FCA5A5' },
  petrol: { icon: 'local_gas_station', fg: '#A16207', bg: '#FEF9C3', border: '#FDE047' },
  rent: { icon: 'apartment', fg: '#0F766E', bg: '#CCFBF1', border: '#5EEAD4' },
  chiri_miri: { icon: 'storefront', fg: '#9D174D', bg: '#FCE7F3', border: '#F9A8D4' },
  stationary: { icon: 'edit_note', fg: '#4338CA', bg: '#E0E7FF', border: '#A5B4FC' },
  maintenance: { icon: 'build', fg: '#334155', bg: '#F1F5F9', border: '#CBD5E1' },
  accessories: { icon: 'directions_car', fg: '#7C3AED', bg: '#F3E8FF', border: '#D8B4FE' },
  online: { icon: 'account_balance', fg: '#1D4ED8', bg: '#DBEAFE', border: '#93C5FD' },
  cash: { icon: 'payments', fg: '#166534', bg: '#DCFCE7', border: '#86EFAC' },
  upi: { icon: 'qr_code_2', fg: '#1D4ED8', bg: '#DBEAFE', border: '#93C5FD' },
  card: { icon: 'credit_card', fg: '#6D28D9', bg: '#F3E8FF', border: '#D8B4FE' },
};

export function GIcon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('material-symbols-outlined', className)} aria-hidden>
      {name}
    </span>
  );
}

export function TagChip({
  tag,
  selected,
  onClick,
}: {
  tag: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  const meta = TAG_META[tag] ?? { icon: 'sell', fg: '#6B7280', bg: '#F3F4F6', border: '#E5E7EB' };
  const label = TAG_LABELS[tag] ?? tag.replaceAll('_', ' ');
  const className = cn(
    'inline-flex h-8 shrink-0 items-center gap-1 rounded-full border px-2.5 text-xs capitalize whitespace-nowrap',
    selected && 'ring-2 ring-offset-1 ring-primary',
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={className}
        style={{ color: meta.fg, background: meta.bg, borderColor: meta.border }}
      >
        <GIcon name={meta.icon} className="text-[14px]" />
        {label}
      </button>
    );
  }

  return (
    <span className={className} style={{ color: meta.fg, background: meta.bg, borderColor: meta.border }}>
      <GIcon name={meta.icon} className="text-[14px]" />
      {label}
    </span>
  );
}

export function tagLabel(tag: string) {
  return TAG_LABELS[tag] ?? tag.replaceAll('_', ' ');
}
