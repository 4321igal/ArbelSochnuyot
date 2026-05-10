import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, GitCompare, Trash2 } from 'lucide-react';
import { useCompare } from '@/lib/compare/CompareContext';
import { listVehiclesByIds, type Vehicle } from '@/lib/api/vehicles';
import { listMakes, type Make } from '@/lib/api/makes';
import { CompareTable } from '@/components/compare/CompareTable';

export function ComparePage() {
  const { vehicleIds, clear } = useCompare();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [makes, setMakes] = useState<Make[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const [vList, makesList] = await Promise.all([
          listVehiclesByIds(vehicleIds),
          listMakes(),
        ]);
        if (!cancelled) {
          setVehicles(vList);
          setMakes(makesList);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [vehicleIds]);

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container-wide">
        <header className="mb-8 flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-brand-900 flex items-center gap-2">
              <GitCompare className="w-7 h-7 text-accent-500" />
              השוואת רכבים
            </h1>
            <p className="text-gray-600 mt-1">השווה עד 3 רכבים זה לזה לפי מאפייני המפתח.</p>
          </div>
          {vehicleIds.length > 0 && (
            <button
              type="button"
              onClick={clear}
              className="btn-ghost text-sm"
            >
              <Trash2 className="w-4 h-4" />
              נקה הכל
            </button>
          )}
        </header>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-brand-700" />
          </div>
        ) : vehicles.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <GitCompare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-brand-900 mb-2">עוד אין רכבים להשוואה</h2>
            <p className="text-gray-600 mb-6">
              היכנס למלאי, סמן את אייקון ההשוואה (
              <GitCompare className="inline w-4 h-4" />
              ) על רכבים שמעניינים אותך, וחזור לכאן.
            </p>
            <Link to="/inventory" className="btn-primary inline-flex">
              לקטלוג הרכבים
            </Link>
          </div>
        ) : (
          <CompareTable vehicles={vehicles} makes={makes} />
        )}
      </div>
    </div>
  );
}
