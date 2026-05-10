import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2, ArrowRight, Phone, Mail, Save, ExternalLink } from 'lucide-react';
import { getInquiry, updateInquiry, type Inquiry, type InquiryStatus } from '@/lib/api/inquiries';
import { getVehicle, type Vehicle } from '@/lib/api/vehicles';

const STATUS_OPTIONS: { value: InquiryStatus; label: string }[] = [
  { value: 'NEW', label: 'חדש' },
  { value: 'CONTACTED', label: 'נוצר קשר' },
  { value: 'QUALIFIED', label: 'בטיפול' },
  { value: 'CONVERTED', label: 'הומר לעסקה' },
  { value: 'CLOSED_LOST', label: 'נסגר' },
];

const CONTACT_LABEL: Record<string, string> = {
  PHONE: 'טלפון',
  EMAIL: 'אימייל',
  WHATSAPP: 'וואטסאפ',
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('he-IL', {
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

export function AdminInquiryDetail() {
  const { id } = useParams<{ id: string }>();
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<InquiryStatus>('NEW');
  const [assignedTo, setAssignedTo] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const i = await getInquiry(id);
        if (cancelled) return;
        setInquiry(i);
        if (i) {
          setStatus(i.status);
          setAssignedTo(i.assignedTo ?? '');
          setNotes(i.notes ?? '');
          if (i.vehicleId) {
            const v = await getVehicle(i.vehicleId);
            if (!cancelled) setVehicle(v);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSave = async () => {
    if (!inquiry) return;
    setSaving(true);
    try {
      const updated = await updateInquiry(inquiry.id, {
        status,
        assignedTo: assignedTo || null,
        notes: notes || null,
        lastContactedAt: status !== 'NEW' && inquiry.status === 'NEW' ? new Date().toISOString() : inquiry.lastContactedAt,
      });
      setInquiry(updated);
      alert('עודכן בהצלחה');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'עדכון נכשל');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-brand-700" />
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">הפנייה לא נמצאה</p>
        <Link to="/admin/inquiries" className="btn-primary inline-flex">חזרה לרשימה</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <Link to="/admin/inquiries" className="inline-flex items-center gap-1 text-sm text-brand-700 hover:text-brand-800">
        <ArrowRight className="w-4 h-4" />
        כל הפניות
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <h2 className="text-2xl font-bold text-brand-900">{inquiry.fullName}</h2>
              <span className="text-xs text-gray-500">התקבל ב-{formatDate(inquiry.createdAt)}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <a href={`tel:${inquiry.phone}`} className="flex items-center gap-2 text-brand-700 hover:text-brand-800 font-medium">
                <Phone className="w-4 h-4" />
                {inquiry.phone}
              </a>
              {inquiry.email && (
                <a href={`mailto:${inquiry.email}`} className="flex items-center gap-2 text-brand-700 hover:text-brand-800">
                  <Mail className="w-4 h-4" />
                  {inquiry.email}
                </a>
              )}
            </div>

            {inquiry.preferredContactMethod && (
              <p className="text-sm text-gray-600">
                דרך קשר מועדפת: <strong>{CONTACT_LABEL[inquiry.preferredContactMethod] || inquiry.preferredContactMethod}</strong>
              </p>
            )}

            {inquiry.message && (
              <div>
                <h3 className="font-bold text-brand-900 mb-1 text-sm">הודעת הפונה</h3>
                <p className="text-gray-700 text-sm whitespace-pre-line bg-gray-50 rounded-lg p-3">
                  {inquiry.message}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
              {inquiry.interestedInTestDrive && <span className="badge bg-blue-100 text-blue-800">מעוניין בנסיעת מבחן</span>}
              {inquiry.interestedInFinancing && <span className="badge bg-purple-100 text-purple-800">מעוניין במימון</span>}
              {inquiry.source && <span className="badge bg-gray-100 text-gray-700">מקור: {inquiry.source}</span>}
            </div>

            {inquiry.tradeInDescription && (
              <div>
                <h3 className="font-bold text-brand-900 mb-1 text-sm">רכב להחלפה</h3>
                <p className="text-gray-700 text-sm bg-amber-50 rounded-lg p-3">{inquiry.tradeInDescription}</p>
              </div>
            )}
          </div>

          {vehicle && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-bold text-brand-900 mb-3">רכב הפנייה</h3>
              <Link
                to={`/vehicle/${vehicle.id}`}
                target="_blank"
                className="flex items-center justify-between hover:text-brand-700"
              >
                <div>
                  <div className="font-medium">{vehicle.modelName} {vehicle.trim} ({vehicle.year})</div>
                  <div className="text-sm text-gray-600 mt-0.5">
                    ₪{vehicle.price.toLocaleString('he-IL')}
                    {vehicle.mileage != null && <span> · {vehicle.mileage.toLocaleString('he-IL')} ק"מ</span>}
                  </div>
                </div>
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        <aside className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 lg:sticky lg:top-4 lg:self-start">
          <h3 className="font-bold text-brand-900">ניהול הפנייה</h3>

          <div>
            <label className="label">סטטוס</label>
            <select
              className="input"
              value={status}
              onChange={(e) => setStatus(e.target.value as InquiryStatus)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">שיוך לאיש מכירות</label>
            <input
              type="text"
              className="input"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="שם / אימייל"
            />
          </div>

          <div>
            <label className="label">הערות פנימיות</label>
            <textarea
              className="input"
              rows={5}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="הערות שיראו רק עובדי הסוכנות..."
            />
          </div>

          {inquiry.lastContactedAt && (
            <p className="text-xs text-gray-500">
              נוצר קשר אחרון: {formatDate(inquiry.lastContactedAt)}
            </p>
          )}

          <button type="button" onClick={handleSave} disabled={saving} className="btn-accent w-full">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'שומר...' : 'שמור שינויים'}
          </button>
        </aside>
      </div>
    </div>
  );
}
