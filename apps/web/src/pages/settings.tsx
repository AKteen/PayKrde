import { useEffect, useState } from 'react';
import type { BalanceLog, Profile, TransactionSummary } from '@kharcha/shared';
import { ProfilePatchSchema, zodFieldErrors, type FieldErrors } from '@kharcha/shared';
import { ApiError, api } from '@/lib/api';
import { useDataRefresh } from '@/lib/data-refresh';
import { ageFromDob, formatInr, tzOffsetMinutes } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldError } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SettingsPage() {
  const { nonce } = useDataRefresh();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [history, setHistory] = useState<BalanceLog[]>([]);
  const [monthSpend, setMonthSpend] = useState(0);
  const [monthAdded, setMonthAdded] = useState(0);
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<FieldErrors>({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    Promise.all([
      api<Profile>('/api/profile'),
      api<BalanceLog[]>('/api/balance/history'),
      api<TransactionSummary>(`/api/transactions/summary?tzOffsetMinutes=${tzOffsetMinutes()}`),
    ])
      .then(([p, logs, summary]) => {
        if (cancelled) return;
        setProfile(p);
        setFullName(p.full_name ?? '');
        setDob(p.date_of_birth ?? '');
        setHistory(logs);
        setMonthSpend(summary.spent?.month ?? summary.month);
        setMonthAdded(summary.additions?.month ?? 0);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load settings');
      });
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const age = ageFromDob(dob || null);
  const monthlySavings = Math.max(0, monthAdded - monthSpend);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFields({});
    setSaved(false);
    const parsed = ProfilePatchSchema.safeParse({
      full_name: fullName,
      date_of_birth: dob || null,
    });
    if (!parsed.success) {
      const issues = zodFieldErrors(parsed.error);
      setFields(issues.fields);
      setError(issues.error);
      return;
    }
    setSaving(true);
    try {
      const next = await api<Profile>('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify(parsed.data),
      });
      setProfile(next);
      setSaved(true);
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

  if (!profile && !error) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-lg font-medium">Settings</h1>
        <p className="text-xs text-muted-foreground">Profile, this month, and bank-balance history.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Spent this month</p>
          <p className="mt-1 tabular text-lg font-semibold">{formatInr(monthSpend)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Monthly savings</p>
          <p className="mt-1 tabular text-lg font-semibold text-info">{formatInr(monthlySavings)}</p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-3" noValidate>
            <div>
              <Label htmlFor="full_name">Full name</Label>
              <Input
                id="full_name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                maxLength={120}
                aria-invalid={Boolean(fields.full_name)}
              />
              <FieldError message={fields.full_name} />
            </div>
            <div>
              <Label htmlFor="dob">Date of birth</Label>
              <Input
                id="dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                aria-invalid={Boolean(fields.date_of_birth)}
              />
              {age != null ? (
                <p className="mt-1 text-xs text-muted-foreground">Age: {age}</p>
              ) : null}
              <FieldError message={fields.date_of_birth} />
            </div>
            {error && !fields.full_name && !fields.date_of_birth ? <p className="text-xs text-danger">{error}</p> : null}
            {saved ? <p className="text-xs text-success">Saved.</p> : null}
            <Button type="submit" disabled={saving} className="min-h-[44px]">
              {saving ? 'Saving…' : 'Save profile'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Balance history</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No adjustments yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {history.map((row) => (
                <li key={row.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-sm">
                  <div>
                    <p className={`tabular font-medium ${row.change_amount >= 0 ? 'text-success' : 'text-danger'}`}>
                      {row.change_amount >= 0 ? '+' : ''}
                      {formatInr(row.change_amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">{row.reason || '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="tabular text-xs text-muted-foreground">
                      After {formatInr(row.balance_after)}
                      {row.wallet === 'cash' ? ' · cash' : ' · bank'}
                    </p>
                    <time className="text-xs text-muted-foreground">
                      {new Date(row.created_at).toLocaleString()}
                    </time>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
