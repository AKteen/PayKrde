import { useEffect, useMemo, useState } from 'react';
import { CORE_MEALS, MEAL_TAGS, TAG_LABELS, type MealTag, type TransactionSummary } from '@kharcha/shared';
import { api } from '@/lib/api';
import { useDataRefresh } from '@/lib/data-refresh';
import { MealKpi } from '@/components/meal-kpi';
import { GIcon, TAG_META } from '@/lib/tag-meta';
import { formatInr, tzOffsetMinutes } from '@/lib/utils';

export function DietPage() {
  const { nonce } = useDataRefresh();
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<TransactionSummary>(`/api/transactions/summary?tzOffsetMinutes=${tzOffsetMinutes()}`)
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load diet');
      });
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const logged = useMemo(() => new Set<MealTag>(summary?.mealsLoggedToday ?? []), [summary]);
  const byDay = useMemo(() => {
    const map = new Map((summary?.mealsCalendar ?? []).map((row) => [row.date, row.meals]));
    const days = summary?.daysElapsed ?? 1;
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const rows: { date: string; meals: MealTag[]; day: number }[] = [];
    for (let d = 1; d <= days; d += 1) {
      const date = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      rows.push({ date, day: d, meals: map.get(date) ?? [] });
    }
    return rows;
  }, [summary]);

  if (error) return <p className="text-sm text-danger">{error}</p>;
  if (!summary) return <p className="text-sm text-muted-foreground">Loading diet…</p>;

  const food = summary.food ?? { today: 0, week: 0, month: 0, dailyAvg: 0 };
  const missedToday = CORE_MEALS.filter((meal) => !logged.has(meal));
  const eatenDays = byDay.filter((row) => CORE_MEALS.some((meal) => row.meals.includes(meal))).length;
  const skippedCore = byDay.reduce(
    (sum, row) => sum + CORE_MEALS.filter((meal) => !row.meals.includes(meal)).length,
    0,
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold md:text-xl">Diet</h1>
        <p className="text-xs text-muted-foreground">Meals you logged, misses, and food spend.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Food today" value={formatInr(food.today)} />
        <Stat label="Food this month" value={formatInr(food.month)} />
        <Stat label="Daily food avg" value={formatInr(food.dailyAvg)} hint={`${summary.daysElapsed} days`} />
        <Stat label="Days with a meal" value={String(eatenDays)} hint={`${skippedCore} core meals missed this month`} />
      </div>

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-soft">
        <h2 className="text-sm font-semibold">Today</h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {CORE_MEALS.map((meal) => {
            const meta = TAG_META[meal];
            const ok = logged.has(meal);
            return (
              <div
                key={meal}
                className="rounded-2xl border px-2 py-3 text-center"
                style={{ background: ok ? meta.bg : '#F3F1EC', borderColor: ok ? meta.border : '#EDEAE3' }}
              >
                <GIcon name={meta.icon} className="text-[18px]" />
                <p className="mt-1 text-xs font-medium">{TAG_LABELS[meal]}</p>
                <p className="text-[10px] text-muted-foreground">{ok ? 'Logged' : 'Not logged'}</p>
              </div>
            );
          })}
        </div>
        {missedToday.length ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Missing {missedToday.map((m) => TAG_LABELS[m].toLowerCase()).join(', ')} so far.
          </p>
        ) : (
          <p className="mt-3 text-xs text-success">Breakfast, lunch, and dinner are logged today.</p>
        )}
      </section>

      <MealKpi today={food.today} meals={summary.meals} />

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">This month · core meals</h2>
        <div className="grid grid-cols-7 gap-1.5">
          {byDay.map((row) => (
            <div key={row.date} className="rounded-lg bg-surface p-1 text-center shadow-soft">
              <p className="text-[9px] text-muted-foreground">{row.day}</p>
              <div className="mt-0.5 flex justify-center gap-0.5">
                {CORE_MEALS.map((meal) => (
                  <span
                    key={meal}
                    className={`h-1.5 w-1.5 rounded-full ${row.meals.includes(meal) ? 'bg-success' : 'bg-muted'}`}
                    title={`${TAG_LABELS[meal]} ${row.meals.includes(meal) ? 'logged' : 'missed'}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">Green dots: breakfast · lunch · dinner logged that day.</p>
      </section>

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {MEAL_TAGS.map((meal) => (
          <div key={meal} className="min-w-[7.5rem] shrink-0 rounded-2xl border border-border bg-surface p-3">
            <p className="text-[11px] text-muted-foreground">{TAG_LABELS[meal]}</p>
            <p className="tabular text-sm font-semibold">{formatInr(summary.meals[meal] ?? 0)}</p>
            <p className="text-[10px] text-muted-foreground">Today</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-3 shadow-soft">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 tabular text-base font-semibold">{value}</p>
      {hint ? <p className="text-[10px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
