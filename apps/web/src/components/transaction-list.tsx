import { useState } from 'react';
import { TAG_LABELS, TYPE_LABELS, type AllowedTag, type Transaction } from '@kharcha/shared';
import { api } from '@/lib/api';
import { useDataRefresh } from '@/lib/data-refresh';
import { formatInr } from '@/lib/utils';
import { TransactionForm } from '@/components/transaction-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function TransactionList({ items }: { items: Transaction[] }) {
  const { refresh } = useDataRefresh();
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function onDelete(tx: Transaction) {
    if (!window.confirm('Delete this transaction?')) return;
    setBusyId(tx.id);
    try {
      await api(`/api/transactions/${tx.id}`, { method: 'DELETE' });
      refresh();
    } finally {
      setBusyId(null);
    }
  }

  if (items.length === 0) {
    return <p className="px-1 py-8 text-center text-sm text-muted-foreground">No transactions yet.</p>;
  }

  return (
    <>
      <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
        {items.map((tx) => (
          <li key={tx.id} className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex min-w-0 flex-1 items-baseline gap-3">
              <span className="tabular text-base font-medium">{formatInr(tx.amount)}</span>
              <span className="truncate text-sm text-muted-foreground">{tx.note || '—'}</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline">{TYPE_LABELS[tx.type]}</Badge>
              {tx.tags.map((tag) => (
                <Badge key={tag} variant="muted">
                  {TAG_LABELS[tag as AllowedTag] ?? tag}
                </Badge>
              ))}
            </div>
            <time className="text-xs text-muted-foreground tabular">
              {new Date(tx.occurred_at).toLocaleString()}
            </time>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(tx)}>
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={busyId === tx.id}
                onClick={() => onDelete(tx)}
              >
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit transaction</DialogTitle>
          </DialogHeader>
          {editing ? (
            <TransactionForm
              initial={editing}
              variant="full"
              onSaved={() => setEditing(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
