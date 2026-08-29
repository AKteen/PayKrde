import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DayTotal } from '@kharcha/shared';
import { cn, formatInr, localDayIsoRange } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function dateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildWeeks(year: number) {
  const first = new Date(year, 0, 1);
  const last = new Date(year, 11, 31);
  const cursor = new Date(first);
  cursor.setDate(cursor.getDate() - cursor.getDay());
  const weeks: Date[][] = [];
  while (cursor <= last || cursor.getDay() !== 0) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i += 1) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
    if (cursor.getFullYear() > year && cursor.getDay() === 0) break;
  }
  return weeks;
}

function cellColor(value: number, max: number) {
  if (value <= 0) return 'bg-[#F3F1EC]';
  const t = max <= 0 ? 0 : Math.min(1, value / max);
  if (t < 0.25) return 'bg-[#FFF1B8]';
  if (t < 0.5) return 'bg-[#F8D56B]';
  if (t < 0.75) return 'bg-[#F5C518]';
  return 'bg-[#E0A800]';
}

export function SpendCalendar({ calendar, year }: { calendar: DayTotal[]; year: number }) {
  const navigate = useNavigate();
  const byDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of calendar) map.set(row.date, row.total);
    return map;
  }, [calendar]);

  const weeks = useMemo(() => buildWeeks(year), [year]);
  const max = useMemo(() => Math.max(0, ...calendar.map((d) => d.total)), [calendar]);

  const monthLabels = useMemo(() => {
    const labels: { index: number; name: string }[] = [];
    weeks.forEach((week, i) => {
      const inYear = week.find((d) => d.getFullYear() === year);
      if (!inYear) return;
      const name = MONTHS[inYear.getMonth()];
      if (labels[labels.length - 1]?.name !== name) {
        labels.push({ index: i, name });
      }
    });
    return labels;
  }, [weeks, year]);

  function onDayClick(d: Date) {
    if (d.getFullYear() !== year) return;
    const key = dateKey(d);
    const { from, to } = localDayIsoRange(key);
    navigate(`/transactions?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Spend calendar · {year}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="min-w-[680px]">
          <div className="relative mb-1 h-4 text-[10px] text-muted-foreground">
            {monthLabels.map((m) => (
              <span
                key={`${m.name}-${m.index}`}
                className="absolute"
                style={{ left: `${m.index * 14}px` }}
              >
                {m.name}
              </span>
            ))}
          </div>
          <div className="flex gap-1">
            <div className="flex flex-col gap-[3px] pr-1 text-[10px] text-muted-foreground">
              {DAYS.map((d, i) => (
                <span key={d} className="h-[11px] leading-[11px]">
                  {i % 2 === 1 ? d.slice(0, 3) : ''}
                </span>
              ))}
            </div>
            <div className="flex gap-[3px]">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((d) => {
                    const inYear = d.getFullYear() === year;
                    const key = dateKey(d);
                    const value = byDate.get(key) ?? 0;
                    return (
                      <button
                        key={key + wi}
                        type="button"
                        disabled={!inYear}
                        title={inYear ? `${key} · ${formatInr(value)}` : undefined}
                        onClick={() => onDayClick(d)}
                        className={cn(
                          'h-[11px] w-[11px] rounded-[2px] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary',
                          inYear ? cellColor(value, max) : 'bg-transparent',
                        )}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[10px] text-muted-foreground">
            <span>Less</span>
            <span className="h-[11px] w-[11px] rounded-[2px] bg-[#F3F1EC]" />
            <span className="h-[11px] w-[11px] rounded-[2px] bg-[#FFF1B8]" />
            <span className="h-[11px] w-[11px] rounded-[2px] bg-[#F8D56B]" />
            <span className="h-[11px] w-[11px] rounded-[2px] bg-[#F5C518]" />
            <span className="h-[11px] w-[11px] rounded-[2px] bg-[#E0A800]" />
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
