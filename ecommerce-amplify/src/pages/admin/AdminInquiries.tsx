import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2, Phone, Mail, Search } from 'lucide-react';
import { listAllInquiries, type Inquiry, type InquiryStatus } from '@/lib/api/inquiries';

const STATUS_FILTERS: { value: InquiryStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'הכל' },
  { value: 'NEW', label: 'חדש' },
  { value: 'CONTACTED', label: 'נוצר קשר' },
  { value: 'QUALIFIED', label: 'בטיפול' },
  { value: 'CONVERTED', label: 'הומר' },
  { value: 'CLOSED_LOST', label: 'נסגר' },
];

const STATUS_CLS: Record<InquiryStatus, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  CONTACTED: 'bg-amber-100 text-amber-800',
  QUALIFIED: 'bg-indigo-100 text-indigo-800',
  CONVERTED: 'bg-green-100 text-green-800',
  CLOSED_LOST: 'bg-gray-100 text-gray-700',
};

const STATUS_LABEL: Record<InquiryStatus, string> = {
  NEW: 'חדש',
  CONTACTED: 'נוצר קשר',
  QUALIFIED: 'בטיפול',
  CONVERTED: 'הומר',
  CLOSED_LOST: 'נסגר',
};

export function AdminInquiries() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | 'ALL'>(
    (searchParams.get('status') as InquiryStatus) || 'ALL',
  );
  const [search, setSearch] = useState('');
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setIsLoading(true);
    try {
      const list = await listAllInquiries({
        status: statusFilter,
        search: search.trim() || undefined,
      });
      setInquiries(list);
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

  const handleStatusChange = (s: InquiryStatus | 'ALL') => {
    setStatusFilter(s);
    const sp = new URLSearchParams(searchParams);
    if (s === 'ALL') sp.delete('status');
    else sp.set('status', s);
    setSearchParams(sp, { replace: true });
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חפש לפי שם / טלפון / אימייל..."
            className="input pe-10"
          />
          <Search className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => handleStatusChange(s.value)}
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
        ) : inquiries.length === 0 ? (
          <p className="text-gray-500 text-center py-16">לא נמצאו פניות</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-right text-xs text-gray-500 border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 font-medium">שם</th>
                  <th className="px-4 py-3 font-medium">טלפון</th>
                  <th className="px-4 py-3 font-medium">אימייל</th>
                  <th className="px-4 py-3 font-medium">רכב</th>
                  <th className="px-4 py-3 font-medium">סטטוס</th>
                  <th className="px-4 py-3 font-medium">תאריך</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inquiries.map((i) => (
                  <tr key={i.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link to={`/admin/inquiries/${i.id}`} className="font-medium text-brand-700 hover:text-brand-800">
                        {i.fullName}
                      </Link>
                      <div className="flex gap-2 mt-1 text-xs text-gray-500">
                        {i.interestedInTestDrive && <span>נסיעת מבחן</span>}
                        {i.interestedInFinancing && <span>מימון</span>}
                        {i.tradeInDescription && <span>טרייד-אין</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <a href={`tel:${i.phone}`} className="flex items-center gap-1 text-gray-700 hover:text-brand-700">
                        <Phone className="w-3 h-3" />
                        {i.phone}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      {i.email ? (
                        <a href={`mailto:${i.email}`} className="flex items-center gap-1 text-gray-700 hover:text-brand-700 text-xs">
                          <Mail className="w-3 h-3" />
                          {i.email}
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {i.vehicleId ? (
                        <Link
                          to={`/vehicle/${i.vehicleId}`}
                          target="_blank"
                          className="text-xs text-brand-700 hover:underline"
                        >
                          רכב מסוים
                        </Link>
                      ) : (
                        <span className="text-xs text-gray-500">פנייה כללית</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${STATUS_CLS[i.status]}`}>{STATUS_LABEL[i.status]}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(i.createdAt).toLocaleDateString('he-IL')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
