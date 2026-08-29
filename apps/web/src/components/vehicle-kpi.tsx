import { Link } from 'react-router-dom';
import type { Vehicle, VehicleExpense } from '@kharcha/shared';
import { Card } from '@/components/ui/card';
import { vehicleImageSrc } from '@/lib/vehicle';
import { formatInr, relativeDays } from '@/lib/utils';

function fillDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-cream px-3 py-2">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-semibold tabular">{value}</p>
      {hint ? <p className="truncate text-[10px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function VehicleKpi({
  vehicles,
  lastPetrol,
}: {
  vehicles: Vehicle[];
  lastPetrol?: VehicleExpense | null;
}) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Vehicles</p>
        <Link to="/vehicles" className="text-xs font-medium text-info hover:underline">
          Open →
        </Link>
      </div>
      {vehicles.length === 0 ? (
        <Link to="/vehicles" className="block text-sm text-muted-foreground hover:text-foreground">
          Add a vehicle to track petrol and maintenance.
        </Link>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 gap-3 overflow-x-auto">
            {vehicles.map((v) => (
              <Link key={v.id} to="/vehicles" className="flex min-w-[5.5rem] flex-col items-center sm:items-start">
                <img
                  src={vehicleImageSrc(v)}
                  alt={v.name}
                  className="h-16 w-24 rounded-xl bg-muted object-contain"
                />
                <p className="mt-1 max-w-[7.5rem] truncate text-xs font-medium">{v.name}</p>
                {v.number_plate ? (
                  <p className="max-w-[7.5rem] truncate font-mono text-[10px] text-muted-foreground">
                    {v.number_plate}
                  </p>
                ) : (
                  <p className="text-[10px] text-muted-foreground">{v.kind === '4w' ? '4 wheeler' : '2 wheeler'}</p>
                )}
              </Link>
            ))}
          </div>
          <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 sm:max-w-[16rem]">
            <Kpi
              label="Petrol filled"
              value={lastPetrol ? formatInr(lastPetrol.amount) : '—'}
              hint={lastPetrol ? relativeDays(lastPetrol.occurred_at) : 'No fill yet'}
            />
            <Kpi
              label="Last fill date"
              value={lastPetrol ? fillDate(lastPetrol.occurred_at) : '—'}
              hint={lastPetrol ? relativeDays(lastPetrol.occurred_at) : 'Log a fill'}
            />
          </div>
        </div>
      )}
    </Card>
  );
}
