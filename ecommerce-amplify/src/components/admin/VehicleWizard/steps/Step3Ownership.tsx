import { Section, Grid, Field } from '../../FormPrimitives';
import type { StepProps } from '../types';
import type { OwnershipType } from '@/lib/api/vehicles';
import { OWNERSHIP_TYPE_LABELS } from '@/components/vehicle/labels';

export function Step3Ownership({ data, stepErrors, setField }: StepProps) {
  const ownershipKeys = Object.keys(OWNERSHIP_TYPE_LABELS) as OwnershipType[];

  return (
    <Section title="בעלות והיסטוריה">
      <Grid>
        <Field label="יד" error={stepErrors.hand} hint="1 = יד ראשונה">
          <input
            type="number"
            className="input"
            value={data.hand ?? ''}
            onChange={(e) => setField('hand', e.target.value ? Number(e.target.value) : null)}
            min={1}
          />
        </Field>

        <Field label="בעלים קודמים" error={stepErrors.previousOwners}>
          <input
            type="number"
            className="input"
            value={data.previousOwners ?? ''}
            onChange={(e) =>
              setField('previousOwners', e.target.value ? Number(e.target.value) : null)
            }
            min={0}
          />
        </Field>

        <Field label="עליה לכביש">
          <input
            type="date"
            className="input"
            value={data.firstRegistrationDate ?? ''}
            onChange={(e) => setField('firstRegistrationDate', e.target.value || null)}
          />
        </Field>

        <Field label="תוקף טסט">
          <input
            type="date"
            className="input"
            value={data.inspectionExpiryDate ?? ''}
            onChange={(e) => setField('inspectionExpiryDate', e.target.value || null)}
          />
        </Field>

        <Field label="VIN (מספר שלדה)" error={stepErrors.vin} hint="17 תווים">
          <input
            type="text"
            className="input"
            value={data.vin ?? ''}
            onChange={(e) => setField('vin', e.target.value || null)}
            maxLength={17}
          />
        </Field>

        <Field label="מספר רישוי">
          <input
            type="text"
            className="input"
            value={data.plateNumber ?? ''}
            onChange={(e) => setField('plateNumber', e.target.value || null)}
            placeholder="123-45-678"
          />
        </Field>
      </Grid>

      <div className="mt-5">
        <label className="label">סוג בעלות</label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setField('ownershipType', null)}
            className={`px-4 py-2 rounded-full text-sm border transition-colors ${
              !data.ownershipType
                ? 'bg-brand-800 text-white border-brand-800'
                : 'bg-white text-gray-700 border-gray-300 hover:border-brand-500'
            }`}
          >
            לא צוין
          </button>
          {ownershipKeys.map((key) => {
            const active = data.ownershipType === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setField('ownershipType', key)}
                className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                  active
                    ? 'bg-brand-800 text-white border-brand-800'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-brand-500'
                }`}
              >
                {OWNERSHIP_TYPE_LABELS[key]}
              </button>
            );
          })}
        </div>
      </div>

      <label className="flex items-center gap-2 mt-5 cursor-pointer">
        <input
          type="checkbox"
          checked={data.accidentFree ?? false}
          onChange={(e) => setField('accidentFree', e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-accent-500 focus:ring-accent-400"
        />
        <span className="text-sm">ללא תאונות</span>
      </label>
    </Section>
  );
}
