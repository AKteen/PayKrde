import { useEffect, useMemo, useState } from 'react';
import { CORE_MEALS, MEAL_TAGS, TAG_LABELS, type TransactionSummary } from '@kharcha/shared';
import { api } from '@/lib/api';
import { useDataRefresh } from '@/lib/data-refresh';
import { tzOffsetMinutes } from '@/lib/utils';
import { MealKpi } from '@/components/meal-kpi';
import { GIcon, TAG_META } from '@/lib/tag-meta';
import { formatInr } from '@/lib/utils';

const FEATURED = ['petrol', 'food', 'rent', 'grocery', 'daily', 'medical', 'chiri_miri', 'stationary'] as const;

export function AnalyticsPage() {
  const { nonce } = useDataRefresh();
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'month' | 'year'>('month');

  useEffect(() => {
    let cancelled = false;
    api<TransactionSummary>(`/api/transactions/summary?tzOffsetMinutes=${tzOffsetMinutes()}`)
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load analytics');
      });
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const categories = useMemo(() => {
    if (!summary) return [];
    const rows = period === 'month' ? summary.byCategoryMonth : summary.byCategoryYear;
    const map = new Map(rows?.map((r) => [r.tag, r.total]) ?? []);
    const featured = FEATURED.map((tag) => ({ tag, total: map.get(tag) ?? 0 }));
    const rest = (rows ?? []).filter((r) => !FEATURED.includes(r.tag as (typeof FEATURED)[number]) && !MEAL_TAGS.includes(r.tag as (typeof MEAL_TAGS)[number]));
    return [...featured, ...rest];
  }, [summary, period]);

  if (error) return <p className="text-sm text-danger">{error}</p>;
  if (!summary) return <p className="text-sm text-muted-foreground">Loading analytics…</p>;

  const spent = summary.spent ?? { today: summary.today, week: summary.week, month: summary.month };
  const additions = summary.additions ?? { today: 0, week: 0, month: 0 };
  const udhar = summary.udhar ?? { borrowed: 0, lent: 0 };
  const yearSpend = summary.calendar?.reduce((s, d) => s + d.total, 0) ?? spent.month;
  const headlineSpend = period === 'month' ? spent.month : yearSpend;
  const catRows = period === 'month' ? summary.byCategoryMonth : summary.byCategoryYear;
  const foodTotal =
    period === 'month'
      ? (summary.food?.month ?? 0)
      : CORE_MEALS.reduce((s, tag) => s + (catRows?.find((r) => r.tag === tag)?.total ?? 0), 0);
  const petrolTotal = categories.find((c) => c.tag === 'petrol')?.total ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold md:text-xl">Analytics</h1>
          <p className="text-xs text-muted-foreground">Spend, categories, and averages from the server.</p>
        </div>
        <div className="flex rounded-full bg-muted p-1">
          {(['month', 'year'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium ${
                period === p ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              {p === 'month' ? 'This month' : 'This year'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <HeroKpi icon="payments" label={`Spent ${period === 'month' ? 'this month' : 'this year'}`} value={headlineSpend} />
        <HeroKpi
          icon="avg_pace"
          label="Daily avg"
          value={summary.dailyAvg ?? 0}
          hint={`${summary.daysElapsed ?? 1} days so far`}
        />
        <HeroKpi icon="account_balance_wallet" label="Account balance" value={summary.balance} />
        <HeroKpi icon="add_card" label="Added this month" value={additions.month} />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <HeroKpi icon="local_gas_station" label="Petrol" value={petrolTotal} hint={period === 'month' ? 'This month' : 'This year'} />
        <HeroKpi icon="restaurant" label="Food" value={foodTotal} hint="Breakfast, lunch, dinner" />
        <HeroKpi icon="apartment" label="Rent" value={categories.find((c) => c.tag === 'rent')?.total ?? 0} hint={period === 'month' ? 'This month' : 'This year'} />
        <HeroKpi icon="south_west" label="Borrowed" value={udhar.borrowed} hint="All time" />
        <HeroKpi icon="north_east" label="Lent" value={udhar.lent} hint="All time" />
      </div>

      <MealKpi today={spent.today} meals={summary.meals} />

      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">By category</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((row) => {
            const meta = TAG_META[row.tag] ?? { icon: 'sell', fg: '#6B7280', bg: '#F3F4F6', border: '#E5E7EB' };
            return (
              <div
                key={row.tag}
                className="rounded-2xl border p-3"
                style={{ background: meta.bg, borderColor: meta.border }}
              >
                <div className="flex items-center gap-1" style={{ color: meta.fg }}>
                  <GIcon name={meta.icon} />
                  <span className="text-xs font-medium">{TAG_LABELS[row.tag] ?? row.tag.replaceAll('_', ' ')}</span>
                </div>
                <p className="mt-2 tabular text-sm font-semibold" style={{ color: meta.fg }}>
                  {formatInr(row.total)}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function HeroKpi({
  icon,
  label,
  value,
  hint,
}: {
  icon: string;
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-soft">
      <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <GIcon name={icon} className="text-[14px]" />
        {label}
      </p>
      <p className="mt-2 tabular text-2xl font-semibold">{formatInr(value)}</p>
      {hint ? <p className="mt-1 text-[10px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
