import { useMemo } from 'react';
import { Filter, X } from 'lucide-react';
import type { VehicleFilters, Transmission, FuelType } from '@/lib/api/vehicles';
import type { Make } from '@/lib/api/makes';
import type { BodyType } from '@/lib/api/bodyTypes';
import { TRANSMISSION_LABELS, FUEL_TYPE_LABELS } from './labels';

interface Props {
  filters: VehicleFilters;
  onChange: (next: VehicleFilters) => void;
  makes: Make[];
  bodyTypes: BodyType[];
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 25 }, (_, i) => CURRENT_YEAR - i);

export function VehicleFiltersPanel({ filters, onChange, makes, bodyTypes }: Props) {
  const set = <K extends keyof VehicleFilters>(key: K, value: VehicleFilters[K] | undefined) => {
    const next = { ...filters };
    if (value === undefined || value === '' || value === null) {
      delete next[key];
    } else {
      next[key] = value as VehicleFilters[K];
    }
    onChange(next);
  };

  const activeCount = useMemo(
    () =>
      Object.entries(filters).filter(
        ([k, v]) => k !== 'limit' && k !== 'nextToken' && v !== undefined && v !== '',
      ).length,
    [filters],
  );

  return (
    <aside className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-5 sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto scrollbar-thin">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-brand-900 flex items-center gap-2">
          <Filter className="w-5 h-5" />
          סינון
          {activeCount > 0 && (
            <span className="text-xs bg-accent-500 text-brand-900 px-2 py-0.5 rounded-full">
              {activeCount}
            </span>
          )}
        </h2>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => onChange({})}
            className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            איפוס
          </button>
        )}
      </div>

      <Field label="יצרן">
        <select
          className="input"
          value={filters.makeId || ''}
          onChange={(e) => set('makeId', e.target.value || undefined)}
        >
          <option value="">כל היצרנים</option>
          {makes.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </Field>

      <Field label="סוג מרכב">
        <select
          className="input"
          value={filters.bodyTypeId || ''}
          onChange={(e) => set('bodyTypeId', e.target.value || undefined)}
        >
          <option value="">כל הסוגים</option>
          {bodyTypes.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </Field>

      <Field label="שנה">
        <div className="flex gap-2">
          <select
            className="input"
            value={filters.yearFrom || ''}
            onChange={(e) => set('yearFrom', e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">משנה</option>
            {YEARS.map((y) => (<option key={y} value={y}>{y}</option>))}
          </select>
          <select
            className="input"
            value={filters.yearTo || ''}
            onChange={(e) => set('yearTo', e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">עד שנה</option>
            {YEARS.map((y) => (<option key={y} value={y}>{y}</option>))}
          </select>
        </div>
      </Field>

      <Field label="מחיר (₪)">
        <div className="flex gap-2">
          <input
            type="number"
            className="input"
            placeholder="ממחיר"
            value={filters.priceFrom ?? ''}
            onChange={(e) => set('priceFrom', e.target.value ? Number(e.target.value) : undefined)}
          />
          <input
            type="number"
            className="input"
            placeholder="עד מחיר"
            value={filters.priceTo ?? ''}
            onChange={(e) => set('priceTo', e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>
      </Field>

      <Field label={"קילומטראז' מקסימלי"}>
        <input
          type="number"
          className="input"
          placeholder='לדוגמה 100000'
          value={filters.mileageMax ?? ''}
          onChange={(e) => set('mileageMax', e.target.value ? Number(e.target.value) : undefined)}
        />
      </Field>

      <Field label="תיבת הילוכים">
        <select
          className="input"
          value={filters.transmission || ''}
          onChange={(e) => set('transmission', (e.target.value || undefined) as Transmission | undefined)}
        >
          <option value="">הכל</option>
          {(Object.keys(TRANSMISSION_LABELS) as Transmission[]).map((k) => (
            <option key={k} value={k}>{TRANSMISSION_LABELS[k]}</option>
          ))}
        </select>
      </Field>

      <Field label="סוג דלק">
        <select
          className="input"
          value={filters.fuelType || ''}
          onChange={(e) => set('fuelType', (e.target.value || undefined) as FuelType | undefined)}
        >
          <option value="">הכל</option>
          {(Object.keys(FUEL_TYPE_LABELS) as FuelType[]).map((k) => (
            <option key={k} value={k}>{FUEL_TYPE_LABELS[k]}</option>
          ))}
        </select>
      </Field>

      <Field label="יד">
        <select
          className="input"
          value={filters.hand ?? ''}
          onChange={(e) => set('hand', e.target.value ? Number(e.target.value) : undefined)}
        >
          <option value="">הכל</option>
          {[1, 2, 3, 4, 5].map((n) => (<option key={n} value={n}>יד {n}</option>))}
        </select>
      </Field>

      <label className="flex items-center gap-2 cursor-pointer text-sm">
        <input
          type="checkbox"
          checked={filters.accidentFree === true}
          onChange={(e) => set('accidentFree', e.target.checked ? true : undefined)}
          className="w-4 h-4 rounded border-gray-300 text-accent-500 focus:ring-accent-400"
        />
        <span className="text-gray-700">ללא תאונות בלבד</span>
      </label>
    </aside>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
