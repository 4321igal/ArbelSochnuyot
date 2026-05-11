import { Section, Grid, Field } from '../../FormPrimitives';
import type { StepProps } from '../types';
import type { Make } from '@/lib/api/makes';
import type { BodyType } from '@/lib/api/bodyTypes';
import type { VehicleCondition } from '@/lib/api/vehicles';
import { CONDITION_LABELS } from '@/components/vehicle/labels';

interface Props extends StepProps {
  makes: Make[];
  bodyTypes: BodyType[];
}

export function Step1Identification({ data, stepErrors, setField, makes, bodyTypes }: Props) {
  return (
    <Section title="זיהוי הרכב">
      <Grid>
        <Field label="יצרן *" error={stepErrors.makeId}>
          <select
            className="input"
            value={data.makeId ?? ''}
            onChange={(e) => setField('makeId', e.target.value)}
          >
            <option value="">בחר יצרן</option>
            {makes.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="דגם *" error={stepErrors.modelName}>
          <input
            type="text"
            className="input"
            value={data.modelName ?? ''}
            onChange={(e) => setField('modelName', e.target.value)}
            placeholder="לדוגמה: קורולה, מאזדה 3, אקטרוס"
          />
        </Field>

        <Field label="גרסה (Trim)" hint="אופציונלי - גימור או דגם משנה">
          <input
            type="text"
            className="input"
            value={data.trim ?? ''}
            onChange={(e) => setField('trim', e.target.value)}
            placeholder="לדוגמה: Hybrid, GT, Sport"
          />
        </Field>

        <Field label="שנה *" error={stepErrors.year}>
          <input
            type="number"
            className="input"
            value={data.year ?? ''}
            onChange={(e) => setField('year', e.target.value ? Number(e.target.value) : undefined)}
            min={1950}
            max={new Date().getFullYear() + 1}
          />
        </Field>

        <Field label="סוג מרכב">
          <select
            className="input"
            value={data.bodyTypeId ?? ''}
            onChange={(e) => setField('bodyTypeId', e.target.value || null)}
          >
            <option value="">בחר סוג</option>
            {bodyTypes.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="מצב הרכב">
          <select
            className="input"
            value={data.condition ?? ''}
            onChange={(e) =>
              setField('condition', (e.target.value || null) as VehicleCondition | null)
            }
          >
            <option value="">לא צוין</option>
            {(Object.keys(CONDITION_LABELS) as VehicleCondition[]).map((c) => (
              <option key={c} value={c}>
                {CONDITION_LABELS[c]}
              </option>
            ))}
          </select>
        </Field>
      </Grid>
    </Section>
  );
}
