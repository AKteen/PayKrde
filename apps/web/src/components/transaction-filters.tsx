import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Filter, Receipt } from 'lucide-react';
import {
  CATEGORY_TAGS,
  MEAL_TAGS,
  PAYMENT_MODE_LABELS,
  PAYMENT_MODES,
  TAG_LABELS,
  TRANSACTION_TYPES,
  TransactionListQuerySchema,
  TYPE_LABELS,
  zodFieldErrors,
  type AllowedTag,
  type FieldErrors,
} from '@kharcha/shared';
import { DateTimeField } from '@/components/datetime-field';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { GIcon } from '@/lib/tag-meta';
import { cn, formatRangeLabel, sanitizeAmountInput } from '@/lib/utils';

export type FilterValues = {
  from: string;
  to: string;
  type: string;
  tag: string;
  payment: string;
  sort: 'newest' | 'oldest' | 'amount';
  minAmount: string;
  maxAmount: string;
  q: string;
};

const EMPTY: FilterValues = {
  from: '',
  to: '',
  type: '',
  tag: '',
  payment: '',
  sort: 'newest',
  minAmount: '',
  maxAmount: '',
  q: '',
};

type SavedFilter = FilterValues & { id: string; name: string };

const STORAGE_KEY = 'kharcha.savedFilters';

type Section = 'date' | 'type' | 'category' | 'payment' | 'more' | null;

const DATE_PRESETS = [
  { id: '7', label: 'Last 7 days' },
  { id: '30', label: 'Last 30 days' },
  { id: '90', label: 'Last 3 months' },
  { id: '180', label: 'Last 6 months' },
  { id: 'year', label: 'This year' },
  { id: 'custom', label: 'Custom' },
] as const;

