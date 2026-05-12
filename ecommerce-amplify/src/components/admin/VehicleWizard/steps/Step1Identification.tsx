import { Section, Grid, Field } from '../../FormPrimitives';
import { Combobox, type ComboboxOption } from '../../Combobox';
import type { StepProps } from '../types';
import type { Make } from '@/lib/api/makes';
import type { BodyType } from '@/lib/api/bodyTypes';
import type { VehicleModel } from '@/lib/api/vehicleModels';
import type { VehicleCondition } from '@/lib/api/vehicles';
import { CONDITION_LABELS } from '@/components/vehicle/labels';

interface Props extends StepProps {
  makes: Make[];
  bodyTypes: BodyType[];
  models: VehicleModel[];
  modelsLoading: boolean;
  onAddNewModel: (name: string) => Promise<void>;
}

export function Step1Identification({
  data,
  stepErrors,
  setField,
  makes,
  bodyTypes,
  models,
  modelsLoading,
  onAddNewModel,
}: Props) {
  const makeOptions: ComboboxOption[] = makes.map((m) => ({ value: m.id, label: m.name }));
  const modelOptions: ComboboxOption[] = models.map((m) => ({ value: m.name, label: m.name }));

  const handleMakeChange = (val: string | null) => {
    setField('makeId', val ?? undefined);
    setField('modelName', '');
  };

  const handleModelChange = (val: string | null) => {
    setField('modelName', val ?? '');
  };

  return (
    <Section title="זיהוי הרכב">
      <Grid>
        <Field label="יצרן *" error={stepErrors.makeId}>
          <Combobox
            value={data.makeId ?? null}
            onChange={handleMakeChange}
            options={makeOptions}
            placeholder="חפש או בחר יצרן..."
            noResultsLabel="לא נמצא יצרן תואם"
          />
        </Field>

        <Field
          label="דגם *"
          error={stepErrors.modelName}
          hint={!data.makeId ? 'בחר יצרן קודם' : modelsLoading ? 'טוען רשימת דגמים...' : undefined}
        >
          <Combobox
            value={data.modelName ?? null}
            onChange={handleModelChange}
            options={modelOptions}
            placeholder={data.makeId ? 'חפש או בחר דגם...' : 'בחר יצרן קודם'}
            disabled={!data.makeId || modelsLoading}
            disabledMessage="בחר יצרן קודם"
            onAddNew={async (name) => {
              await onAddNewModel(name);
            }}
            addNewLabelPrefix="+ הוסף דגם"
            noResultsLabel="לא נמצא דגם תואם"
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
