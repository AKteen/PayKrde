import { useState } from 'react';
import type { Investment } from '@kharcha/shared';
import { InvestmentSchema, zodFieldErrors, type FieldErrors } from '@kharcha/shared';
import { ApiError, api } from '@/lib/api';
import { useDataRefresh } from '@/lib/data-refresh';
import { formatInr, sanitizeAmountInput } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FieldError } from '@/components/ui/field-error';
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
  const [fields, setFields] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFields({});
    const parsed = InvestmentSchema.safeParse({
      name,
      amount_invested: invested,
      current_value: current,
      notes: notes || undefined,
    });
    if (!parsed.success) {
      const issues = zodFieldErrors(parsed.error);
      setFields(issues.fields);
      setError(issues.error);
      return;
    }
    setSaving(true);
    try {
      if (initial) {
        await api(`/api/investments/${initial.id}`, {
          method: 'PATCH',
          body: JSON.stringify(parsed.data),
        });
        onCancel?.();
      } else {
        await api('/api/investments', { method: 'POST', body: JSON.stringify(parsed.data) });
        setName('');
        setInvested('');
        setCurrent('');
        setNotes('');
      }
      refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setFields(err.fields);
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : 'Could not save');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2" noValidate>
      <div className="sm:col-span-2">
        <Label htmlFor="inv-name">Name</Label>
        <Input
          id="inv-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={Boolean(fields.name)}
        />
        <FieldError message={fields.name} />
      </div>
      <div>
        <Label htmlFor="inv-invested">Amount invested</Label>
        <Input
          id="inv-invested"
          inputMode="decimal"
          value={invested}
          onChange={(e) => setInvested(sanitizeAmountInput(e.target.value))}
          aria-invalid={Boolean(fields.amount_invested)}
        />
        <FieldError message={fields.amount_invested} />
      </div>
      <div>
        <Label htmlFor="inv-current">Current value</Label>
        <Input
          id="inv-current"
          inputMode="decimal"
          value={current}
          onChange={(e) => setCurrent(sanitizeAmountInput(e.target.value))}
          aria-invalid={Boolean(fields.current_value)}
        />
        <FieldError message={fields.current_value} />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="inv-notes">Notes</Label>
        <Input id="inv-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <FieldError message={fields.notes} />
      </div>
      {error && !fields.name && !fields.amount_invested && !fields.current_value ? (
        <p className="text-xs text-danger sm:col-span-2">{error}</p>
      ) : null}
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
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-card">
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

      <Dialog open={Boolean(editing)} onOpenChange={(open: boolean) => !open && setEditing(null)}>
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
