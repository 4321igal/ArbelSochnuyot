import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Loader2, Save, X, Sparkles, Upload, Trash2 } from 'lucide-react';
import {
  createVehicle,
  enrichVehicle,
  getVehicle,
  updateVehicle,
  type Vehicle,
  type Transmission,
  type FuelType,
  type DriveType,
  type VehicleCondition,
  type VehicleStatus,
} from '@/lib/api/vehicles';
import { listMakes, type Make } from '@/lib/api/makes';
import { listBodyTypes, type BodyType } from '@/lib/api/bodyTypes';
import { uploadVehicleImages } from '@/lib/api/storage';
import { StorageImage } from '@/components/StorageImage';
import {
  TRANSMISSION_LABELS,
  FUEL_TYPE_LABELS,
  DRIVE_TYPE_LABELS,
  CONDITION_LABELS,
  STATUS_LABELS,
  COMMON_FEATURES,
} from '@/components/vehicle/labels';

type FormState = Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

const EMPTY: FormState = {
  makeId: '',
  modelName: '',
  year: new Date().getFullYear(),
  price: 0,
  currency: 'ILS',
  status: 'AVAILABLE',
  isFeatured: false,
  images: [],
  features: [],
};

export function AdminVehicleForm() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState<FormState>(EMPTY);
  const [makes, setMakes] = useState<Make[]>([]);
  const [bodyTypes, setBodyTypes] = useState<BodyType[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [makesList, bodyTypesList] = await Promise.all([
        listMakes(false),
        listBodyTypes(false),
      ]);
      if (cancelled) return;
      setMakes(makesList);
      setBodyTypes(bodyTypesList);

      if (isEdit && id) {
        try {
          const v = await getVehicle(id);
          if (cancelled) return;
          if (v) {
            setForm({
              ...EMPTY,
              ...v,
              images: (v.images || []).filter((i): i is string => !!i),
              features: (v.features || []).filter((f): f is string => !!f),
            });
          } else {
            setError('הרכב לא נמצא');
          }
        } catch (e) {
          if (!cancelled) setError(e instanceof Error ? e.message : 'טעינה נכשלה');
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.makeId) {
      setError('יש לבחור יצרן');
      return;
    }
    if (!form.modelName?.trim()) {
      setError('יש להזין שם דגם');
      return;
    }
    if (!form.year) {
      setError('יש להזין שנה');
      return;
    }
    if (!form.price || form.price <= 0) {
      setError('יש להזין מחיר');
      return;
    }

    setSaving(true);
    try {
      if (isEdit && id) {
        await updateVehicle(id, form);
      } else {
        const created = await createVehicle(form);
        navigate(`/admin/vehicles/${created.id}/edit`, { replace: true });
      }
      alert(isEdit ? 'הרכב עודכן' : 'הרכב נוצר');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שמירה נכשלה');
    } finally {
      setSaving(false);
    }
  };

  const handleEnrich = async () => {
    if (!isEdit || !id) {
      alert('שמור את הרכב לפני הפעלת AI');
      return;
    }
    setEnriching(true);
    try {
      const meta = await enrichVehicle(id);
      if (meta?.aiSummary) {
        if (!form.description || confirm('להחליף את התיאור הקיים בתיאור שנוצר ע"י AI?')) {
          set('description', meta.aiSummary);
        }
      } else {
        alert('AI לא הצליח להפיק תיאור');
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'AI נכשל');
    } finally {
      setEnriching(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (!isEdit || !id) {
      alert('שמור את הרכב לפני העלאת תמונות');
      return;
    }
    setUploading(true);
    try {
      const results = await uploadVehicleImages(id, files);
      const newKeys = results.map((r) => r.key);
      const updatedImages = [...(form.images || []), ...newKeys].filter((k): k is string => !!k);
      await updateVehicle(id, { images: updatedImages });
      set('images', updatedImages);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'העלאה נכשלה');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (idx: number) => {
    const next = (form.images || []).filter((_, i) => i !== idx);
    set('images', next);
  };

  const toggleFeature = (feat: string) => {
    const list = form.features || [];
    const has = list.includes(feat);
    set('features', has ? list.filter((f) => f !== feat) : [...list, feat]);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-brand-700" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-brand-900">
          {isEdit ? 'עריכת רכב' : 'רכב חדש'}
        </h2>
        <div className="flex gap-2">
          <Link to="/admin/vehicles" className="btn-secondary">
            <X className="w-4 h-4" />
            ביטול
          </Link>
          <button type="submit" disabled={saving} className="btn-accent">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'שומר...' : 'שמירה'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
          {error}
        </div>
      )}

      <Section title="מידע בסיסי">
        <Grid>
          <Field label="יצרן *">
            <select className="input" value={form.makeId} onChange={(e) => set('makeId', e.target.value)}>
              <option value="">בחר יצרן</option>
              {makes.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </Field>
          <Field label="דגם *">
            <input type="text" className="input" value={form.modelName} onChange={(e) => set('modelName', e.target.value)} />
          </Field>
          <Field label="גרסה (Trim)">
            <input type="text" className="input" value={form.trim ?? ''} onChange={(e) => set('trim', e.target.value)} />
          </Field>
          <Field label="שנה *">
            <input type="number" className="input" value={form.year} onChange={(e) => set('year', Number(e.target.value))} />
          </Field>
          <Field label="סוג מרכב">
            <select className="input" value={form.bodyTypeId ?? ''} onChange={(e) => set('bodyTypeId', e.target.value || null)}>
              <option value="">בחר סוג</option>
              {bodyTypes.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </Field>
          <Field label="מצב">
            <select className="input" value={form.condition ?? ''} onChange={(e) => set('condition', (e.target.value || null) as VehicleCondition | null)}>
              <option value="">לא צוין</option>
              {(Object.keys(CONDITION_LABELS) as VehicleCondition[]).map((c) => (
                <option key={c} value={c}>{CONDITION_LABELS[c]}</option>
              ))}
            </select>
          </Field>
          <Field label="סטטוס">
            <select className="input" value={form.status} onChange={(e) => set('status', e.target.value as VehicleStatus)}>
              {(Object.keys(STATUS_LABELS) as VehicleStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </Field>
          <Field label="סניף">
            <input type="text" className="input" value={form.branchLocation ?? ''} onChange={(e) => set('branchLocation', e.target.value)} />
          </Field>
        </Grid>
        <label className="flex items-center gap-2 mt-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isFeatured}
            onChange={(e) => set('isFeatured', e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-accent-500 focus:ring-accent-400"
          />
          <span className="text-sm">רכב מומלץ (יוצג בדף הבית)</span>
        </label>
      </Section>

      <Section title="מחיר">
        <Grid>
          <Field label="מחיר (₪) *">
            <input type="number" className="input" value={form.price || ''} onChange={(e) => set('price', Number(e.target.value))} />
          </Field>
          <Field label="מחיר מחירון (₪)">
            <input type="number" className="input" value={form.listPrice ?? ''} onChange={(e) => set('listPrice', e.target.value ? Number(e.target.value) : null)} />
          </Field>
        </Grid>
      </Section>

      <Section title="מנוע ומכניקה">
        <Grid>
          <Field label={"קילומטראז'"}>
            <input type="number" className="input" value={form.mileage ?? ''} onChange={(e) => set('mileage', e.target.value ? Number(e.target.value) : null)} />
          </Field>
          <Field label="תיבת הילוכים">
            <select className="input" value={form.transmission ?? ''} onChange={(e) => set('transmission', (e.target.value || null) as Transmission | null)}>
              <option value="">בחר</option>
              {(Object.keys(TRANSMISSION_LABELS) as Transmission[]).map((t) => (
                <option key={t} value={t}>{TRANSMISSION_LABELS[t]}</option>
              ))}
            </select>
          </Field>
          <Field label="סוג דלק">
            <select className="input" value={form.fuelType ?? ''} onChange={(e) => set('fuelType', (e.target.value || null) as FuelType | null)}>
              <option value="">בחר</option>
              {(Object.keys(FUEL_TYPE_LABELS) as FuelType[]).map((f) => (
                <option key={f} value={f}>{FUEL_TYPE_LABELS[f]}</option>
              ))}
            </select>
          </Field>
          <Field label="הנעה">
            <select className="input" value={form.driveType ?? ''} onChange={(e) => set('driveType', (e.target.value || null) as DriveType | null)}>
              <option value="">בחר</option>
              {(Object.keys(DRIVE_TYPE_LABELS) as DriveType[]).map((d) => (
                <option key={d} value={d}>{DRIVE_TYPE_LABELS[d]}</option>
              ))}
            </select>
          </Field>
          <Field label='הספק (כ"ס)'>
            <input type="number" className="input" value={form.enginePower ?? ''} onChange={(e) => set('enginePower', e.target.value ? Number(e.target.value) : null)} />
          </Field>
          <Field label='נפח מנוע (סמ"ק)'>
            <input type="number" className="input" value={form.engineCapacity ?? ''} onChange={(e) => set('engineCapacity', e.target.value ? Number(e.target.value) : null)} />
          </Field>
        </Grid>
      </Section>

      <Section title="פרטים נוספים">
        <Grid>
          <Field label="צבע חיצוני">
            <input type="text" className="input" value={form.color ?? ''} onChange={(e) => set('color', e.target.value)} />
          </Field>
          <Field label="צבע פנים">
            <input type="text" className="input" value={form.interiorColor ?? ''} onChange={(e) => set('interiorColor', e.target.value)} />
          </Field>
          <Field label="מס' דלתות">
            <input type="number" className="input" value={form.doors ?? ''} onChange={(e) => set('doors', e.target.value ? Number(e.target.value) : null)} />
          </Field>
          <Field label="מס' מושבים">
            <input type="number" className="input" value={form.seats ?? ''} onChange={(e) => set('seats', e.target.value ? Number(e.target.value) : null)} />
          </Field>
          <Field label="יד">
            <input type="number" className="input" value={form.hand ?? ''} onChange={(e) => set('hand', e.target.value ? Number(e.target.value) : null)} />
          </Field>
          <Field label="בעלים קודמים">
            <input type="number" className="input" value={form.previousOwners ?? ''} onChange={(e) => set('previousOwners', e.target.value ? Number(e.target.value) : null)} />
          </Field>
          <Field label="VIN">
            <input type="text" className="input" value={form.vin ?? ''} onChange={(e) => set('vin', e.target.value)} />
          </Field>
          <Field label="מספר רישוי">
            <input type="text" className="input" value={form.plateNumber ?? ''} onChange={(e) => set('plateNumber', e.target.value)} />
          </Field>
          <Field label="עליה לכביש">
            <input type="date" className="input" value={form.firstRegistrationDate ?? ''} onChange={(e) => set('firstRegistrationDate', e.target.value || null)} />
          </Field>
          <Field label="תוקף טסט">
            <input type="date" className="input" value={form.inspectionExpiryDate ?? ''} onChange={(e) => set('inspectionExpiryDate', e.target.value || null)} />
          </Field>
        </Grid>
        <label className="flex items-center gap-2 mt-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.accidentFree ?? false}
            onChange={(e) => set('accidentFree', e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-accent-500 focus:ring-accent-400"
          />
          <span className="text-sm">ללא תאונות</span>
        </label>
      </Section>

      <Section
        title="תיאור הרכב"
        actions={
          isEdit && (
            <button
              type="button"
              onClick={handleEnrich}
              disabled={enriching}
              className="btn-secondary text-sm"
            >
              {enriching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {enriching ? 'מפיק...' : 'הפק תיאור AI'}
            </button>
          )
        }
      >
        <textarea
          className="input"
          rows={5}
          value={form.description ?? ''}
          onChange={(e) => set('description', e.target.value)}
          placeholder="תיאור חופשי של הרכב, מצב, היסטוריה..."
        />
      </Section>

      <Section title="אבזור">
        <div className="flex flex-wrap gap-2">
          {COMMON_FEATURES.map((feat) => {
            const active = (form.features || []).includes(feat);
            return (
              <button
                key={feat}
                type="button"
                onClick={() => toggleFeature(feat)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  active
                    ? 'bg-brand-800 text-white border-brand-800'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-brand-500'
                }`}
              >
                {feat}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="תמונות">
        {!isEdit ? (
          <p className="text-sm text-gray-500">שמור את הרכב לפני העלאת תמונות.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              {(form.images || []).map((key, idx) => (
                <div key={`${key}-${idx}`} className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden group">
                  <StorageImage keyOrUrl={key} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-2 end-2 p-1.5 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white text-red-600"
                    title="הסר"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <label className="aspect-[4/3] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-brand-500 hover:text-brand-700 cursor-pointer">
                {uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 mb-1" />
                    <span className="text-xs">הוסף תמונות</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-gray-500">
              העלאות נשמרות ל-S3 ומחוברות אוטומטית לרכב. שינוי בסדר התמונות ע"י גרירה - בקרוב.
            </p>
          </>
        )}
      </Section>
    </form>
  );
}

function Section({ title, children, actions }: { title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-brand-900">{title}</h3>
        {actions}
      </div>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
