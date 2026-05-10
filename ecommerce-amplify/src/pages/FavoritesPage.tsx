import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Heart } from 'lucide-react';
import { useFavorites } from '@/lib/favorites/FavoritesContext';
import { listVehiclesByIds, type Vehicle } from '@/lib/api/vehicles';
import { listMakes, type Make } from '@/lib/api/makes';
import { VehicleGrid } from '@/components/vehicle/VehicleGrid';

export function FavoritesPage() {
  const { favoriteIds } = useFavorites();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [makes, setMakes] = useState<Make[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const [vList, makesList] = await Promise.all([
          listVehiclesByIds(favoriteIds),
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
  }, [favoriteIds]);

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container-wide">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-brand-900 flex items-center gap-2">
            <Heart className="w-7 h-7 text-red-500" fill="currentColor" />
            רכבים מועדפים
          </h1>
          <p className="text-gray-600 mt-1">הרכבים ששמרת לאחר מכן.</p>
        </header>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-brand-700" />
          </div>
        ) : vehicles.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-brand-900 mb-2">עוד אין רכבים מועדפים</h2>
            <p className="text-gray-600 mb-6">
              לחץ על אייקון הלב (<Heart className="inline w-4 h-4" />) על כל רכב כדי לשמור.
            </p>
            <Link to="/inventory" className="btn-primary inline-flex">
              לקטלוג הרכבים
            </Link>
          </div>
        ) : (
          <VehicleGrid vehicles={vehicles} makes={makes} />
        )}
      </div>
    </div>
  );
}
