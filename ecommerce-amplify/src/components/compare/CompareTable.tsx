import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { StorageImage } from '@/components/StorageImage';
import { useCompare } from '@/lib/compare/CompareContext';
import type { Vehicle } from '@/lib/api/vehicles';
import type { Make } from '@/lib/api/makes';
import { TRANSMISSION_LABELS, FUEL_TYPE_LABELS, DRIVE_TYPE_LABELS, CONDITION_LABELS } from '@/components/vehicle/labels';

interface Props {
  vehicles: Vehicle[];
  makes: Make[];
}

interface Row {
  label: string;
  get: (v: Vehicle) => string | number | null | undefined;
}

function formatPrice(p: number): string {
  return `₪${p.toLocaleString('he-IL')}`;
}

function formatKm(km?: number | null) {
  if (km == null) return '—';
  return `${km.toLocaleString('he-IL')} ק"מ`;
}

export function CompareTable({ vehicles, makes }: Props) {
  const { remove } = useCompare();
  const makeById = new Map(makes.map((m) => [m.id, m] as const));

  const rows: Row[] = [
    { label: 'מחיר', get: (v) => formatPrice(v.price) },
    { label: 'שנה', get: (v) => v.year },
    { label: 'קילומטראז\'', get: (v) => formatKm(v.mileage) },
    { label: 'תיבה', get: (v) => v.transmission ? TRANSMISSION_LABELS[v.transmission] : '—' },
    { label: 'דלק', get: (v) => v.fuelType ? FUEL_TYPE_LABELS[v.fuelType] : '—' },
    { label: 'הנעה', get: (v) => v.driveType ? DRIVE_TYPE_LABELS[v.driveType] : '—' },
    { label: 'הספק', get: (v) => v.enginePower ? `${v.enginePower} כ"ס` : '—' },
    { label: 'נפח מנוע', get: (v) => v.engineCapacity ? `${v.engineCapacity.toLocaleString('he-IL')} סמ"ק` : '—' },
    { label: 'יד', get: (v) => v.hand ?? '—' },
    { label: 'בעלים קודמים', get: (v) => v.previousOwners ?? '—' },
    { label: 'צבע', get: (v) => v.color ?? '—' },
    { label: 'דלתות', get: (v) => v.doors ?? '—' },
    { label: 'מושבים', get: (v) => v.seats ?? '—' },
    { label: 'מצב', get: (v) => v.condition ? CONDITION_LABELS[v.condition] : '—' },
    { label: 'ללא תאונות', get: (v) => v.accidentFree == null ? '—' : v.accidentFree ? 'כן' : 'לא' },
    { label: 'מספר תכונות', get: (v) => v.features?.length ?? 0 },
  ];

  return (
    <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="bg-brand-50 text-brand-900 font-bold p-4 text-right border-b border-gray-200 w-32">
              מאפיין
            </th>
            {vehicles.map((v) => {
              const make = makeById.get(v.makeId);
              return (
                <th key={v.id} className="bg-brand-50 p-4 border-b border-gray-200 align-top min-w-[200px]">
                  <div className="space-y-2">
                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
                      <StorageImage
                        keyOrUrl={v.images?.[0]}
                        alt={v.modelName}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => remove(v.id)}
                        className="absolute top-2 end-2 p-1 bg-white/90 rounded-full hover:bg-white"
                        title="הסר מההשוואה"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <Link to={`/vehicle/${v.id}`} className="block hover:text-brand-700">
                      <div className="text-xs text-gray-500">{make?.name}</div>
                      <div className="font-bold text-brand-900 line-clamp-1">{v.modelName}</div>
                    </Link>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row.label} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="font-medium text-gray-700 p-3 border-b border-gray-100">
                {row.label}
              </td>
              {vehicles.map((v) => (
                <td key={v.id} className="p-3 border-b border-gray-100 text-brand-900">
                  {row.get(v)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
