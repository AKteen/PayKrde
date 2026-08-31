import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import type { Vehicle, VehicleExpense } from '@kharcha/shared';
import { api } from '@/lib/api';
import { useDataRefresh } from '@/lib/data-refresh';
import { AddVehicleCard } from '@/components/add-vehicle-card';
import { TransactionForm } from '@/components/transaction-form';
import { Button } from '@/components/ui/button';
import { SelectField } from '@/components/ui/select-field';
import { GIcon } from '@/lib/tag-meta';
import { TagChip } from '@/lib/tag-meta';
import { vehicleImageSrc } from '@/lib/vehicle';
import { formatInr, relativeDays, tzOffsetMinutes } from '@/lib/utils';

type VehicleSummary = {
  lastPetrol: VehicleExpense | null;
  lastMaintenance: VehicleExpense | null;
  weekPetrol: number;
};

function inRange(iso: string, from: Date, to: Date) {
  const t = new Date(iso).getTime();
  return t >= from.getTime() && t < to.getTime();
}

export function VehiclesPage() {
  const { nonce, refresh } = useDataRefresh();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState<string>('');
  const [expenses, setExpenses] = useState<VehicleExpense[]>([]);
  const [summary, setSummary] = useState<VehicleSummary | null>(null);
  const [range, setRange] = useState<'month' | 'week' | 'all'>('month');
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<Vehicle[]>('/api/vehicles')
      .then((list) => {
        if (cancelled) return;
        setVehicles(list);
        setSelectedId((id) => id || list[0]?.id || '');
        setLoaded(true);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load vehicles');
          setLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  useEffect(() => {
    if (!selectedId) {
      setExpenses([]);
      setSummary(null);
      return;
    }
    let cancelled = false;
    Promise.all([
      api<VehicleExpense[]>(`/api/vehicles/${selectedId}/expenses`),
      api<VehicleSummary>(`/api/vehicles/summary?vehicleId=${selectedId}&tzOffsetMinutes=${tzOffsetMinutes()}`),
    ])
      .then(([ex, s]) => {
        if (cancelled) return;
        setExpenses(ex);
        setSummary(s);
      })
      .catch(() => {
        if (!cancelled) setSummary(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId, nonce]);

  const selected = useMemo(
    () => vehicles.find((v) => v.id === selectedId) ?? null,
    [vehicles, selectedId],
  );

  const filtered = useMemo(() => {
    const now = new Date();
    if (range === 'all') return expenses;
    if (range === 'week') {
      const from = new Date(now);
      const daysFromMonday = (now.getDay() + 6) % 7;
      from.setDate(now.getDate() - daysFromMonday);
      from.setHours(0, 0, 0, 0);
      return expenses.filter((row) => inRange(row.occurred_at, from, now));
    }
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return expenses.filter((row) => inRange(row.occurred_at, from, now));
  }, [expenses, range]);

  const fuel = filtered.filter((r) => r.tags.includes('petrol')).reduce((s, r) => s + r.amount, 0);
  const maintenance = filtered.filter((r) => r.tags.includes('maintenance')).reduce((s, r) => s + r.amount, 0);
  const others = filtered.filter((r) => r.tags.includes('accessories')).reduce((s, r) => s + r.amount, 0);
  const total = fuel + maintenance + others || filtered.reduce((s, r) => s + r.amount, 0);
  const showAddCard = loaded && (vehicles.length === 0 || adding || Boolean(editing));

  async function onDeleteVehicle(id: string) {
    if (!window.confirm('Delete this vehicle and its expenses?')) return;
    await api(`/api/vehicles/${id}`, { method: 'DELETE' });
    setSelectedId('');
    refresh();
  }

  return (
    <div className="space-y-5">
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <section className="relative overflow-hidden rounded-[28px] bg-cream p-6 shadow-soft">
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_280px]">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary">
                  <GIcon name="directions_car" className="text-[22px]" />
                </span>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">Vehicle Expenses</h1>
                  <p className="text-sm text-muted-foreground">Track all your vehicle related expenses in one place</p>
                </div>
              </div>
              {loaded && vehicles.length > 0 ? (
                adding || editing ? (
                  <Button variant="outline" size="sm" onClick={() => { setAdding(false); setEditing(null); }}>
                    Cancel
                  </Button>
                ) : (
                  <Button size="sm" className="min-h-[40px]" onClick={() => { setAdding(true); setEditing(null); }}>
                    <Plus className="mr-1 h-4 w-4" /> Add vehicle
                  </Button>
                )
              ) : null}
            </div>

            <div className="mt-6 max-w-[10rem]">
              <SelectField
                value={range}
                onChange={(v) => setRange(v as typeof range)}
                options={[
                  { value: 'month', label: 'This Month' },
                  { value: 'week', label: 'This Week' },
                  { value: 'all', label: 'All time' },
                ]}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-end gap-8">
              <div>
                <p className="tabular text-4xl font-semibold">{formatInr(total)}</p>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
              </div>
              <div className="flex flex-wrap gap-5">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/80">
                    <GIcon name="local_gas_station" />
                  </span>
                  <div>
                    <p className="tabular text-sm font-semibold">{formatInr(fuel)}</p>
                    <p className="text-[11px] text-muted-foreground">Fuel</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/80">
                    <GIcon name="build" />
                  </span>
                  <div>
                    <p className="tabular text-sm font-semibold">{formatInr(maintenance)}</p>
                    <p className="text-[11px] text-muted-foreground">Maintenance</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/80">
                    <GIcon name="shield" />
                  </span>
                  <div>
                    <p className="tabular text-sm font-semibold">{formatInr(others)}</p>
                    <p className="text-[11px] text-muted-foreground">Others</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <img
            src="/vehicle.png"
            alt=""
            className="pointer-events-none mx-auto h-44 w-auto object-contain lg:h-52"
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile
          icon="local_gas_station"
          tone="green"
          title="Last Petrol Filled"
          status={summary?.lastPetrol ? relativeDays(summary.lastPetrol.occurred_at) : 'No fill yet'}
          detail={summary?.lastPetrol ? formatInr(summary.lastPetrol.amount) : '—'}
        />
        <KpiTile
          icon="build"
          tone="blue"
          title="Last Maintenance"
          status={summary?.lastMaintenance ? relativeDays(summary.lastMaintenance.occurred_at) : 'No service yet'}
          detail={summary?.lastMaintenance ? formatInr(summary.lastMaintenance.amount) : '—'}
        />
        <KpiTile
          icon="speed"
          tone="purple"
          title="Petrol this week"
          status="This week"
          detail={formatInr(summary?.weekPetrol ?? 0)}
        />
        <KpiTile
          icon="category"
          tone="yellow"
          title="Others this month"
          status="Accessories"
          detail={formatInr(others)}
        />
      </div>

      {vehicles.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto">
          {vehicles.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setSelectedId(v.id)}
              className={`flex items-center gap-2 rounded-2xl border px-3 py-2 ${
                selectedId === v.id ? 'border-primary bg-cream' : 'border-border bg-surface'
              }`}
            >
              <img src={vehicleImageSrc(v)} alt="" className="h-8 w-12 object-contain" />
              <span className="text-left">
                <span className="block text-xs font-medium">{v.name}</span>
                {v.number_plate ? (
                  <span className="block font-mono text-[10px] text-muted-foreground">{v.number_plate}</span>
                ) : null}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {showAddCard ? (
          <AddVehicleCard
            initial={editing ?? undefined}
            onAdded={(saved) => {
              setSelectedId(saved.id);
              setAdding(false);
              setEditing(null);
            }}
            onCancel={vehicles.length > 0 ? () => { setAdding(false); setEditing(null); } : undefined}
          />
        ) : null}

        {vehicles.length > 0 ? (
          <div className={showAddCard ? '' : 'lg:col-span-2'}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground">Log expense</h2>
              <Button size="icon" onClick={() => setShowForm((v) => !v)} className="h-10 w-10">
                <span className="text-lg leading-none">{showForm ? '×' : '+'}</span>
              </Button>
            </div>
            {showForm ? <TransactionForm defaultMode="vehicle" onSaved={() => setShowForm(false)} /> : null}
            {vehicles.map((v) => (
              <div key={v.id} className="mt-3 flex items-center justify-between gap-2 rounded-2xl border border-border px-3 py-2">
                <button
                  type="button"
                  onClick={() => setSelectedId(v.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <img src={vehicleImageSrc(v)} alt="" className="h-10 w-14 rounded-md bg-muted object-contain" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{v.name}</span>
                    {v.number_plate ? (
                      <span className="block font-mono text-xs text-muted-foreground">{v.number_plate}</span>
                    ) : null}
                  </span>
                </button>
                <div className="flex shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditing(v);
                      setAdding(false);
                    }}
                  >
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDeleteVehicle(v.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <section id="vehicle-log">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          {selected ? `Expenses · ${selected.name}` : 'Expenses'}
        </h2>
        {expenses.length === 0 ? (
          <p className="text-sm text-muted-foreground">No vehicle expenses yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-card">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border bg-muted/60 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Note</th>
                  <th className="px-4 py-3 font-medium">Tags</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                      {new Date(row.occurred_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">{row.note || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {row.tags.map((tag) => (
                          <TagChip key={tag} tag={tag} />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular font-medium">{formatInr(row.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function KpiTile({
  icon,
  tone,
  title,
  status,
  detail,
}: {
  icon: string;
  tone: 'green' | 'blue' | 'purple' | 'yellow';
  title: string;
  status: string;
  detail: string;
}) {
  const tones = {
    green: { bg: '#10261C', fg: '#6EE7B7', icon: '#10B981' },
    blue: { bg: '#152238', fg: '#93C5FD', icon: '#3B82F6' },
    purple: { bg: '#22183A', fg: '#C4B5FD', icon: '#8B5CF6' },
    yellow: { bg: '#2A2414', fg: '#FCD34D', icon: '#F5C518' },
  }[tone];

  return (
    <div className="rounded-2xl p-4 shadow-soft" style={{ background: tones.bg }}>
      <div className="flex items-start justify-between">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full text-white"
          style={{ background: tones.icon }}
        >
          <GIcon name={icon} />
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-3 text-sm font-medium">{title}</p>
      <p className="text-xs font-medium" style={{ color: tones.fg }}>
        {status}
      </p>
      <p className="mt-1 tabular text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}
