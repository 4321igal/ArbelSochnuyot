import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Loader2, Search, Star } from 'lucide-react';
import { listVehicles, deleteVehicle, updateVehicle, type Vehicle, type VehicleStatus } from '@/lib/api/vehicles';
import { listMakes, type Make } from '@/lib/api/makes';
import { StorageImage } from '@/components/StorageImage';
import { STATUS_LABELS } from '@/components/vehicle/labels';

const STATUS_FILTERS: { value: VehicleStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'הכל' },
  { value: 'AVAILABLE', label: 'זמין' },
  { value: 'RESERVED', label: 'שמור' },
  { value: 'SOLD', label: 'נמכר' },
  { value: 'HIDDEN', label: 'מוסתר' },
];

function formatPrice(p: number): string {
  return `₪${p.toLocaleString('he-IL')}`;
}

export function AdminVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [makes, setMakes] = useState<Make[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const [vehiclesResult, makesList] = await Promise.all([
        listVehicles({ status: statusFilter, search: search.trim() || undefined, limit: 200 }),
        listMakes(false),
      ]);
      setVehicles(vehiclesResult.items);
      setMakes(makesList);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [statusFilter]);

  useEffect(() => {
    const t = setTimeout(load, 400);
    return () => clearTimeout(t);
  }, [search]);

  const makeById = new Map(makes.map((m) => [m.id, m] as const));

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`למחוק את ${label} לצמיתות? פעולה זו לא הפיכה.`)) return;
    setBusyId(id);
    try {
      await deleteVehicle(id);
      setVehicles((arr) => arr.filter((v) => v.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'מחיקה נכשלה');
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleFeatured = async (v: Vehicle) => {
    setBusyId(v.id);
    try {
      const updated = await updateVehicle(v.id, { isFeatured: !v.isFeatured });
      setVehicles((arr) => arr.map((it) => (it.id === v.id ? updated : it)));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'עדכון נכשל');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-sm text-gray-500">{vehicles.length} רכבים</h2>
        </div>
        <Link to="/admin/vehicles/new" className="btn-accent">
          <Plus className="w-4 h-4" />
          הוסף רכב חדש
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חפש לפי דגם / גרסה / תיאור..."
            className="input pe-10"
          />
          <Search className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setStatusFilter(s.value)}
              className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
                statusFilter === s.value
                  ? 'bg-brand-800 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-brand-700" />
          </div>
        ) : vehicles.length === 0 ? (
          <p className="text-gray-500 text-center py-16">לא נמצאו רכבים</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-right text-xs text-gray-500 border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 font-medium">תמונה</th>
                  <th className="px-4 py-3 font-medium">רכב</th>
                  <th className="px-4 py-3 font-medium">שנה</th>
                  <th className="px-4 py-3 font-medium">ק"מ</th>
                  <th className="px-4 py-3 font-medium">מחיר</th>
                  <th className="px-4 py-3 font-medium">סטטוס</th>
                  <th className="px-4 py-3 font-medium">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vehicles.map((v) => {
                  const make = makeById.get(v.makeId);
                  return (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 w-20">
                        <div className="w-16 h-12 bg-gray-100 rounded overflow-hidden">
                          <StorageImage
                            keyOrUrl={v.images?.[0]}
                            alt={v.modelName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <Link
                          to={`/admin/vehicles/${v.id}/edit`}
                          className="font-medium text-brand-900 hover:text-brand-700"
                        >
                          {make?.name} {v.modelName}
                          {v.trim && <span className="font-normal text-gray-600"> {v.trim}</span>}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-gray-700">{v.year}</td>
                      <td className="px-4 py-2 text-gray-700">
                        {v.mileage != null ? v.mileage.toLocaleString('he-IL') : '—'}
                      </td>
                      <td className="px-4 py-2 font-medium text-brand-900">{formatPrice(v.price)}</td>
                      <td className="px-4 py-2">
                        <span className="badge bg-gray-100 text-gray-800">
                          {STATUS_LABELS[v.status]}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleFeatured(v)}
                            disabled={busyId === v.id}
                            className={`p-1.5 rounded hover:bg-gray-200 ${
                              v.isFeatured ? 'text-accent-500' : 'text-gray-400'
                            }`}
                            title={v.isFeatured ? 'הסר מהמומלצים' : 'הוסף למומלצים'}
                          >
                            <Star className="w-4 h-4" fill={v.isFeatured ? 'currentColor' : 'none'} />
                          </button>
                          <Link
                            to={`/admin/vehicles/${v.id}/edit`}
                            className="p-1.5 rounded hover:bg-gray-200 text-gray-600"
                            title="עריכה"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(v.id, `${make?.name ?? ''} ${v.modelName}`.trim())}
                            disabled={busyId === v.id}
                            className="p-1.5 rounded hover:bg-red-50 text-red-600"
                            title="מחק"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
