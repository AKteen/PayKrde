import { useState } from 'react';
import { BalanceAdjustSchema, zodFieldErrors, type FieldErrors, type WalletKind } from '@kharcha/shared';
import { ApiError, api } from '@/lib/api';
import { useDataRefresh } from '@/lib/data-refresh';
import { formatInr, sanitizeAmountInput } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FieldError } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export function BalanceCard({ bank, cash }: { bank: number; cash?: number }) {
  const { refresh } = useDataRefresh();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'add' | 'adjust'>('add');
  const [wallet, setWallet] = useState<WalletKind>('bank');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const cashValue = cash ?? 0;

  function openDialog(next: 'add' | 'adjust', nextWallet: WalletKind = 'bank') {
    setMode(next);
    setWallet(nextWallet);
    setAmount('');
    setReason('');
    setError(null);
    setFields({});
    setOpen(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFields({});
    const raw = mode === 'add' ? amount.replace(/^-/, '') : amount;
    const parsed = BalanceAdjustSchema.safeParse({
      change_amount: mode === 'add' ? (raw.trim() === '' ? undefined : Math.abs(Number(raw.replace(/,/g, '')))) : raw,
      reason: reason || undefined,
      wallet,
    });
    if (!parsed.success) {
      const issues = zodFieldErrors(parsed.error);
      setFields(issues.fields);
      setError(issues.error);
      return;
    }
    setSaving(true);
    try {
      await api('/api/balance/adjust', {
        method: 'POST',
        body: JSON.stringify(parsed.data),
      });
      setOpen(false);
      refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setFields(err.fields);
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : 'Could not update balance');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallets</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[11px] text-muted-foreground">Bank / online</p>
            <p className="tabular text-lg font-medium">{formatInr(bank)}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Cash in hand</p>
            <p className="tabular text-lg font-medium">{formatInr(cashValue)}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => openDialog('add', 'bank')}>
            Add to bank
          </Button>
          <Button size="sm" variant="outline" onClick={() => openDialog('add', 'cash')}>
            Add cash
          </Button>
          <Button size="sm" variant="outline" onClick={() => openDialog('adjust', wallet)}>
            Adjust
          </Button>
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{mode === 'add' ? 'Add money' : 'Adjust balance'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-3" noValidate>
            <div className="flex gap-2">
              {(['bank', 'cash'] as const).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setWallet(w)}
                  className={cn(
                    'flex-1 rounded-full px-3 py-2 text-xs font-medium',
                    wallet === w ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {w === 'bank' ? 'Bank / online' : 'Cash'}
                </button>
              ))}
            </div>
            <div>
              <Label htmlFor="bal-amount">
                {mode === 'add' ? 'Amount to add' : 'Change amount (negative to subtract)'}
              </Label>
              <Input
                id="bal-amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  const v = e.target.value;
                  setAmount(mode === 'add' ? sanitizeAmountInput(v) : v.replace(/[^\d.-]/g, ''));
                }}
                aria-invalid={Boolean(fields.change_amount)}
              />
              <FieldError message={fields.change_amount} />
            </div>
            <div>
              <Label htmlFor="bal-reason">Reason</Label>
              <Input
                id="bal-reason"
                maxLength={280}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Salary, ATM, correction, …"
                aria-invalid={Boolean(fields.reason)}
              />
              <FieldError message={fields.reason} />
            </div>
            {error && !fields.change_amount && !fields.reason ? <p className="text-xs text-danger">{error}</p> : null}
            <Button type="submit" disabled={saving} className="w-full min-h-[44px]">
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
