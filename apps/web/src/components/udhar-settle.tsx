import { useState } from 'react';
import { TransactionSchema, zodFieldErrors, type FieldErrors, type TransactionType } from '@kharcha/shared';
import { ApiError, api } from '@/lib/api';
import { useDataRefresh } from '@/lib/data-refresh';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn, formatInr, sanitizeAmountInput } from '@/lib/utils';

export function UdharSettle({ borrowed, lent }: { borrowed: number; lent: number }) {
  const { refresh } = useDataRefresh();
  const [side, setSide] = useState<'borrowed' | 'lent'>('borrowed');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [fields, setFields] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const outstanding = side === 'borrowed' ? borrowed : lent;
  const type: TransactionType = side === 'borrowed' ? 'udhar_repay' : 'udhar_collect';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFields({});
    const parsed = TransactionSchema.safeParse({
      amount,
      note: note || undefined,
      type,
      tags: [side === 'borrowed' ? 'udhar_taken' : 'udhar_given'],
      occurred_at: new Date().toISOString(),
    });
    if (!parsed.success) {
      const issues = zodFieldErrors(parsed.error);
      setFields(issues.fields);
      setError(issues.error);
      return;
    }
    if (parsed.data.amount > outstanding + 0.001) {
      setFields({ amount: `Outstanding is ${formatInr(outstanding)}` });
      setError(`Cannot return more than ${formatInr(outstanding)}`);
      return;
    }
    if (outstanding <= 0) {
      setError(side === 'borrowed' ? 'Nothing left to return.' : 'Nothing left to collect.');
      return;
    }
    setSaving(true);
    try {
      await api('/api/transactions', {
        method: 'POST',
        body: JSON.stringify(parsed.data),
      });
      setAmount('');
      setNote('');
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
    <form onSubmit={onSubmit} className="rounded-2xl border border-border bg-surface p-4 shadow-soft" noValidate>
      <h2 className="text-sm font-semibold">Mark as returned</h2>
      <p className="mb-3 text-[11px] text-muted-foreground">
        Enter the amount that came back. Outstanding borrowed / lent goes down by that much.
      </p>
      <div className="mb-3 flex rounded-full bg-muted p-1">
        {(['borrowed', 'lent'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setSide(s);
              setError(null);
              setFields({});
            }}
            className={cn(
              'flex-1 rounded-full py-2 text-xs font-medium',
              side === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
            )}
          >
            {s === 'borrowed' ? 'I returned' : 'They paid me'}
          </button>
        ))}
      </div>
      <p className="mb-2 text-xs text-muted-foreground">
        Outstanding {side === 'borrowed' ? 'borrowed' : 'lent'}:{' '}
        <span className="tabular font-medium text-foreground">{formatInr(outstanding)}</span>
      </p>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div>
          <Label htmlFor="settle-amt">Amount returned</Label>
          <Input
            id="settle-amt"
            inputMode="decimal"
            value={amount}
            placeholder="0"
            onChange={(e) => {
              setAmount(sanitizeAmountInput(e.target.value));
              setFields((prev) => ({ ...prev, amount: '' }));
            }}
            aria-invalid={Boolean(fields.amount)}
          />
          <FieldError message={fields.amount} />
        </div>
        <div className="sm:pt-6">
          <Button type="submit" disabled={saving || outstanding <= 0} className="min-h-[44px] w-full sm:w-auto">
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
      <div className="mt-3">
        <Label htmlFor="settle-note">Note (optional)</Label>
        <Input
          id="settle-note"
          value={note}
          maxLength={280}
          placeholder={side === 'borrowed' ? 'e.g. Paid Rahul back' : 'e.g. Amit returned cash'}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      {error && !fields.amount ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
    </form>
  );
}
