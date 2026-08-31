import { MEAL_TAGS, TAG_LABELS, type MealTotals } from '@kharcha/shared';
import { Card } from '@/components/ui/card';
import { GIcon, TAG_META } from '@/lib/tag-meta';
import { formatInr } from '@/lib/utils';

const WINDOWS = {
  breakfast: '7am–12pm',
  lunch: '12–4pm',
  snack: '4–7pm',
  dinner: '7–11pm',
} as const;

export function MealKpi({ today, meals }: { today: number; meals: MealTotals }) {
  const max = Math.max(today, 1);

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Spent today</p>
          <p className="tabular text-2xl font-medium leading-none tracking-tight md:text-[32px]">{formatInr(today)}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Resets at midnight</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {MEAL_TAGS.map((meal) => {
          const meta = TAG_META[meal];
          const amount = meals[meal] ?? 0;
          return (
            <div
              key={meal}
              className="rounded-2xl border px-3 py-3"
              style={{ background: meta.bg, borderColor: meta.border }}
            >
              <div className="flex items-center gap-1" style={{ color: meta.fg }}>
                <GIcon name={meta.icon} className="text-[16px]" />
                <span className="text-xs font-medium">{TAG_LABELS[meal]}</span>
              </div>
              <p className="mt-2 tabular text-sm font-semibold" style={{ color: meta.fg }}>
                {formatInr(amount)}
              </p>
              <p className="text-[10px] text-muted-foreground">{WINDOWS[meal]}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/35">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.min(100, (amount / max) * 100)}%`, background: meta.fg }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
