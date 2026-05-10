import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Heart, GitCompare, Calendar, Gauge, Settings2, Fuel } from 'lucide-react';
import { StorageImage } from '@/components/StorageImage';
import { useFavorites } from '@/lib/favorites/FavoritesContext';
import { useCompare } from '@/lib/compare/CompareContext';
import type { Vehicle } from '@/lib/api/vehicles';
import type { Make } from '@/lib/api/makes';
import { TRANSMISSION_LABELS, FUEL_TYPE_LABELS } from './labels';

interface VehicleCardProps {
  vehicle: Vehicle;
  make?: Make;
}

function formatPrice(price: number): string {
  return `₪${price.toLocaleString('he-IL')}`;
}

function formatMileage(km?: number | null): string {
  if (km == null) return '—';
  return `${km.toLocaleString('he-IL')} ק"מ`;
}

function VehicleCardInner({ vehicle, make }: VehicleCardProps) {
  const favorites = useFavorites();
  const compare = useCompare();
  const isFav = favorites.has(vehicle.id);
  const inCompare = compare.has(vehicle.id);

  const conditionBadge = (() => {
    switch (vehicle.condition) {
      case 'NEW':
        return { label: 'חדש', cls: 'bg-green-100 text-green-800' };
      case 'DEMO':
        return { label: 'דמו', cls: 'bg-blue-100 text-blue-800' };
      case 'USED':
        return { label: 'יד 2', cls: 'bg-amber-100 text-amber-800' };
      default:
        return null;
    }
  })();

  const handleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    favorites.toggle(vehicle.id);
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCompare) compare.remove(vehicle.id);
    else compare.add(vehicle.id);
  };

  return (
    <Link
      to={`/vehicle/${vehicle.id}`}
      className="group block bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden border border-gray-200"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <StorageImage
          keyOrUrl={vehicle.images?.[0]}
          alt={`${make?.name ?? ''} ${vehicle.modelName}`.trim()}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {conditionBadge && (
          <span className={`absolute top-3 start-3 ${conditionBadge.cls} text-xs font-bold px-2.5 py-1 rounded-full`}>
            {conditionBadge.label}
          </span>
        )}

        <div className="absolute top-3 end-3 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleFav}
            className={`p-2 rounded-full bg-white/90 backdrop-blur-sm shadow hover:bg-white transition-colors ${
              isFav ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
            }`}
            title={isFav ? 'הסר מהמועדפים' : 'הוסף למועדפים'}
            aria-label="מועדפים"
          >
            <Heart className="w-4 h-4" fill={isFav ? 'currentColor' : 'none'} />
          </button>
          <button
            type="button"
            onClick={handleCompare}
            disabled={!inCompare && compare.isFull}
            className={`p-2 rounded-full bg-white/90 backdrop-blur-sm shadow hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              inCompare ? 'text-brand-800' : 'text-gray-600 hover:text-brand-800'
            }`}
            title={inCompare ? 'הסר מהשוואה' : 'הוסף להשוואה'}
            aria-label="השוואה"
          >
            <GitCompare className="w-4 h-4" />
          </button>
        </div>

        {vehicle.status === 'SOLD' && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="bg-white text-brand-900 font-bold text-lg px-4 py-2 rounded-lg">נמכר</span>
          </div>
        )}
        {vehicle.status === 'RESERVED' && (
          <div className="absolute bottom-3 start-3 bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded">
            שמור
          </div>
        )}
      </div>

      <div className="p-4">
        {make && (
          <p className="text-xs text-gray-500 font-medium mb-1">{make.name}</p>
        )}

        <h3 className="font-bold text-brand-900 text-lg leading-tight group-hover:text-brand-700 transition-colors line-clamp-1">
          {vehicle.modelName}
          {vehicle.trim && <span className="font-normal text-gray-700"> {vehicle.trim}</span>}
        </h3>

        <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-brand-500" />
            <span>{vehicle.year}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-brand-500" />
            <span>{formatMileage(vehicle.mileage)}</span>
          </div>
          {vehicle.transmission && (
            <div className="flex items-center gap-1.5">
              <Settings2 className="w-3.5 h-3.5 text-brand-500" />
              <span>{TRANSMISSION_LABELS[vehicle.transmission]}</span>
            </div>
          )}
          {vehicle.fuelType && (
            <div className="flex items-center gap-1.5">
              <Fuel className="w-3.5 h-3.5 text-brand-500" />
              <span>{FUEL_TYPE_LABELS[vehicle.fuelType]}</span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 flex items-end justify-between">
          <div>
            {vehicle.listPrice && vehicle.listPrice > vehicle.price && (
              <div className="text-xs text-gray-400 line-through">
                {formatPrice(vehicle.listPrice)}
              </div>
            )}
            <div className="text-xl font-bold text-brand-900">
              {formatPrice(vehicle.price)}
            </div>
          </div>
          {vehicle.hand != null && (
            <span className="text-xs text-gray-500">יד {vehicle.hand}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export const VehicleCard = memo(VehicleCardInner);
