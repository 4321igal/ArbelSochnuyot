import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, Phone, MessageSquare, GitCompare, Heart, ShieldCheck, MapPin, Calendar } from 'lucide-react';
import { getVehicle, getVehicleSearchMeta, type Vehicle, type VehicleSearchMeta } from '@/lib/api/vehicles';
import { getMake, type Make } from '@/lib/api/makes';
import { VehicleGallery } from '@/components/vehicle/VehicleGallery';
import { VehicleSpecsTable } from '@/components/vehicle/VehicleSpecsTable';
import { FinanceCalculator } from '@/components/finance/FinanceCalculator';
import { InquiryDrawer } from '@/components/inquiry/InquiryDrawer';
import { CompareBar } from '@/components/compare/CompareBar';
import { useFavorites } from '@/lib/favorites/FavoritesContext';
import { useCompare } from '@/lib/compare/CompareContext';
import { CONDITION_LABELS } from '@/components/vehicle/labels';

function formatPrice(p: number): string {
  return `₪${p.toLocaleString('he-IL')}`;
}

export function VehiclePage() {
  const { id } = useParams<{ id: string }>();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [make, setMake] = useState<Make | null>(null);
  const [searchMeta, setSearchMeta] = useState<VehicleSearchMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inquiryOpen, setInquiryOpen] = useState(false);

  const favorites = useFavorites();
  const compare = useCompare();

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const v = await getVehicle(id);
        if (cancelled) return;
        setVehicle(v);
        if (v) {
          const [m, sm] = await Promise.all([
            v.makeId ? getMake(v.makeId) : Promise.resolve(null),
            getVehicleSearchMeta(v.id).catch(() => null),
          ]);
          if (!cancelled) {
            setMake(m);
            setSearchMeta(sm);
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-brand-700" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="container-narrow py-20 text-center">
        <h1 className="text-2xl font-bold text-brand-900 mb-2">הרכב לא נמצא</h1>
        <p className="text-gray-600 mb-6">ייתכן שהרכב נמכר או הוסר מהמלאי.</p>
        <Link to="/inventory" className="btn-primary inline-flex">חזרה למלאי</Link>
      </div>
    );
  }

  const images = (vehicle.images || []).filter((i): i is string => !!i);
  const features = (vehicle.features || []).filter((f): f is string => !!f);
  const isFav = favorites.has(vehicle.id);
  const inCompare = compare.has(vehicle.id);

  const vehicleLabel = `${make?.name ?? ''} ${vehicle.modelName} ${vehicle.year}`.trim();
  const discount = vehicle.listPrice && vehicle.listPrice > vehicle.price
    ? Math.round((1 - vehicle.price / vehicle.listPrice) * 100)
    : 0;

  return (
    <div className="bg-gray-50 min-h-screen pb-32">
      <div className="container-wide py-6">
        <nav className="text-sm text-gray-500 mb-4 flex items-center gap-1">
          <Link to="/" className="hover:text-brand-700">בית</Link>
          <span>/</span>
          <Link to="/inventory" className="hover:text-brand-700">מלאי</Link>
          <span>/</span>
          <span className="text-brand-900 truncate">{vehicleLabel}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
          <div className="space-y-6">
            <VehicleGallery images={images} alt={vehicleLabel} />

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  {make && (
                    <p className="text-sm text-gray-500 font-medium">{make.name}</p>
                  )}
                  <h1 className="text-3xl font-bold text-brand-900 mt-1">
                    {vehicle.modelName}
                    {vehicle.trim && <span className="text-gray-700 font-normal"> {vehicle.trim}</span>}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {vehicle.year}
                    </span>
                    {vehicle.condition && (
                      <span className="badge bg-gray-100 text-gray-800">
                        {CONDITION_LABELS[vehicle.condition]}
                      </span>
                    )}
                    {vehicle.branchLocation && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {vehicle.branchLocation}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => favorites.toggle(vehicle.id)}
                    className={`p-2 rounded-full border transition-colors ${
                      isFav ? 'bg-red-50 border-red-200 text-red-500' : 'border-gray-300 text-gray-600 hover:text-red-500'
                    }`}
                    aria-label="מועדפים"
                  >
                    <Heart className="w-5 h-5" fill={isFav ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    type="button"
                    onClick={() => (inCompare ? compare.remove(vehicle.id) : compare.add(vehicle.id))}
                    disabled={!inCompare && compare.isFull}
                    className={`p-2 rounded-full border transition-colors disabled:opacity-50 ${
                      inCompare ? 'bg-brand-50 border-brand-200 text-brand-800' : 'border-gray-300 text-gray-600 hover:text-brand-800'
                    }`}
                    aria-label="השוואה"
                  >
                    <GitCompare className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {searchMeta?.aiSummary && (
                <div className="mt-5 bg-brand-50 border border-brand-100 rounded-lg p-4">
                  <p className="text-brand-900 leading-relaxed">{searchMeta.aiSummary}</p>
                </div>
              )}

              {searchMeta?.aiHighlights && searchMeta.aiHighlights.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-bold text-brand-900 mb-2 text-sm">נקודות חוזק</h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                    {searchMeta.aiHighlights.map((h, idx) => (
                      h && (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <ShieldCheck className="w-4 h-4 text-accent-500 shrink-0 mt-0.5" />
                          <span>{h}</span>
                        </li>
                      )
                    ))}
                  </ul>
                </div>
              )}

              {vehicle.description && (
                <div className="mt-5 pt-5 border-t border-gray-100">
                  <h3 className="font-bold text-brand-900 mb-2">תיאור הרכב</h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{vehicle.description}</p>
                </div>
              )}
            </div>

            <VehicleSpecsTable vehicle={vehicle} />

            {features.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <h3 className="bg-brand-50 px-4 py-3 font-bold text-brand-900 border-b border-gray-200">
                  אבזור ותכונות
                </h3>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {features.map((f, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-500" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <FinanceCalculator initialPrice={vehicle.price} />
          </div>

          <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              {discount > 0 && (
                <div className="text-xs text-red-600 font-bold mb-1">חיסכון של {discount}%</div>
              )}
              {vehicle.listPrice && vehicle.listPrice > vehicle.price && (
                <div className="text-sm text-gray-400 line-through mb-1">
                  מחיר מחירון: {formatPrice(vehicle.listPrice)}
                </div>
              )}
              <div className="text-4xl font-bold text-brand-900">{formatPrice(vehicle.price)}</div>
              <div className="text-xs text-gray-500 mt-1">המחיר כולל מע"מ • ללא העברת בעלות</div>

              <div className="mt-5 space-y-2">
                <button
                  type="button"
                  onClick={() => setInquiryOpen(true)}
                  className="btn-accent w-full text-base py-3"
                >
                  <MessageSquare className="w-4 h-4" />
                  צור קשר על הרכב
                </button>
                <a href="tel:+972-3-1234567" className="btn-secondary w-full text-base py-3">
                  <Phone className="w-4 h-4" />
                  התקשר עכשיו
                </a>
              </div>

              <div className="mt-5 pt-5 border-t border-gray-100 space-y-2.5 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  <span>בדיקת רכב מקצועית בוצעה</span>
                </div>
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  <span>אופציה לאחריות מורחבת</span>
                </div>
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  <span>מימון בתנאים מצוינים</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <InquiryDrawer
        open={inquiryOpen}
        onClose={() => setInquiryOpen(false)}
        vehicleId={vehicle.id}
        vehicleLabel={vehicleLabel}
        source="VEHICLE_PAGE"
      />
      <CompareBar />
    </div>
  );
}
