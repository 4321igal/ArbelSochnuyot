import { Section, Grid, Field } from '../../FormPrimitives';
import type { StepProps } from '../types';
import type { VehicleStatus } from '@/lib/api/vehicles';
import { STATUS_LABELS } from '@/components/vehicle/labels';
import { StorageImage } from '@/components/StorageImage';
import type { Make } from '@/lib/api/makes';
import type { BodyType } from '@/lib/api/bodyTypes';

interface Props extends StepProps {
  makes: Make[];
  bodyTypes: BodyType[];
}

const formatPrice = (n?: number | null) =>
  n != null ? new Intl.NumberFormat('he-IL').format(n) : '—';

export function Step6Pricing({ data, stepErrors, setField, makes, bodyTypes }: Props) {
  const make = makes.find((m) => m.id === data.makeId);
  const bodyType = bodyTypes.find((b) => b.id === data.bodyTypeId);
  const images = (data.images ?? []).filter((k): k is string => !!k);
  const primaryImage = images[0];

  return (
    <>
      <Section title="מחיר ופרסום">
        <Grid>
          <Field label="מחיר (₪) *" error={stepErrors.price}>
            <input
              type="number"
              className="input"
              value={data.price || ''}
              onChange={(e) => setField('price', Number(e.target.value))}
              min={0}
            />
          </Field>

          <Field label="מחיר מחירון (₪)" hint="אופציונלי - מחיר ליסט להשוואה">
            <input
              type="number"
              className="input"
              value={data.listPrice ?? ''}
              onChange={(e) =>
                setField('listPrice', e.target.value ? Number(e.target.value) : null)
              }
              min={0}
            />
          </Field>

          <Field label="סטטוס פרסום *" error={stepErrors.status}>
            <select
              className="input"
              value={data.status ?? 'AVAILABLE'}
              onChange={(e) => setField('status', e.target.value as VehicleStatus)}
            >
              {(Object.keys(STATUS_LABELS) as VehicleStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>

          <Field label="סניף">
            <input
              type="text"
              className="input"
              value={data.branchLocation ?? ''}
              onChange={(e) => setField('branchLocation', e.target.value || null)}
              placeholder="לדוגמה: ארבל הרצליה"
            />
          </Field>
        </Grid>

        <div className="mt-4">
          <label className="label">תיאור הרכב</label>
          <textarea
            className="input"
            rows={5}
            value={data.description ?? ''}
            onChange={(e) => setField('description', e.target.value || null)}
            placeholder="תיאור חופשי של הרכב, מצב כללי, היסטוריה, יתרונות..."
          />
        </div>

        <label className="flex items-center gap-2 mt-4 cursor-pointer">
          <input
            type="checkbox"
            checked={data.isFeatured ?? false}
            onChange={(e) => setField('isFeatured', e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-accent-500 focus:ring-accent-400"
          />
          <span className="text-sm">רכב מומלץ (יוצג בדף הבית)</span>
        </label>
      </Section>

      <Section title="סיכום">
        <div className="flex gap-4 items-start">
          <div className="w-32 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
            {primaryImage ? (
              <StorageImage
                keyOrUrl={primaryImage}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                ללא תמונה
              </div>
            )}
          </div>
          <div className="flex-1 space-y-1">
            <h4 className="font-bold text-brand-900 text-lg">
              {make?.name ?? '?'} {data.modelName ?? '?'}{' '}
              {data.trim ? <span className="text-gray-500">{data.trim}</span> : null}
            </h4>
            <p className="text-sm text-gray-600">
              {data.year ?? '?'} • {bodyType?.name ?? 'ללא סוג מרכב'}
              {data.mileage ? ` • ${formatPrice(data.mileage)} ק"מ` : ''}
            </p>
            <p className="text-xl font-bold text-accent-600">
              {data.price ? `₪${formatPrice(data.price)}` : '—'}
            </p>
            <p className="text-xs text-gray-500">
              {images.length} תמונות • סטטוס:{' '}
              {STATUS_LABELS[(data.status ?? 'AVAILABLE') as VehicleStatus]}
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
