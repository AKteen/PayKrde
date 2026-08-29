import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import type { Transaction, TransactionSummary } from '@kharcha/shared';
import { api } from '@/lib/api';
import { useDataRefresh } from '@/lib/data-refresh';
import { KpiStrip } from '@/components/kpi-strip';
import { TransactionForm } from '@/components/transaction-form';
import { TransactionFilters, type FilterValues } from '@/components/transaction-filters';
import { TransactionList } from '@/components/transaction-list';
import { Button } from '@/components/ui/button';
import { tzOffsetMinutes } from '@/lib/utils';

function filtersFromParams(params: URLSearchParams): FilterValues {
  return {
    from: params.get('from') ?? '',
    to: params.get('to') ?? '',
    type: params.get('type') ?? '',
    tag: params.get('tag') ?? '',
    payment: params.get('payment') ?? '',
    sort: (params.get('sort') as FilterValues['sort']) || 'newest',
    minAmount: params.get('minAmount') ?? '',
    maxAmount: params.get('maxAmount') ?? '',
    q: params.get('q') ?? '',
  };
}

function paramsFromFilters(next: FilterValues) {
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) {
    if (!v) continue;
    if (k === 'sort' && v === 'newest') continue;
    query.set(k, v);
  }
  return query;
}

export function TransactionsPage() {
  const { nonce } = useDataRefresh();
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState<Transaction[] | null>(null);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const filters = filtersFromParams(params);

  useEffect(() => {
    const query = paramsFromFilters(filters);
    let cancelled = false;
    setError(null);
    Promise.all([
      api<Transaction[]>(`/api/transactions?${query.toString()}`),
      api<TransactionSummary>(`/api/transactions/summary?tzOffsetMinutes=${tzOffsetMinutes()}`),
    ])
      .then(([data, s]) => {
        if (!cancelled) {
          setItems(data);
          setSummary(s);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
      });
    return () => {
      cancelled = true;
    };
  }, [params, nonce]);

  return (
    <div className="space-y-4">
      <TransactionFilters
        value={filters}
        trailing={
          <Button
            size="icon"
            aria-label={showForm ? 'Hide add form' : 'Add transaction'}
            onClick={() => setShowForm((v) => !v)}
            className="h-11 w-11 min-h-[44px] min-w-[44px]"
          >
            <Plus className={`h-5 w-5 transition-transform ${showForm ? 'rotate-45' : ''}`} />
          </Button>
        }
        onApply={(next) => {
          const query = paramsFromFilters(next);
          const empty = [...query.keys()].length === 0;
          setParams(empty ? {} : query);
        }}
      />

      {summary ? <KpiStrip summary={summary} /> : null}

      {showForm ? <TransactionForm onSaved={() => setShowForm(false)} /> : null}

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {items ? <TransactionList items={items} /> : <p className="text-sm text-muted-foreground">Loading…</p>}
    </div>
  );
}
