import { TAG_LABELS } from '@kharcha/shared';
import { cn } from '@/lib/utils';

export const TAG_META: Record<
  string,
  { icon: string; fg: string; bg: string; border: string }
> = {
  breakfast: { icon: 'free_breakfast', fg: '#FCD34D', bg: '#3F2E12', border: '#854D0E' },
  lunch: { icon: 'lunch_dining', fg: '#86EFAC', bg: '#14532D', border: '#166534' },
  snack: { icon: 'bakery_dining', fg: '#C4B5FD', bg: '#2E1065', border: '#6D28D9' },
  dinner: { icon: 'dinner_dining', fg: '#93C5FD', bg: '#1E3A5F', border: '#1D4ED8' },
  want: { icon: 'favorite', fg: '#F9A8D4', bg: '#4A1530', border: '#9D174D' },
  need: { icon: 'verified', fg: '#7DD3FC', bg: '#0C4A6E', border: '#0369A1' },
  udhar_taken: { icon: 'south_west', fg: '#5EEAD4', bg: '#134E4A', border: '#0F766E' },
  udhar_given: { icon: 'north_east', fg: '#FDBA74', bg: '#431407', border: '#C2410C' },
  udhar_repay: { icon: 'undo', fg: '#5EEAD4', bg: '#134E4A', border: '#0F766E' },
  udhar_collect: { icon: 'download', fg: '#FDBA74', bg: '#431407', border: '#C2410C' },
  grocery: { icon: 'local_grocery_store', fg: '#BEF264', bg: '#1A2E05', border: '#4D7C0F' },
  daily: { icon: 'today', fg: '#D6D3D1', bg: '#292524', border: '#57534E' },
  food: { icon: 'restaurant', fg: '#FDBA74', bg: '#431407', border: '#EA580C' },
  medical: { icon: 'medical_services', fg: '#FCA5A5', bg: '#450A0A', border: '#B91C1C' },
  petrol: { icon: 'local_gas_station', fg: '#FDE047', bg: '#3F2E12', border: '#A16207' },
  rent: { icon: 'apartment', fg: '#5EEAD4', bg: '#134E4A', border: '#0F766E' },
  chiri_miri: { icon: 'storefront', fg: '#F9A8D4', bg: '#4A1530', border: '#9D174D' },
  stationary: { icon: 'edit_note', fg: '#A5B4FC', bg: '#1E1B4B', border: '#4338CA' },
  maintenance: { icon: 'build', fg: '#CBD5E1', bg: '#1E293B', border: '#475569' },
  accessories: { icon: 'directions_car', fg: '#D8B4FE', bg: '#2E1065', border: '#7C3AED' },
  online: { icon: 'account_balance', fg: '#93C5FD', bg: '#1E3A5F', border: '#1D4ED8' },
  cash: { icon: 'payments', fg: '#86EFAC', bg: '#14532D', border: '#166534' },
  upi: { icon: 'qr_code_2', fg: '#93C5FD', bg: '#1E3A5F', border: '#1D4ED8' },
  card: { icon: 'credit_card', fg: '#D8B4FE', bg: '#2E1065', border: '#6D28D9' },
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
  const meta = TAG_META[tag] ?? { icon: 'sell', fg: '#A1A1AA', bg: '#27272A', border: '#3F3F46' };
  const label = TAG_LABELS[tag] ?? tag.replaceAll('_', ' ');
  const className = cn(
    'inline-flex h-8 shrink-0 items-center gap-1 rounded-full border px-2.5 text-xs capitalize whitespace-nowrap',
    selected && 'ring-2 ring-offset-1 ring-offset-background ring-primary',
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
