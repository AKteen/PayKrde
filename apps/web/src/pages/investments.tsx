import { useEffect, useState } from 'react';
import type { Investment } from '@kharcha/shared';
import { api } from '@/lib/api';
import { useDataRefresh } from '@/lib/data-refresh';
import { InvestmentsTable } from '@/components/investments-table';

export function InvestmentsPage() {
  const { nonce } = useDataRefresh();
  const [items, setItems] = useState<Investment[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    api<Investment[]>('/api/investments')
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
      });
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-medium">Investments</h1>
        <p className="text-xs text-muted-foreground">Manual entries only — name, amount in, current value.</p>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {items ? <InvestmentsTable items={items} /> : <p className="text-sm text-muted-foreground">Loading…</p>}
    </div>
  );
}
