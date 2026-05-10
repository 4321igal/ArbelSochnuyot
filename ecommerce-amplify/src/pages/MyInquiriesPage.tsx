import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Phone, Calendar, Car } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { listMyInquiries, type Inquiry, type InquiryStatus } from '@/lib/api/inquiries';

const STATUS_LABELS: Record<InquiryStatus, { label: string; cls: string }> = {
  NEW: { label: 'נשלח', cls: 'bg-blue-100 text-blue-800' },
  CONTACTED: { label: 'נוצר קשר', cls: 'bg-amber-100 text-amber-800' },
  QUALIFIED: { label: 'בטיפול', cls: 'bg-indigo-100 text-indigo-800' },
  CONVERTED: { label: 'הומר לעסקה', cls: 'bg-green-100 text-green-800' },
  CLOSED_LOST: { label: 'נסגר', cls: 'bg-gray-100 text-gray-700' },
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function MyInquiriesPage() {
  const { userId } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const list = await listMyInquiries(userId);
        if (!cancelled) setInquiries(list);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container-narrow">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-brand-900 flex items-center gap-2">
            <Phone className="w-7 h-7 text-accent-500" />
            הפניות שלי
          </h1>
          <p className="text-gray-600 mt-1">מעקב אחר הפניות ששלחת לסוכנות.</p>
        </header>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-brand-700" />
          </div>
        ) : inquiries.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Phone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-brand-900 mb-2">עדיין לא יצרת פנייה</h2>
            <p className="text-gray-600 mb-6">
              עיין במלאי הרכבים והשאר פרטים על רכב שמעניין אותך.
            </p>
            <Link to="/inventory" className="btn-primary inline-flex">
              לקטלוג הרכבים
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {inquiries.map((i) => (
              <article
                key={i.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <span className={`badge ${STATUS_LABELS[i.status].cls}`}>
                      {STATUS_LABELS[i.status].label}
                    </span>
                    {i.vehicleId ? (
                      <Link
                        to={`/vehicle/${i.vehicleId}`}
                        className="block mt-2 font-bold text-brand-900 hover:text-brand-700 flex items-center gap-2"
                      >
                        <Car className="w-4 h-4" />
                        פנייה לגבי רכב מסוים
                      </Link>
                    ) : (
                      <h3 className="mt-2 font-bold text-brand-900">פנייה כללית</h3>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(i.createdAt)}
                  </div>
                </div>
                {i.message && (
                  <p className="mt-3 text-gray-700 text-sm leading-relaxed">{i.message}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-600">
                  {i.interestedInTestDrive && <span>✓ נסיעת מבחן</span>}
                  {i.interestedInFinancing && <span>✓ מעוניין במימון</span>}
                  {i.tradeInDescription && <span>✓ רכב להחלפה</span>}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
