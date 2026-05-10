import { VehicleCard } from './VehicleCard';
import type { Vehicle } from '@/lib/api/vehicles';
import type { Make } from '@/lib/api/makes';

interface VehicleGridProps {
  vehicles: Vehicle[];
  makes?: Make[];
  emptyMessage?: string;
}

export function VehicleGrid({ vehicles, makes, emptyMessage = 'לא נמצאו רכבים' }: VehicleGridProps) {
  if (!vehicles.length) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-lg">{emptyMessage}</p>
      </div>
    );
  }

  const makeById = new Map((makes || []).map((m) => [m.id, m] as const));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {vehicles.map((v) => (
        <VehicleCard key={v.id} vehicle={v} make={makeById.get(v.makeId)} />
      ))}
    </div>
  );
}
