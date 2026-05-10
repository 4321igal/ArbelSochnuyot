import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { listVehicles, type Vehicle } from '@/lib/api/vehicles';
import { listMakes, type Make } from '@/lib/api/makes';
import { VehicleGrid } from '@/components/vehicle/VehicleGrid';

const SEARCH_DEBOUNCE_MS = 300;

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [inputValue, setInputValue] = useState(query);
  const [debounced, setDebounced] = useState(query);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [makes, setMakes] = useState<Make[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    listMakes().then(setMakes).catch(() => undefined);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(inputValue), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [inputValue]);

  useEffect(() => {
    if (debounced.trim() !== query) {
      const sp = new URLSearchParams(searchParams);
      if (debounced.trim()) sp.set('q', debounced.trim());
      else sp.delete('q');
      setSearchParams(sp, { replace: true });
    }
  }, [debounced]);

  useEffect(() => {
    if (!debounced.trim()) {
      setVehicles([]);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      try {
        const result = await listVehicles({ search: debounced.trim(), limit: 60 });
        if (!cancelled) setVehicles(result.items);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  return (
    <div className="container-wide py-8 min-h-screen">
      <h1 className="text-3xl font-bold text-brand-900 mb-2">חיפוש רכבים</h1>

      <div className="relative max-w-2xl mb-6">
        <input
          type="search"
          autoFocus
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="חפש לפי דגם, גרסה, אבזור..."
          className="input pe-12 text-base"
        />
        <Search className="absolute end-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      </div>

      <p className="text-gray-600 mb-6 text-sm">
        {!debounced.trim()
          ? 'התחל להקליד כדי לחפש'
          : isLoading
          ? 'מחפש...'
          : `${vehicles.length} תוצאות עבור "${debounced}"`}
      </p>

      {debounced.trim() && (
        <VehicleGrid
          vehicles={vehicles}
          makes={makes}
          emptyMessage={isLoading ? 'מחפש...' : `לא נמצאו רכבים עבור "${debounced}"`}
        />
      )}
    </div>
  );
}
