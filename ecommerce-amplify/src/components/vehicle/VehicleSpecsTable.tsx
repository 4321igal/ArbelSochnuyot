import type { Vehicle } from '@/lib/api/vehicles';
import { TRANSMISSION_LABELS, FUEL_TYPE_LABELS, DRIVE_TYPE_LABELS, CONDITION_LABELS } from './labels';

interface Props {
  vehicle: Vehicle;
}

interface Row {
  label: string;
  value: string | number | null | undefined;
}

function formatKm(km?: number | null): string | null {
  if (km == null) return null;
  return `${km.toLocaleString('he-IL')} ק"מ`;
}

function formatDate(date?: string | null): string | null {
  if (!date) return null;
  try {
    return new Date(date).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
    });
  } catch {
    return date;
  }
}

export function VehicleSpecsTable({ vehicle }: Props) {
  const rows: Row[] = [
    { label: 'שנת ייצור', value: vehicle.year },
    { label: 'קילומטראז\'', value: formatKm(vehicle.mileage) },
    { label: 'תיבת הילוכים', value: vehicle.transmission ? TRANSMISSION_LABELS[vehicle.transmission] : null },
    { label: 'סוג דלק', value: vehicle.fuelType ? FUEL_TYPE_LABELS[vehicle.fuelType] : null },
    { label: 'הנעה', value: vehicle.driveType ? DRIVE_TYPE_LABELS[vehicle.driveType] : null },
    { label: 'הספק מנוע', value: vehicle.enginePower ? `${vehicle.enginePower} כ"ס` : null },
    { label: 'נפח מנוע', value: vehicle.engineCapacity ? `${vehicle.engineCapacity.toLocaleString('he-IL')} סמ"ק` : null },
    { label: 'מצב', value: vehicle.condition ? CONDITION_LABELS[vehicle.condition] : null },
    { label: 'יד', value: vehicle.hand },
    { label: 'בעלים קודמים', value: vehicle.previousOwners },
    { label: 'צבע חיצוני', value: vehicle.color },
    { label: 'צבע פנים', value: vehicle.interiorColor },
    { label: 'מספר דלתות', value: vehicle.doors },
    { label: 'מספר מושבים', value: vehicle.seats },
    { label: 'ללא תאונות', value: vehicle.accidentFree == null ? null : vehicle.accidentFree ? 'כן' : 'לא' },
    { label: 'תוקף טסט', value: formatDate(vehicle.inspectionExpiryDate) },
    { label: 'עליה לכביש', value: formatDate(vehicle.firstRegistrationDate) },
    { label: 'מספר רישוי', value: vehicle.plateNumber },
    { label: 'סניף', value: vehicle.branchLocation },
  ].filter((r) => r.value != null && r.value !== '');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <h3 className="bg-brand-50 px-4 py-3 font-bold text-brand-900 border-b border-gray-200">
        מפרט הרכב
      </h3>
      <dl className="divide-y divide-gray-100">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-2 gap-4 px-4 py-2.5 text-sm">
            <dt className="text-gray-600">{row.label}</dt>
            <dd className="font-medium text-brand-900">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
