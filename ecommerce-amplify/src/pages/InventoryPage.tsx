import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, SlidersHorizontal, X } from 'lucide-react';
import { listVehicles, type Vehicle, type VehicleFilters, type VehicleSortBy } from '@/lib/api/vehicles';
import { listMakes, type Make } from '@/lib/api/makes';
import { listBodyTypes, type BodyType } from '@/lib/api/bodyTypes';
import { VehicleGrid } from '@/components/vehicle/VehicleGrid';
import { VehicleFiltersPanel } from '@/components/vehicle/VehicleFilters';
import { CompareBar } from '@/components/compare/CompareBar';

const SORT_OPTIONS: { value: VehicleSortBy; label: string }[] = [
  { value: 'newest', label: 'נוסף לאחרונה' },
  { value: 'priceAsc', label: 'מחיר: מהנמוך לגבוה' },
  { value: 'priceDesc', label: 'מחיר: מהגבוה לנמוך' },
  { value: 'yearDesc', label: 'שנה: מהחדש לישן' },
  { value: 'yearAsc', label: 'שנה: מהישן לחדש' },
  { value: 'mileageAsc', label: 'ק"מ: נמוך לגבוה' },
];

export function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<VehicleFilters>({});
  const [sortBy, setSortBy] = useState<VehicleSortBy>('newest');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [makes, setMakes] = useState<Make[]>([]);
  const [bodyTypes, setBodyTypes] = useState<BodyType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [makesList, bodyTypesList] = await Promise.all([
        listMakes().catch(() => []),
        listBodyTypes().catch(() => []),
      ]);
      if (!cancelled) {
        setMakes(makesList);
        setBodyTypes(bodyTypesList);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const makeSlug = searchParams.get('make');
    if (makeSlug && makes.length) {
      const make = makes.find((m) => m.slug === makeSlug);
      if (make && filters.makeId !== make.id) {
        setFilters((f) => ({ ...f, makeId: make.id }));
      }
    }
  }, [searchParams, makes]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const result = await listVehicles({ ...filters, sortBy, limit: 60 });
        if (!cancelled) setVehicles(result.items);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filters, sortBy]);

  const handleFiltersChange = (next: VehicleFilters) => {
    setFilters(next);
    if (!next.makeId) {
      const sp = new URLSearchParams(searchParams);
      sp.delete('make');
      setSearchParams(sp, { replace: true });
    } else {
      const make = makes.find((m) => m.id === next.makeId);
      if (make) {
        const sp = new URLSearchParams(searchParams);
        sp.set('make', make.slug);
        setSearchParams(sp, { replace: true });
      }
    }
  };

  const activeFilterCount = useMemo(
    () =>
      Object.entries(filters).filter(
        ([k, v]) => k !== 'limit' && k !== 'nextToken' && v !== undefined && v !== '',
      ).length,
    [filters],
  );

  return (
    <div className="bg-gray-50 min-h-screen pb-32">
      <div className="container-wide py-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-brand-900">מלאי הרכבים</h1>
            <p className="text-gray-600 mt-1 text-sm">
              {isLoading ? 'טוען...' : `${vehicles.length} רכבים זמינים`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden btn-secondary text-sm flex items-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              סינון
              {activeFilterCount > 0 && (
                <span className="bg-accent-500 text-brand-900 text-xs font-bold px-1.5 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as VehicleSortBy)}
              className="input text-sm py-2"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <div className="hidden lg:block">
            <VehicleFiltersPanel
              filters={filters}
              onChange={handleFiltersChange}
              makes={makes}
              bodyTypes={bodyTypes}
            />
          </div>

          <div>
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-brand-700" />
              </div>
            ) : (
              <VehicleGrid
                vehicles={vehicles}
                makes={makes}
                emptyMessage={
                  activeFilterCount > 0
                    ? 'לא נמצאו רכבים בסינון הנוכחי'
                    : 'עדיין לא נוספו רכבים. בדוק שוב בקרוב.'
                }
              />
            )}
          </div>
        </div>
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileFiltersOpen(false)}
            aria-label="סגור"
          />
          <aside className="absolute end-0 top-0 h-full w-[90%] max-w-sm bg-white overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-brand-900">סינון</h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <VehicleFiltersPanel
              filters={filters}
              onChange={handleFiltersChange}
              makes={makes}
              bodyTypes={bodyTypes}
            />
          </aside>
        </div>
      )}

      <CompareBar />
    </div>
  );
}
