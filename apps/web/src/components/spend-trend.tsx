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
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: '#2A2414' }}
              formatter={(value: number) => formatInr(value)}
              contentStyle={{
                background: '#171A21',
                color: '#F4F4F5',
                border: '1px solid #2A2F3A',
                borderRadius: 12,
                fontSize: 12,
              }}
            />
            <Bar dataKey="total" fill="#F5C518" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
