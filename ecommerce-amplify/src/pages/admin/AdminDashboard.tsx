import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Car, Phone, Plus, AlertCircle, Loader2 } from 'lucide-react';
import { listVehicles } from '@/lib/api/vehicles';
import { listAllInquiries, type Inquiry, type InquiryStatus } from '@/lib/api/inquiries';

const STATUS_LABEL: Record<InquiryStatus, { label: string; cls: string }> = {
  NEW: { label: 'חדש', cls: 'bg-blue-100 text-blue-800' },
  CONTACTED: { label: 'נוצר קשר', cls: 'bg-amber-100 text-amber-800' },
  QUALIFIED: { label: 'בטיפול', cls: 'bg-indigo-100 text-indigo-800' },
  CONVERTED: { label: 'הומר', cls: 'bg-green-100 text-green-800' },
  CLOSED_LOST: { label: 'נסגר', cls: 'bg-gray-100 text-gray-700' },
};

function isThisMonth(iso: string): boolean {
  try {
    const d = new Date(iso);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  } catch {
    return false;
  }
}

export function AdminDashboard() {
  const [stats, setStats] = useState({
    activeVehicles: 0,
    newInquiries: 0,
    monthlyInquiries: 0,
    convertedInquiries: 0,
  });
  const [recentInquiries, setRecentInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const [vehiclesResult, allInquiries] = await Promise.all([
          listVehicles({ status: 'AVAILABLE', limit: 200 }),
          listAllInquiries(),
        ]);
        if (cancelled) return;
        setStats({
          activeVehicles: vehiclesResult.items.length,
          newInquiries: allInquiries.filter((i) => i.status === 'NEW').length,
          monthlyInquiries: allInquiries.filter((i) => isThisMonth(i.createdAt)).length,
          convertedInquiries: allInquiries.filter((i) => i.status === 'CONVERTED').length,
        });
        setRecentInquiries(allInquiries.slice(0, 8));
      } catch (e) {
        console.error('Failed to load dashboard:', e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="רכבים זמינים"
          value={isLoading ? '...' : stats.activeVehicles}
          icon={<Car className="w-6 h-6" />}
          color="bg-brand-100 text-brand-700"
          link="/admin/vehicles"
        />
        <StatCard
          label="פניות חדשות"
          value={isLoading ? '...' : stats.newInquiries}
          icon={<AlertCircle className="w-6 h-6" />}
          color="bg-amber-100 text-amber-700"
          link="/admin/inquiries?status=NEW"
        />
        <StatCard
          label="פניות החודש"
          value={isLoading ? '...' : stats.monthlyInquiries}
          icon={<Phone className="w-6 h-6" />}
          color="bg-blue-100 text-blue-700"
          link="/admin/inquiries"
        />
        <StatCard
          label="הומרו לעסקה"
          value={isLoading ? '...' : stats.convertedInquiries}
          icon={<Phone className="w-6 h-6" />}
          color="bg-green-100 text-green-700"
          link="/admin/inquiries?status=CONVERTED"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-brand-900 mb-4">פעולות מהירות</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/vehicles/new" className="btn-accent">
            <Plus className="w-4 h-4" />
            הוסף רכב
          </Link>
          <Link to="/admin/inquiries?status=NEW" className="btn-secondary">
            פניות חדשות לטיפול
          </Link>
          <Link to="/admin/makes" className="btn-secondary">
            ניהול יצרנים
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-brand-900">פניות אחרונות</h2>
          <Link to="/admin/inquiries" className="text-brand-700 hover:text-brand-800 text-sm font-medium">
            הצג הכל ←
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-brand-700" />
          </div>
        ) : recentInquiries.length === 0 ? (
          <p className="text-gray-500 text-center py-10">עדיין לא התקבלו פניות</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-right text-xs text-gray-500 border-b border-gray-100">
                <th className="px-6 py-3 font-medium">שם</th>
                <th className="px-6 py-3 font-medium">טלפון</th>
                <th className="px-6 py-3 font-medium">סטטוס</th>
                <th className="px-6 py-3 font-medium">תאריך</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentInquiries.map((i) => (
                <tr key={i.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <Link to={`/admin/inquiries/${i.id}`} className="text-brand-700 hover:text-brand-800 font-medium">
                      {i.fullName}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-gray-700">
                    <a href={`tel:${i.phone}`} className="hover:text-brand-700">{i.phone}</a>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`badge ${STATUS_LABEL[i.status].cls}`}>
                      {STATUS_LABEL[i.status].label}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-500 text-xs">
                    {new Date(i.createdAt).toLocaleDateString('he-IL')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  link,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  link?: string;
}) {
  const inner = (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-brand-900">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>{icon}</div>
      </div>
    </div>
  );
  return link ? <Link to={link}>{inner}</Link> : inner;
}
