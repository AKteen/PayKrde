import { useEffect, useState } from 'react';
import { ENTRY_TYPES, MEAL_TAGS, TransactionSchema, TYPE_LABELS, VehicleExpenseSchema, mealTagFromHour, zodFieldErrors, type FieldErrors, type Transaction, type TransactionType, type Vehicle } from '@kharcha/shared';
import { ApiError, api } from '@/lib/api';
import { useDataRefresh } from '@/lib/data-refresh';
import { cn, sanitizeAmountInput, tzOffsetMinutes } from '@/lib/utils';
import { DateTimeField } from '@/components/datetime-field';
import { TagPicker } from '@/components/tag-picker';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { SelectField } from '@/components/ui/select-field';
import { vehicleImageSrc } from '@/lib/vehicle';

type TransactionFormProps = {
  initial?: Transaction;
  onSaved?: () => void;
  variant?: 'bar' | 'full';
  defaultMode?: 'personal' | 'vehicle';
  defaultType?: TransactionType;
};

export function TransactionForm({
  initial,
  onSaved,
  defaultMode = 'personal',
  defaultType = 'spend',
}: TransactionFormProps) {
  const { refresh } = useDataRefresh();
  const [mode, setMode] = useState<'personal' | 'vehicle'>(initial ? 'personal' : defaultMode);
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [type, setType] = useState<TransactionType>(initial?.type ?? defaultType);
  const [tags, setTags] = useState<string[]>(
    initial?.tags ?? (defaultMode === 'vehicle' ? ['petrol'] : []),
  );
  const [occurredAt, setOccurredAt] = useState(initial?.occurred_at ?? new Date().toISOString());
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<Vehicle[]>('/api/vehicles')
      .then((list) => {
        setVehicles(list);
        setVehicleId((current) => current || list[0]?.id || '');
      })
      .catch(() => setVehicles([]));
  }, []);

  const isBorrow = type === 'udhar_taken';

  function withMealTag(next: string[]) {
    if (mode === 'vehicle') return next;
    if (MEAL_TAGS.some((tag) => next.includes(tag))) return next;
    const hour = new Date(occurredAt).getHours() + new Date(occurredAt).getMinutes() / 60;
    const meal = mealTagFromHour(hour);
    return meal ? [...next, meal] : next;
  }

  function applyIssues(next: FieldErrors, message: string) {
    setFields(next);
    setError(message);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFields({});

    if (mode === 'vehicle') {
      if (!vehicleId) {
        applyIssues({ vehicleId: 'Add a vehicle first.' }, 'Add a vehicle first.');
        return;
      }
      const parsed = VehicleExpenseSchema.safeParse({
        amount,
        note: note || undefined,
        tags,
        occurred_at: occurredAt,
      });
      if (!parsed.success) {
        const issues = zodFieldErrors(parsed.error);
        applyIssues(issues.fields, issues.error);
        return;
      }
      setSaving(true);
      try {
        await api(`/api/vehicles/${vehicleId}/expenses`, {
          method: 'POST',
          body: JSON.stringify(parsed.data),
        });
        setAmount('');
        setNote('');
        setTags(['petrol']);
        setOccurredAt(new Date().toISOString());
        refresh();
        onSaved?.();
      } catch (err) {
        if (err instanceof ApiError) applyIssues(err.fields, err.message);
        else setError(err instanceof Error ? err.message : 'Could not save');
      } finally {
        setSaving(false);
      }
      return;
    }

    const parsed = TransactionSchema.safeParse({
      amount,
      note: note || undefined,
      type,
      tags: withMealTag(tags),
      occurred_at: occurredAt,
    });

    if (!parsed.success) {
      const issues = zodFieldErrors(parsed.error);
      applyIssues(issues.fields, issues.error);
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
          body: JSON.stringify({ ...parsed.data, tzOffsetMinutes: tzOffsetMinutes() }),
        });
        setAmount('');
        setNote('');
        setType('spend');
        setTags([]);
        setOccurredAt(new Date().toISOString());
      }
      refresh();
      onSaved?.();
    } catch (err) {
      if (err instanceof ApiError) applyIssues(err.fields, err.message);
      else setError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-border bg-surface p-5 shadow-card" noValidate>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold">{initial ? 'Edit transaction' : 'Add new transaction'}</h2>
        {!initial ? (
          <div className="flex flex-wrap gap-2">
            <div className="flex rounded-full bg-muted p-1">
              <button
                type="button"
                onClick={() => {
                  setMode('personal');
                  setTags([]);
                  setFields({});
                  setError(null);
                }}
                className={`rounded-full px-4 py-1.5 text-xs font-medium ${
                  mode === 'personal' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                Spend
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('vehicle');
                  setTags(['petrol']);
                  setFields({});
                  setError(null);
                }}
                className={`rounded-full px-4 py-1.5 text-xs font-medium ${
                  mode === 'vehicle' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                Vehicle
              </button>
            </div>
            {mode === 'personal' ? (
              <div className="flex rounded-full bg-muted p-1">
                <button
                  type="button"
                  onClick={() => setType('spend')}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium ${
                    !isBorrow ? 'bg-surface text-foreground shadow-soft' : 'text-muted-foreground'
                  }`}
                >
                  Out
                </button>
                <button
                  type="button"
                  onClick={() => setType('udhar_taken')}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium ${
                    isBorrow ? 'bg-surface text-foreground shadow-soft' : 'text-muted-foreground'
                  }`}
                >
                  Borrow
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {mode === 'vehicle' ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {vehicles.length === 0 ? (
            <p className="text-xs text-danger">{fields.vehicleId || 'Add a vehicle on the Vehicles page first.'}</p>
          ) : (
            vehicles.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVehicleId(v.id)}
                className={`flex items-center gap-2 rounded-2xl border px-2 py-1.5 ${
                  vehicleId === v.id ? 'border-primary bg-cream' : 'border-border'
                }`}
              >
                <img src={vehicleImageSrc(v)} alt="" className="h-8 w-12 rounded-md object-contain bg-muted" />
                <span className="text-xs font-medium">{v.name}</span>
              </button>
            ))
          )}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <div
          className={cn(
            'flex flex-col justify-center rounded-2xl bg-cream px-4 py-4',
            (fields.amount || fields.note) && 'ring-1 ring-danger',
          )}
        >
          <span className="text-lg font-semibold tabular">
            ₹{' '}
            <input
              className="w-[calc(100%-1.5rem)] bg-transparent text-lg font-semibold outline-none"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              aria-invalid={Boolean(fields.amount)}
              onChange={(e) => {
                setAmount(sanitizeAmountInput(e.target.value));
                setFields((prev) => ({ ...prev, amount: '' }));
              }}
            />
          </span>
          <span className="text-[11px] text-muted-foreground">Enter amount</span>
          <FieldError message={fields.amount} />
          <span className="mt-4 text-[11px] text-muted-foreground">What was this for?</span>
          <input
            className="mt-0.5 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            maxLength={280}
            placeholder={mode === 'vehicle' ? 'e.g. Full tank, service' : 'e.g. Dinner, Grocery, Petrol'}
            value={note}
            aria-invalid={Boolean(fields.note)}
            onChange={(e) => setNote(e.target.value)}
          />
          <FieldError message={fields.note} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-1">
          {mode === 'personal' ? (
            <div
              className={cn(
                'flex min-h-[88px] flex-col justify-center rounded-2xl border px-4 py-3',
                fields.type ? 'border-danger' : 'border-border',
              )}
            >
              <SelectField
                label="Type"
                value={type}
                onChange={(v) => setType(v as TransactionType)}
                options={ENTRY_TYPES.map((t) => ({ value: t, label: TYPE_LABELS[t] }))}
              />
              <FieldError message={fields.type} />
            </div>
          ) : (
            <div className="flex min-h-[88px] items-center rounded-2xl border border-border px-4 py-3 text-sm text-muted-foreground">
              Vehicle expense
            </div>
          )}
          <DateTimeField value={occurredAt} onChange={setOccurredAt} error={fields.occurred_at} />
        </div>
      </div>

      <div className="mt-4">
        <TagPicker
          value={tags}
          compact
          mode={mode}
          onChange={(next) => {
            if (mode === 'personal' && next.includes('petrol')) {
              setMode('vehicle');
              setTags(['petrol']);
              return;
            }
            setTags(next);
            setFields((prev) => ({ ...prev, tags: '' }));
          }}
        />
        <FieldError message={fields.tags} />
      </div>
      {error && !fields.amount && !fields.note && !fields.occurred_at && !fields.tags ? (
        <p className="mt-3 text-xs text-danger">{error}</p>
      ) : null}
      <div className="mt-4 flex justify-end">
        <Button type="submit" disabled={saving} className="h-11 min-h-[44px] px-5">
          {saving ? 'Saving…' : initial ? 'Save changes' : mode === 'vehicle' ? 'Add expense' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
