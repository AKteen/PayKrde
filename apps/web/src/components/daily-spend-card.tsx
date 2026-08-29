import { BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatInr } from '@/lib/utils';

export function DailySpendCard({
  today,
  week,
  month,
}: {
  today: number;
  week: number;
  month: number;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Today’s spend</CardTitle>
        <BarChart3 className="h-4 w-4 text-gold" />
      </CardHeader>
      <CardContent>
        <p className="tabular text-[32px] font-medium leading-none tracking-tight text-foreground">
          {formatInr(today)}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">This week</p>
            <p className="tabular font-medium">{formatInr(week)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">This month</p>
            <p className="tabular font-medium">{formatInr(month)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
