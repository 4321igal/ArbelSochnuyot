import { Section, Grid, Field } from '../../FormPrimitives';
import type { StepProps } from '../types';
import type { Transmission, FuelType, DriveType } from '@/lib/api/vehicles';
import {
  TRANSMISSION_LABELS,
  FUEL_TYPE_LABELS,
  DRIVE_TYPE_LABELS,
} from '@/components/vehicle/labels';

export function Step2Mechanics({ data, stepErrors, setField }: StepProps) {
  return (
    <Section title="מנוע ומכניקה">
      <Grid>
        <Field label="קילומטראז'" error={stepErrors.mileage} hint="חובה ברכב יד שניה">
          <input
            type="number"
            className="input"
            value={data.mileage ?? ''}
            onChange={(e) =>
              setField('mileage', e.target.value ? Number(e.target.value) : null)
            }
            min={0}
            placeholder="לדוגמה: 85000"
          />
        </Field>

        <Field label="תיבת הילוכים">
          <select
            className="input"
            value={data.transmission ?? ''}
            onChange={(e) =>
              setField('transmission', (e.target.value || null) as Transmission | null)
            }
          >
            <option value="">בחר</option>
            {(Object.keys(TRANSMISSION_LABELS) as Transmission[]).map((t) => (
              <option key={t} value={t}>
                {TRANSMISSION_LABELS[t]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="סוג דלק">
          <select
            className="input"
            value={data.fuelType ?? ''}
            onChange={(e) => setField('fuelType', (e.target.value || null) as FuelType | null)}
          >
            <option value="">בחר</option>
            {(Object.keys(FUEL_TYPE_LABELS) as FuelType[]).map((f) => (
              <option key={f} value={f}>
                {FUEL_TYPE_LABELS[f]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="הנעה">
          <select
            className="input"
            value={data.driveType ?? ''}
            onChange={(e) =>
              setField('driveType', (e.target.value || null) as DriveType | null)
            }
          >
            <option value="">בחר</option>
            {(Object.keys(DRIVE_TYPE_LABELS) as DriveType[]).map((d) => (
              <option key={d} value={d}>
                {DRIVE_TYPE_LABELS[d]}
              </option>
            ))}
          </select>
        </Field>

        <Field label='הספק (כ"ס)' error={stepErrors.enginePower}>
          <input
            type="number"
            className="input"
            value={data.enginePower ?? ''}
            onChange={(e) =>
              setField('enginePower', e.target.value ? Number(e.target.value) : null)
            }
            min={0}
          />
        </Field>

        <Field label='נפח מנוע (סמ"ק)' error={stepErrors.engineCapacity}>
          <input
            type="number"
            className="input"
            value={data.engineCapacity ?? ''}
            onChange={(e) =>
              setField('engineCapacity', e.target.value ? Number(e.target.value) : null)
            }
            min={0}
            placeholder="לדוגמה: 1600"
          />
        </Field>
      </Grid>
    </Section>
  );
}
