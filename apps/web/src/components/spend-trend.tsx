import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import type { DayTotal } from '@kharcha/shared';
import { formatInr } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function lastNDays(calendar: DayTotal[], n: number) {
  const map = new Map(calendar.map((d) => [d.date, d.total]));
  const out: { label: string; total: number }[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    out.push({
      label: d.toLocaleDateString(undefined, { weekday: 'short' }),
      total: map.get(key) ?? 0,
    });
  }
  return out;
}

export function SpendTrend({ calendar }: { calendar: DayTotal[] }) {
  const data = lastNDays(calendar, 7);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Last 7 days</CardTitle>
      </CardHeader>
      <CardContent className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: '#F3F4F6' }}
              formatter={(value: number) => formatInr(value)}
              contentStyle={{ border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 12 }}
            />
            <Bar dataKey="total" fill="#3B6FE0" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
