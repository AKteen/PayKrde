import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CATEGORY_TAGS,
  MAJOR_TAGS,
  TAG_LABELS,
  TRANSACTION_TYPES,
  TYPE_LABELS,
  type AllowedTag,
  type Transaction,
  type TransactionType,
} from '@kharcha/shared';
import { api } from '@/lib/api';
import { useDataRefresh } from '@/lib/data-refresh';
import { TransactionList } from '@/components/transaction-list';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function TransactionsPage() {
  const { nonce } = useDataRefresh();
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState<Transaction[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<'newest' | 'oldest' | 'amount'>('newest');

  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  const type = params.get('type') ?? '';
  const tag = params.get('tag') ?? '';

  useEffect(() => {
    const query = new URLSearchParams();
    if (from) query.set('from', from);
    if (to) query.set('to', to);
    if (type) query.set('type', type);
    if (tag) query.set('tag', tag);

    let cancelled = false;
    setError(null);
    api<Transaction[]>(`/api/transactions?${query.toString()}`)
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
      });
    return () => {
      cancelled = true;
    };
  }, [from, to, type, tag, nonce]);

  const sorted = useMemo(() => {
    if (!items) return [];
    const copy = [...items];
    if (sort === 'oldest') copy.sort((a, b) => a.occurred_at.localeCompare(b.occurred_at));
    else if (sort === 'amount') copy.sort((a, b) => b.amount - a.amount);
    else copy.sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
    return copy;
  }, [items, sort]);

  function update(next: Record<string, string>) {
    const merged = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v) merged.set(k, v);
      else merged.delete(k);
    }
    setParams(merged);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-medium">Transactions</h1>
        <p className="text-xs text-muted-foreground">Filter, sort, edit, or delete anything you logged.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-surface p-3 md:grid-cols-5">
        <div>
          <Label htmlFor="from">From</Label>
          <Input
            id="from"
            type="datetime-local"
            value={from ? from.slice(0, 16) : ''}
            onChange={(e) =>
              update({ from: e.target.value ? new Date(e.target.value).toISOString() : '' })
            }
          />
        </div>
        <div>
          <Label htmlFor="to">To</Label>
          <Input
            id="to"
            type="datetime-local"
            value={to ? to.slice(0, 16) : ''}
            onChange={(e) =>
              update({ to: e.target.value ? new Date(e.target.value).toISOString() : '' })
            }
          />
        </div>
        <div>
          <Label htmlFor="type">Type</Label>
          <select
            id="type"
            value={type}
            onChange={(e) => update({ type: e.target.value })}
            className="flex h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
          >
            <option value="">All</option>
            {TRANSACTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t as TransactionType]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="tag">Tag</Label>
          <select
            id="tag"
            value={tag}
            onChange={(e) => update({ tag: e.target.value })}
            className="flex h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
          >
            <option value="">All</option>
            {[...MAJOR_TAGS, ...CATEGORY_TAGS].map((t) => (
              <option key={t} value={t}>
                {TAG_LABELS[t as AllowedTag]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="sort">Sort</Label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="flex h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="amount">Amount</option>
          </select>
        </div>
        <div className="col-span-2 flex items-end md:col-span-5">
          <Button variant="outline" size="sm" onClick={() => setParams({})}>
            Clear filters
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {items ? <TransactionList items={sorted} /> : <p className="text-sm text-muted-foreground">Loading…</p>}
    </div>
  );
}
