import { useState } from 'react';
import { api } from '@/lib/api';
import { useDataRefresh } from '@/lib/data-refresh';
import { formatInr } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function BalanceCard({ balance }: { balance: number }) {
  const { refresh } = useDataRefresh();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'add' | 'adjust'>('add');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function openDialog(next: 'add' | 'adjust') {
    setMode(next);
    setAmount('');
    setReason('');
    setError(null);
    setOpen(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const raw = Number(amount);
    if (!Number.isFinite(raw) || raw === 0) {
      setError('Enter a non-zero amount.');
      return;
    }
    const change_amount = mode === 'add' ? Math.abs(raw) : raw;
    setSaving(true);
    setError(null);
    try {
      await api('/api/balance/adjust', {
        method: 'POST',
        body: JSON.stringify({ change_amount, reason: reason || undefined }),
      });
      setOpen(false);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update balance');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bank balance</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="tabular text-lg font-medium">{formatInr(balance)}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => openDialog('add')}>
            Add money
          </Button>
          <Button size="sm" variant="outline" onClick={() => openDialog('adjust')}>
            Adjust balance
          </Button>
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{mode === 'add' ? 'Add money' : 'Adjust balance'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <Label htmlFor="bal-amount">
                {mode === 'add' ? 'Amount to add' : 'Change amount (negative to subtract)'}
              </Label>
              <Input
                id="bal-amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="bal-reason">Reason</Label>
              <Input
                id="bal-reason"
                maxLength={280}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Salary, correction, …"
              />
            </div>
            {error ? <p className="text-xs text-danger">{error}</p> : null}
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
