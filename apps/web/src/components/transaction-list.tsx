import { useState } from 'react';
import { TYPE_LABELS, type Transaction } from '@kharcha/shared';
import { api } from '@/lib/api';
import { useDataRefresh } from '@/lib/data-refresh';
import { formatInr } from '@/lib/utils';
import { TransactionForm } from '@/components/transaction-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TagChip } from '@/lib/tag-meta';

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
      <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border bg-muted/60 text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Note</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Tags</th>
              <th className="px-4 py-3 font-medium text-right">Amount</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((tx) => (
              <tr key={tx.id} className="border-b border-border last:border-0">
                <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground tabular">
                  {new Date(tx.occurred_at).toLocaleString()}
                </td>
                <td className="max-w-[16rem] truncate px-4 py-3">{tx.note || '—'}</td>
                <td className="whitespace-nowrap px-4 py-3">{TYPE_LABELS[tx.type]}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {tx.tags.map((tag) => (
                      <TagChip key={tag} tag={tag} />
                    ))}
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular font-medium">
                  {formatInr(tx.amount)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(tx)}>
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={Boolean(editing)} onOpenChange={(open: boolean) => !open && setEditing(null)}>
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
