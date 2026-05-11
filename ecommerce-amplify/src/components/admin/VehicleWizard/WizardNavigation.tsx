import { ChevronRight, ChevronLeft, Loader2, Save, Check } from 'lucide-react';
import type { WizardStep } from './types';
import { TOTAL_STEPS } from './types';

interface Props {
  currentStep: WizardStep;
  saving: boolean;
  onBack: () => void;
  onNext: () => void;
  onPublish: () => void;
}

export function WizardNavigation({ currentStep, saving, onBack, onNext, onPublish }: Props) {
  const isFirst = currentStep === 1;
  const isLast = currentStep === TOTAL_STEPS;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between">
      <button
        type="button"
        onClick={onBack}
        disabled={isFirst || saving}
        className="btn-secondary disabled:opacity-40"
      >
        <ChevronRight className="w-4 h-4" />
        חזרה
      </button>

      <span className="text-sm text-gray-500">
        שלב {currentStep} מתוך {TOTAL_STEPS}
      </span>

      {isLast ? (
        <button
          type="button"
          onClick={onPublish}
          disabled={saving}
          className="btn-accent disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          {saving ? 'שומר...' : 'פרסם רכב'}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={saving}
          className="btn-accent disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'שומר...' : 'שמור והמשך'}
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
