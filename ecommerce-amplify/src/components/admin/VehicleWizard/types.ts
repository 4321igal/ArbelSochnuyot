import type { Vehicle } from '@/lib/api/vehicles';

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;
export const TOTAL_STEPS: WizardStep = 6;

export type WizardData = Partial<Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>;

export interface StepConfig {
  step: WizardStep;
  title: string;
  shortTitle: string;
}

export const STEP_CONFIG: StepConfig[] = [
  { step: 1, title: 'זיהוי הרכב', shortTitle: 'זיהוי' },
  { step: 2, title: 'מנוע ומכניקה', shortTitle: 'מנוע' },
  { step: 3, title: 'בעלות והיסטוריה', shortTitle: 'בעלות' },
  { step: 4, title: 'אבזור ועיצוב', shortTitle: 'אבזור' },
  { step: 5, title: 'תמונות', shortTitle: 'תמונות' },
  { step: 6, title: 'מחיר ופרסום', shortTitle: 'מחיר' },
];

export interface WizardState {
  vehicleId: string | null;
  currentStep: WizardStep;
  data: WizardData;
  saving: boolean;
  uploading: boolean;
  error: string | null;
  stepErrors: Record<string, string>;
}

export type WizardAction =
  | { type: 'SET_FIELD'; field: keyof WizardData; value: WizardData[keyof WizardData] }
  | { type: 'SET_MANY'; values: Partial<WizardData> }
  | { type: 'SET_STEP'; step: WizardStep }
  | { type: 'SET_VEHICLE_ID'; id: string }
  | { type: 'SET_SAVING'; saving: boolean }
  | { type: 'SET_UPLOADING'; uploading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_STEP_ERRORS'; errors: Record<string, string> }
  | { type: 'CLEAR_STEP_ERRORS' };

export interface StepProps {
  data: WizardData;
  stepErrors: Record<string, string>;
  setField: <K extends keyof WizardData>(field: K, value: WizardData[K]) => void;
  setMany: (values: Partial<WizardData>) => void;
}
