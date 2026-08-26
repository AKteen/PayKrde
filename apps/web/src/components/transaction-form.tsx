import { useState } from 'react';
import { TRANSACTION_TYPES, TransactionSchema, TYPE_LABELS, type Transaction } from '@kharcha/shared';
import { api } from '@/lib/api';
import { useDataRefresh } from '@/lib/data-refresh';
import { datetimeLocalToIso, toDatetimeLocalValue } from '@/lib/utils';
import { TagPicker } from '@/components/tag-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type TransactionFormProps = {
  initial?: Transaction;
  onSaved?: () => void;
  variant?: 'bar' | 'full';
};

export function TransactionForm({ initial, onSaved, variant = 'bar' }: TransactionFormProps) {
  const { refresh } = useDataRefresh();
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [type, setType] = useState<(typeof TRANSACTION_TYPES)[number]>(initial?.type ?? 'spend');
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [occurredAt, setOccurredAt] = useState(toDatetimeLocalValue(initial?.occurred_at));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = TransactionSchema.safeParse({
      amount: Number(amount),
      note: note || undefined,
      type,
      tags,
      occurred_at: datetimeLocalToIso(occurredAt),
    });

    if (!parsed.success) {
      setError('Check amount, date, and tags.');
      return;
    }

    setSaving(true);
    try {
      if (initial) {
        await api(`/api/transactions/${initial.id}`, {
          method: 'PATCH',
          body: JSON.stringify(parsed.data),
        });
      } else {
        await api('/api/transactions', {
          method: 'POST',
          body: JSON.stringify(parsed.data),
        });
        setAmount('');
        setNote('');
        setType('spend');
        setTags([]);
        setOccurredAt(toDatetimeLocalValue());
      }
      refresh();
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  }

  const isBar = variant === 'bar';

  return (
    <form
      onSubmit={onSubmit}
      className={
        isBar
          ? 'flex flex-col gap-3 rounded-lg border border-border bg-surface p-3 md:flex-row md:flex-wrap md:items-end'
          : 'flex flex-col gap-3'
      }
    >
      <div className={isBar ? 'grid grid-cols-2 gap-3 md:flex md:flex-1 md:flex-wrap md:items-end' : 'grid gap-3'}>
        <div className="min-w-[8rem] flex-1">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div className="min-w-[10rem] flex-[2]">
          <Label htmlFor="note">Note</Label>
          <Input
            id="note"
            maxLength={280}
            placeholder="What was this for?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <div className="min-w-[9rem]">
          <Label htmlFor="type">Type</Label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as (typeof TRANSACTION_TYPES)[number])}
            className="flex h-10 w-full rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {TRANSACTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[11rem]">
          <Label htmlFor="occurred">Date & time</Label>
          <Input
            id="occurred"
            type="datetime-local"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="md:basis-full">
        <Label>Tags</Label>
        <TagPicker value={tags} onChange={setTags} compact />
      </div>
      {error ? <p className="text-xs text-danger md:basis-full">{error}</p> : null}
      <Button type="submit" disabled={saving} className="h-11 min-h-[44px] md:h-10 md:min-h-10">
        {saving ? 'Saving…' : initial ? 'Save changes' : 'Add'}
      </Button>
    </form>
  );
}
