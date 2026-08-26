import { useState } from 'react';
import type { Investment } from '@kharcha/shared';
import { api } from '@/lib/api';
import { useDataRefresh } from '@/lib/data-refresh';
import { formatInr } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function InvestmentFields({
  initial,
  onCancel,
}: {
  initial?: Investment;
  onCancel?: () => void;
}) {
  const { refresh } = useDataRefresh();
  const [name, setName] = useState(initial?.name ?? '');
  const [invested, setInvested] = useState(initial ? String(initial.amount_invested) : '');
  const [current, setCurrent] = useState(initial ? String(initial.current_value) : '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = {
      name: name.trim(),
      amount_invested: Number(invested),
      current_value: Number(current),
      notes: notes || undefined,
    };
    setSaving(true);
    try {
      if (initial) {
        await api(`/api/investments/${initial.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        onCancel?.();
      } else {
        await api('/api/investments', { method: 'POST', body: JSON.stringify(payload) });
        setName('');
        setInvested('');
        setCurrent('');
        setNotes('');
      }
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label htmlFor="inv-name">Name</Label>
        <Input id="inv-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="inv-invested">Amount invested</Label>
        <Input id="inv-invested" inputMode="decimal" value={invested} onChange={(e) => setInvested(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="inv-current">Current value</Label>
        <Input id="inv-current" inputMode="decimal" value={current} onChange={(e) => setCurrent(e.target.value)} required />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="inv-notes">Notes</Label>
        <Input id="inv-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      {error ? <p className="text-xs text-danger sm:col-span-2">{error}</p> : null}
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : initial ? 'Save' : 'Add investment'}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}

export function InvestmentsTable({
  items,
  compact,
}: {
  items: Investment[];
  compact?: boolean;
}) {
  const { refresh } = useDataRefresh();
  const [editing, setEditing] = useState<Investment | null>(null);
  const rows = compact ? items.slice(0, 5) : items;

  async function onDelete(id: string) {
    if (!window.confirm('Delete this investment?')) return;
    await api(`/api/investments/${id}`, { method: 'DELETE' });
    refresh();
  }

  return (
    <div className="space-y-4">
      {!compact ? <InvestmentFields /> : null}
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No investments yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Invested</th>
                <th className="px-3 py-2 font-medium">Current</th>
                <th className="px-3 py-2 font-medium">P/L</th>
                {!compact ? <th className="px-3 py-2 font-medium" /> : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const pnl = row.current_value - row.amount_invested;
                return (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2">
                      <div className="font-medium">{row.name}</div>
                      {row.notes ? <div className="text-xs text-muted-foreground">{row.notes}</div> : null}
                    </td>
                    <td className="px-3 py-2 tabular">{formatInr(row.amount_invested)}</td>
                    <td className="px-3 py-2 tabular">{formatInr(row.current_value)}</td>
                    <td className={`px-3 py-2 tabular ${pnl >= 0 ? 'text-success' : 'text-danger'}`}>
                      {formatInr(pnl)}
                    </td>
                    {!compact ? (
                      <td className="px-3 py-2 text-right">
                        <Button variant="ghost" size="sm" onClick={() => setEditing(row)}>
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onDelete(row.id)}>
                          Delete
                        </Button>
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit investment</DialogTitle>
          </DialogHeader>
          {editing ? <InvestmentFields initial={editing} onCancel={() => setEditing(null)} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
