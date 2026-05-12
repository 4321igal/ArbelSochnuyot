import { Section, Grid, Field } from '../../FormPrimitives';
import type { StepProps } from '../types';
import { COMMON_FEATURES } from '@/components/vehicle/labels';

export function Step4FeaturesDesign({ data, stepErrors, setField }: StepProps) {
  const features = (data.features ?? []).filter((f): f is string => !!f);

  const toggleFeature = (feat: string) => {
    const has = features.includes(feat);
    setField('features', has ? features.filter((f) => f !== feat) : [...features, feat]);
  };

  return (
    <>
      <Section title="עיצוב ותפעול">
        <Grid>
          <Field label="צבע חיצוני">
            <input
              type="text"
              className="input"
              value={data.color ?? ''}
              onChange={(e) => setField('color', e.target.value || null)}
              placeholder="לדוגמה: לבן פנינה"
            />
          </Field>

          <Field label="צבע פנים">
            <input
              type="text"
              className="input"
              value={data.interiorColor ?? ''}
              onChange={(e) => setField('interiorColor', e.target.value || null)}
              placeholder="לדוגמה: שחור"
            />
          </Field>

          <Field label="מס' דלתות" error={stepErrors.doors}>
            <input
              type="number"
              className="input"
              value={data.doors ?? ''}
              onChange={(e) =>
                setField('doors', e.target.value ? Number(e.target.value) : null)
              }
              min={1}
              max={10}
            />
          </Field>

          <Field label="מס' מושבים" error={stepErrors.seats}>
            <input
              type="number"
              className="input"
              value={data.seats ?? ''}
              onChange={(e) =>
                setField('seats', e.target.value ? Number(e.target.value) : null)
              }
              min={1}
              max={20}
            />
          </Field>
        </Grid>
      </Section>

      <Section title="אבזור">
        <p className="text-sm text-gray-500 mb-3">סמן את אבזורי הרכב הקיימים:</p>
        <div className="flex flex-wrap gap-2">
          {COMMON_FEATURES.map((feat) => {
            const active = features.includes(feat);
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
        <p className="text-xs text-gray-500 mt-3">
          נבחרו {features.length} פריטים
        </p>
      </Section>
    </>
  );
}