function loadSaved(): SavedFilter[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedFilter[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function presetRange(id: string): { from: string; to: string } | null {
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  if (id === '7') from.setDate(from.getDate() - 6);
  else if (id === '30') from.setDate(from.getDate() - 29);
  else if (id === '90') from.setMonth(from.getMonth() - 3);
  else if (id === '180') from.setMonth(from.getMonth() - 6);
  else if (id === 'year') from.setMonth(0, 1);
  else return null;
  return { from: from.toISOString(), to: to.toISOString() };
}

function matchPreset(from: string, to: string) {
  for (const p of DATE_PRESETS) {
    if (p.id === 'custom') continue;
    const range = presetRange(p.id);
    if (!range || !from || !to) continue;
    if (Math.abs(Date.parse(range.from) - Date.parse(from)) < 60_000 && Math.abs(Date.parse(range.to) - Date.parse(to)) < 60_000) {
      return p.id;
    }
  }
  return from || to ? 'custom' : '';
}

export function TransactionFilters({
  value,
  onApply,
  trailing,
}: {
  value: FilterValues;
  onApply: (next: FilterValues) => void;
  trailing?: React.ReactNode;
}) {
  const [draft, setDraft] = useState<FilterValues>(value);
  const [panelOpen, setPanelOpen] = useState(false);
  const [open, setOpen] = useState<Section>(null);
  const [fields, setFields] = useState<FieldErrors>({});
  const [saved, setSaved] = useState<SavedFilter[]>(() => loadSaved());
  const [savedOpen, setSavedOpen] = useState(false);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  function patch(next: Partial<FilterValues>) {
    setDraft((prev) => ({ ...prev, ...next }));
    setFields({});
  }

  const activePreset = matchPreset(draft.from, draft.to);

  function applyDraft(next = draft) {
    const parsed = TransactionListQuerySchema.safeParse({
      ...next,
      minAmount: next.minAmount || undefined,
      maxAmount: next.maxAmount || undefined,
      q: next.q || undefined,
      from: next.from || undefined,
      to: next.to || undefined,
      type: next.type || undefined,
      tag: next.tag || undefined,
      payment: next.payment || undefined,
    });
    if (!parsed.success) {
      setFields(zodFieldErrors(parsed.error).fields);
      return;
    }
    onApply(next);
    setPanelOpen(false);
  }

  function saveCurrent() {
    const name = window.prompt('Name this filter', 'My filter');
    if (!name?.trim()) return;
    const item: SavedFilter = { ...draft, id: crypto.randomUUID(), name: name.trim().slice(0, 40) };
    const next = [item, ...saved].slice(0, 12);
    setSaved(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSavedOpen(false);
  }

  function typeLabel(v: string) {
    if (!v) return 'All';
    return TYPE_LABELS[v as keyof typeof TYPE_LABELS] ?? v;
  }

  const categoryOptions = useMemo(
    () => [...MEAL_TAGS, ...CATEGORY_TAGS],
    [],
  );

  const activeCount = [
    draft.from || draft.to,
    draft.type,
    draft.tag,
    draft.payment,
    draft.sort !== 'newest',
    draft.minAmount || draft.maxAmount,
    draft.q,
  ].filter(Boolean).length;

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cream text-gold">
            <Receipt className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold md:text-xl">Transactions</h1>
            <p className="text-xs text-muted-foreground">Filter, sort, edit, or delete anything you logged.</p>
          </div>
        </div>
        <div className="relative flex shrink-0 items-center gap-2">
          <Button
            variant={panelOpen ? 'default' : 'outline'}
            size="sm"
            aria-expanded={panelOpen}
            onClick={() => {
              setPanelOpen((v) => !v);
              setSavedOpen(false);
            }}
            className="min-h-[44px]"
          >
            <Filter className="mr-1 h-3.5 w-3.5" />
            Filter
            {activeCount > 0 ? (
              <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-[10px] text-white">
                {activeCount}
              </span>
            ) : null}
          </Button>
          {trailing}
        </div>
      </div>

      {panelOpen ? (
        <>
      <div className="flex justify-end">
        <div className="relative">
          <Button variant="outline" size="sm" onClick={() => setSavedOpen((v) => !v)}>
            Saved
            <ChevronDown className="ml-1 h-3.5 w-3.5" />
          </Button>
          {savedOpen ? (
            <div className="absolute right-0 top-11 z-30 w-56 rounded-2xl border border-border bg-surface p-2 shadow-card animate-in">
              <button type="button" className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-muted" onClick={saveCurrent}>
                Save current
              </button>
              {saved.length === 0 ? (
                <p className="px-3 py-2 text-xs text-muted-foreground">No saved filters yet.</p>
              ) : (
                saved.map((item) => (
                  <div key={item.id} className="flex items-center gap-1">
                    <button
                      type="button"
                      className="flex-1 rounded-xl px-3 py-2 text-left text-sm hover:bg-muted"
                      onClick={() => {
                        const { id: _id, name: _name, ...rest } = item;
                        setDraft(rest);
                        onApply(rest);
                        setSavedOpen(false);
                        setPanelOpen(false);
                      }}
                    >
                      {item.name}
                    </button>
                    <button
                      type="button"
                      className="px-2 text-xs text-muted-foreground"
                      onClick={() => {
                        const next = saved.filter((s) => s.id !== item.id);
                        setSaved(next);
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : null}
        </div>
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        <QuickChip
          icon="calendar_month"
          label="Date range"
          value={formatRangeLabel(draft.from, draft.to)}
          onClick={() => setOpen(open === 'date' ? null : 'date')}
        />
        <QuickChip icon="database" label="Type" value={typeLabel(draft.type)} onClick={() => setOpen(open === 'type' ? null : 'type')} />
        <QuickChip
          icon="sell"
          label="Category"
          value={draft.tag ? TAG_LABELS[draft.tag as AllowedTag] ?? draft.tag : 'All'}
          onClick={() => setOpen(open === 'category' ? null : 'category')}
        />
        <QuickChip
          icon="credit_card"
          label="Payment Mode"
          value={draft.payment ? PAYMENT_MODE_LABELS[draft.payment as keyof typeof PAYMENT_MODE_LABELS] : 'All'}
          onClick={() => setOpen(open === 'payment' ? null : 'payment')}
        />
        <QuickChip
          icon="swap_vert"
          label="Sort"
          value={draft.sort === 'oldest' ? 'Oldest' : draft.sort === 'amount' ? 'Amount' : 'Newest'}
          onClick={() => setOpen(open === 'more' ? null : 'more')}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-soft">
        <AccordionRow
          icon="calendar_month"
          title="Date range"
          subtitle="Last 7 days, this month, custom, etc."
          open={open === 'date'}
          onToggle={() => setOpen(open === 'date' ? null : 'date')}
        >
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {DATE_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  if (p.id === 'custom') {
                    patch({ from: draft.from, to: draft.to });
                    return;
                  }
                  const range = presetRange(p.id);
                  if (range) patch(range);
                }}
                className={cn(
                  'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium',
                  activePreset === p.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DateTimeField
              dateOnly
              label="From"
              value={draft.from}
              onChange={(iso) => patch({ from: iso })}
              error={fields.from}
            />
            <DateTimeField
              dateOnly
              label="To"
              value={draft.to}
              onChange={(iso) => {
                const d = new Date(iso);
                d.setHours(23, 59, 59, 999);
                patch({ to: d.toISOString() });
              }}
              error={fields.to}
            />
          </div>
        </AccordionRow>

        <AccordionRow
          icon="database"
          title="Type"
          subtitle="Spend, Borrow, Lent, Emergency"
          open={open === 'type'}
          onToggle={() => setOpen(open === 'type' ? null : 'type')}
        >
          <ChoiceRow
            value={draft.type}
            onChange={(v) => patch({ type: v })}
            options={[{ value: '', label: 'All' }, ...TRANSACTION_TYPES.map((t) => ({ value: t, label: TYPE_LABELS[t] }))]}
          />
        </AccordionRow>

        <AccordionRow
          icon="sell"
          title="Category"
          subtitle="Food, grocery, meals, etc."
          open={open === 'category'}
          onToggle={() => setOpen(open === 'category' ? null : 'category')}
        >
          <ChoiceRow
            value={draft.tag}
            onChange={(v) => patch({ tag: v })}
            options={[
              { value: '', label: 'All' },
              ...categoryOptions.map((t) => ({ value: t, label: TAG_LABELS[t] ?? t })),
            ]}
          />
          <FieldError message={fields.tag} />
        </AccordionRow>

        <AccordionRow
          icon="credit_card"
          title="Payment mode"
          subtitle="Cash, UPI, Card"
          open={open === 'payment'}
          onToggle={() => setOpen(open === 'payment' ? null : 'payment')}
        >
          <ChoiceRow
            value={draft.payment}
            onChange={(v) => patch({ payment: v })}
            options={[
              { value: '', label: 'All' },
              ...PAYMENT_MODES.map((m) => ({ value: m, label: PAYMENT_MODE_LABELS[m] })),
            ]}
          />
        </AccordionRow>

        <AccordionRow
          icon="tune"
          title="More filters"
          subtitle="Amount range, description, sort"
          open={open === 'more'}
          onToggle={() => setOpen(open === 'more' ? null : 'more')}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-[11px] text-muted-foreground">Min amount</p>
              <Input
                inputMode="decimal"
                value={draft.minAmount}
                onChange={(e) => patch({ minAmount: sanitizeAmountInput(e.target.value) })}
                aria-invalid={Boolean(fields.minAmount)}
              />
              <FieldError message={fields.minAmount} />
            </div>
            <div>
              <p className="mb-1 text-[11px] text-muted-foreground">Max amount</p>
              <Input
                inputMode="decimal"
                value={draft.maxAmount}
                onChange={(e) => patch({ maxAmount: sanitizeAmountInput(e.target.value) })}
                aria-invalid={Boolean(fields.maxAmount)}
              />
              <FieldError message={fields.maxAmount} />
            </div>
          </div>
          <div className="mt-3">
            <p className="mb-1 text-[11px] text-muted-foreground">Description</p>
            <Input
              value={draft.q}
              maxLength={120}
              placeholder="Search notes"
              onChange={(e) => patch({ q: e.target.value })}
            />
          </div>
          <div className="mt-3">
            <p className="mb-1 text-[11px] text-muted-foreground">Sort</p>
            <ChoiceRow
              value={draft.sort}
              onChange={(v) => patch({ sort: v as FilterValues['sort'] })}
              options={[
                { value: 'newest', label: 'Newest' },
                { value: 'oldest', label: 'Oldest' },
                { value: 'amount', label: 'Amount' },
              ]}
            />
          </div>
        </AccordionRow>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
          <button
            type="button"
            className="text-sm text-muted-foreground hover:text-foreground"
            onClick={() => {
              setDraft(EMPTY);
              onApply(EMPTY);
              setFields({});
              setPanelOpen(false);
            }}
          >
            Clear all filters
          </button>
          <Button onClick={() => applyDraft()} className="min-h-[44px]">
            <Filter className="mr-1 h-4 w-4" /> Apply Filters
          </Button>
        </div>
      </div>
        </>
      ) : null}
    </div>
  );
}

function QuickChip({
  icon,
  label,
  value,
  onClick,
}: {
  icon: string;
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-w-[9.5rem] shrink-0 items-center justify-between gap-2 rounded-2xl border border-border bg-surface px-3 py-2 text-left shadow-soft"
    >
      <span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <GIcon name={icon} className="text-[12px]" />
          {label}
        </span>
        <span className="mt-0.5 block truncate text-xs font-medium">{value}</span>
      </span>
      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
    </button>
  );
}

function AccordionRow({
  icon,
  title,
  subtitle,
  open,
  onToggle,
  children,
}: {
  icon: string;
  title: string;
  subtitle: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border last:border-0">
      <button type="button" onClick={onToggle} className="flex w-full items-center gap-3 px-4 py-3 text-left">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
          <GIcon name={icon} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{title}</span>
          <span className="block text-xs text-muted-foreground">{subtitle}</span>
        </span>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform duration-300', open && 'rotate-180')} />
      </button>
      <div className={cn('grid transition-[grid-template-rows] duration-300 ease-out', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
        <div className="overflow-hidden">
          <div className="px-4 pb-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

function ChoiceRow({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value || 'all'}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded-full px-3 py-1.5 text-xs font-medium',
            value === opt.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export const EMPTY_FILTERS = EMPTY;
