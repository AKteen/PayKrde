import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Investment, Profile, TransactionSummary } from '@kharcha/shared';
import { api } from '@/lib/api';
import { useDataRefresh } from '@/lib/data-refresh';
import { BalanceCard } from '@/components/balance-card';
import { GIcon } from '@/lib/tag-meta';
import { formatInr, tzOffsetMinutes } from '@/lib/utils';

export function MoneyPage() {
  const { nonce } = useDataRefresh();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api<Profile>('/api/profile'),
      api<TransactionSummary>(`/api/transactions/summary?tzOffsetMinutes=${tzOffsetMinutes()}`),
      api<Investment[]>('/api/investments'),
    ])
      .then(([p, s, inv]) => {
        if (cancelled) return;
        setProfile(p);
        setSummary(s);
        setInvestments(inv);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load money');
      });
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  if (error) return <p className="text-sm text-danger">{error}</p>;
  if (!profile || !summary) return <p className="text-sm text-muted-foreground">Loading money…</p>;

  const bank = profile.bank_balance ?? summary.balance ?? 0;
  const cash = profile.cash_balance ?? summary.cashBalance ?? 0;
  const invested = investments.reduce((sum, row) => sum + row.current_value, 0);
  const udhar = summary.udhar ?? { borrowed: 0, lent: 0 };
  const netWorth = bank + cash + invested + udhar.lent - udhar.borrowed;
  const pay = summary.paymentMonth ?? { cash: 0, upi: 0, card: 0 };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold md:text-xl">Money</h1>
        <p className="text-xs text-muted-foreground">What you have on hand, invested, and in udhar.</p>
      </div>

      <div className="rounded-2xl bg-cream p-4">
        <p className="text-[11px] text-muted-foreground">Total (bank + cash + investments + net udhar)</p>
        <p className="mt-1 tabular text-2xl font-semibold">{formatInr(netWorth)}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Kpi icon="account_balance" label="Bank / online" value={bank} hint="UPI & card wallet" />
        <Kpi icon="payments" label="Cash in hand" value={cash} hint="Physical notes" />
        <Kpi icon="trending_up" label="Investments" value={invested} hint={`${investments.length} holding${investments.length === 1 ? '' : 's'}`} to="/investments" />
        <Kpi icon="south_west" label="Borrowed" value={udhar.borrowed} hint="To repay" to="/udhar" />
        <Kpi icon="north_east" label="Lent" value={udhar.lent} hint="To collect" to="/udhar" />
      </div>

      <BalanceCard bank={bank} cash={cash} />

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-soft">
        <h2 className="text-sm font-semibold">Spent this month by how you paid</h2>
        <p className="mb-3 text-[11px] text-muted-foreground">
          Cash / UPI / Card tags on a spend tell which pocket it came from. Example: chai ₹40 tagged Cash
          leaves cash in hand; rent ₹8,000 tagged UPI is an online/bank spend.
        </p>
        <div className="grid grid-cols-3 gap-2">
          <PayCell label="Cash" value={pay.cash} />
          <PayCell label="UPI" value={pay.upi} />
          <PayCell label="Card" value={pay.card} />
        </div>
      </section>

      <Link to="/investments" className="block text-sm font-medium text-info">
        Manage investments →
      </Link>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  hint,
  to,
}: {
  icon: string;
  label: string;
  value: number;
  hint?: string;
  to?: string;
}) {
  const body = (
    <>
      <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <GIcon name={icon} className="text-[14px]" />
        {label}
      </p>
      <p className="mt-1 tabular text-base font-semibold">{formatInr(value)}</p>
      {hint ? <p className="text-[10px] text-muted-foreground">{hint}</p> : null}
    </>
  );
  const className = 'rounded-2xl border border-border bg-surface p-3 shadow-soft';
  if (to) {
    return (
      <Link to={to} className={className}>
        {body}
      </Link>
    );
  }
  return <div className={className}>{body}</div>;
}

function PayCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-muted px-2 py-3 text-center">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="mt-1 tabular text-xs font-semibold">{formatInr(value)}</p>
    </div>
  );
}
