import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Investment, TransactionSummary } from '@kharcha/shared';
import { api } from '@/lib/api';
import { useDataRefresh } from '@/lib/data-refresh';
import { tzOffsetMinutes } from '@/lib/utils';
import { BalanceCard } from '@/components/balance-card';
import { DailySpendCard } from '@/components/daily-spend-card';
import { InvestmentsTable } from '@/components/investments-table';
import { SpendCalendar } from '@/components/spend-calendar';
import { SpendTrend } from '@/components/spend-trend';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function DashboardPage() {
  const { nonce } = useDataRefresh();
  const year = new Date().getFullYear();
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [balance, setBalance] = useState(0);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    Promise.all([
      api<TransactionSummary>(`/api/transactions/summary?tzOffsetMinutes=${tzOffsetMinutes()}`),
      api<{ bank_balance: number }>('/api/balance'),
      api<Investment[]>('/api/investments'),
    ])
      .then(([s, b, inv]) => {
        if (cancelled) return;
        setSummary(s);
        setBalance(b.bank_balance);
        setInvestments(inv);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      });
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  if (error) {
    return <p className="text-sm text-danger">{error}</p>;
  }

  if (!summary) {
    return <p className="text-sm text-muted-foreground">Loading dashboard…</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="space-y-4">
        <DailySpendCard today={summary.today} week={summary.week} month={summary.month} />
        <BalanceCard balance={balance} />
        <SpendTrend calendar={summary.calendar} />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Investments</CardTitle>
            <Link to="/investments" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <InvestmentsTable items={investments} compact />
          </CardContent>
        </Card>
      </div>
      <SpendCalendar calendar={summary.calendar} year={year} />
    </div>
  );
}
