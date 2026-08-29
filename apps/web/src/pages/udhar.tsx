import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import type { Transaction, TransactionSummary } from '@kharcha/shared';
import { api } from '@/lib/api';
import { useDataRefresh } from '@/lib/data-refresh';
import { TransactionForm } from '@/components/transaction-form';
import { TransactionList } from '@/components/transaction-list';
import { UdharSettle } from '@/components/udhar-settle';
import { Button } from '@/components/ui/button';
import { GIcon } from '@/lib/tag-meta';
import { formatInr, tzOffsetMinutes } from '@/lib/utils';

export function UdharPage() {
  const { nonce } = useDataRefresh();
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [borrowed, setBorrowed] = useState<Transaction[]>([]);
  const [lent, setLent] = useState<Transaction[]>([]);
  const [settled, setSettled] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    Promise.all([
      api<TransactionSummary>(`/api/transactions/summary?tzOffsetMinutes=${tzOffsetMinutes()}`),
      api<Transaction[]>('/api/transactions?type=udhar_taken'),
      api<Transaction[]>('/api/transactions?type=udhar_given'),
      api<Transaction[]>('/api/transactions?type=udhar_repay'),
      api<Transaction[]>('/api/transactions?type=udhar_collect'),
    ])
      .then(([s, taken, given, repaid, collected]) => {
        if (cancelled) return;
        setSummary(s);
        setBorrowed(taken);
        setLent(given);
        setSettled([...repaid, ...collected]);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load udhar');
      });
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const logs = useMemo(() => {
    return [...borrowed, ...lent, ...settled].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
  }, [borrowed, lent, settled]);

  const udhar = summary?.udhar ?? { borrowed: 0, lent: 0 };
  const net = udhar.lent - udhar.borrowed;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold md:text-xl">Udhar</h1>
          <p className="text-xs text-muted-foreground">Borrowed and lent money only.</p>
        </div>
        <Button
          size="icon"
          aria-label={showForm ? 'Hide add form' : 'Add udhar'}
          onClick={() => setShowForm((v) => !v)}
          className="h-11 w-11 min-h-[44px] min-w-[44px]"
        >
          <Plus className={`h-5 w-5 transition-transform ${showForm ? 'rotate-45' : ''}`} />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl p-5" style={{ background: '#CCFBF1' }}>
          <p className="flex items-center gap-1 text-sm" style={{ color: '#0F766E' }}>
            <GIcon name="south_west" /> Borrowed
          </p>
          <p className="mt-2 tabular text-2xl font-semibold" style={{ color: '#0F766E' }}>
            {formatInr(udhar.borrowed)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Still outstanding (taken − returned)</p>
        </div>
        <div className="rounded-2xl p-5" style={{ background: '#FFEDD5' }}>
          <p className="flex items-center gap-1 text-sm" style={{ color: '#C2410C' }}>
            <GIcon name="north_east" /> Lent
          </p>
          <p className="mt-2 tabular text-2xl font-semibold" style={{ color: '#C2410C' }}>
            {formatInr(udhar.lent)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Still outstanding (given − collected)</p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Net position:{' '}
        <span className="tabular font-medium text-foreground">
          {net >= 0 ? 'Others owe you ' : 'You owe '}
          {formatInr(Math.abs(net))}
        </span>
      </p>

      {showForm ? (
        <TransactionForm defaultType="udhar_taken" onSaved={() => setShowForm(false)} />
      ) : null}

      <UdharSettle borrowed={udhar.borrowed} lent={udhar.lent} />

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Udhar log</h2>
        <TransactionList items={logs} />
      </section>
    </div>
  );
}
