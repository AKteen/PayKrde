import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import type { Profile, Transaction, TransactionSummary, Vehicle, VehicleExpense } from '@kharcha/shared';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useDataRefresh } from '@/lib/data-refresh';
import { firstName, formatClock, formatInr, greeting, tzOffsetMinutes } from '@/lib/utils';
import { BalanceCard } from '@/components/balance-card';
import { MealKpi } from '@/components/meal-kpi';
import { SpendCalendar } from '@/components/spend-calendar';
import { SpendTrend } from '@/components/spend-trend';
import { StatCard } from '@/components/stat-card';
import { TransactionForm } from '@/components/transaction-form';
import { TransactionList } from '@/components/transaction-list';
import { VehicleKpi } from '@/components/vehicle-kpi';

export function DashboardPage() {
  const { nonce } = useDataRefresh();
  const { user } = useAuth();
  const year = new Date().getFullYear();
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [lastPetrol, setLastPetrol] = useState<VehicleExpense | null>(null);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    Promise.all([
      api<TransactionSummary>(`/api/transactions/summary?tzOffsetMinutes=${tzOffsetMinutes()}`),
      api<Vehicle[]>('/api/vehicles'),
      api<Transaction[]>('/api/transactions?sort=newest'),
      api<Profile>('/api/profile'),
      api<{ lastPetrol: VehicleExpense | null }>(
        `/api/vehicles/summary?tzOffsetMinutes=${tzOffsetMinutes()}`,
      ).catch(() => ({ lastPetrol: null })),
    ])
      .then(([s, v, txs, p, vs]) => {
        if (cancelled) return;
        setSummary(s);
        setVehicles(v);
        setRecent(txs.slice(0, 5));
        setProfile(p);
        setLastPetrol(vs.lastPetrol);
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

  const name = firstName(profile?.full_name, user?.email);
  const clock = formatClock(now);
  const spent = summary.spent ?? { today: summary.today, week: summary.week, month: summary.month };
  const additions = summary.additions ?? { today: 0, week: 0, month: 0 };
  const balance = summary.balance ?? 0;

  return (
    <div className="space-y-4 md:space-y-5">
      <section className="relative overflow-hidden rounded-2xl bg-cream px-4 py-4 md:px-6 md:py-6 md:min-h-[150px]">
        <div className="relative z-10 max-w-xl">
          <h1 className="text-lg font-semibold tracking-tight md:text-2xl">
            {greeting()}, {name}! 👋
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground md:mt-1 md:text-sm">
            Let&apos;s keep your finances in check.
          </p>
          <p className="mt-2 text-[11px] font-medium tabular md:mt-3 md:text-sm">
            {clock.day} · {clock.date} · {clock.time}
          </p>
          <p className="mt-2 tabular text-3xl font-semibold md:hidden">{formatInr(balance)}</p>
          <p className="text-xs text-muted-foreground md:hidden">Bank balance</p>
        </div>
        <img
          src="/banner.png"
          alt=""
          className="pointer-events-none absolute right-0 top-1/2 hidden h-[130%] w-auto max-w-[55%] -translate-y-1/2 object-contain object-right md:block"
        />
      </section>

      <MealKpi today={spent.today} meals={summary.meals} />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="hidden md:block">
          <StatCard label="Total Balance" value={balance} hint="All accounts" icon={Wallet} tone="gold" />
        </div>
        <VehicleKpi vehicles={vehicles} lastPetrol={lastPetrol} />
      </div>

      <div className="grid grid-cols-2 gap-3 md:hidden">
        <div className="rounded-2xl border border-border bg-surface p-3">
          <p className="text-[11px] text-muted-foreground">Spent this month</p>
          <p className="tabular text-sm font-semibold">{formatInr(spent.month)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-3">
          <p className="text-[11px] text-muted-foreground">Added this month</p>
          <p className="tabular text-sm font-semibold">{formatInr(additions.month)}</p>
        </div>
      </div>

      <TransactionForm />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BalanceCard bank={balance} cash={profile?.cash_balance ?? summary.cashBalance ?? 0} />
        <SpendCalendar calendar={summary.calendar} year={year} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SpendTrend calendar={summary.calendar} />
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">Recent transactions</h2>
            <Link to="/transactions" className="text-xs font-medium text-info hover:underline">
              View all →
            </Link>
          </div>
          <TransactionList items={recent} />
        </section>
      </div>
    </div>
  );
}
