import { Link } from 'react-router-dom';
import type { Vehicle } from '@kharcha/shared';
import { Card } from '@/components/ui/card';
import { vehicleImageSrc } from '@/lib/vehicle';

export function VehicleKpi({ vehicles }: { vehicles: Vehicle[] }) {
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
        <div className="flex gap-3 overflow-x-auto">
          {vehicles.map((v) => (
            <Link key={v.id} to="/vehicles" className="flex min-w-[7.5rem] flex-col items-center">
              <img
                src={vehicleImageSrc(v)}
                alt={v.name}
                className="h-16 w-24 rounded-xl object-contain bg-muted"
              />
              <p className="mt-1 max-w-[7.5rem] truncate text-xs font-medium">{v.name}</p>
              {v.number_plate ? (
                <p className="max-w-[7.5rem] truncate font-mono text-[10px] text-muted-foreground">{v.number_plate}</p>
              ) : (
                <p className="text-[10px] text-muted-foreground">{v.kind === '4w' ? '4 wheeler' : '2 wheeler'}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
