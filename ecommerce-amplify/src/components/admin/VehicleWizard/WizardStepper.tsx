import { Check } from 'lucide-react';
import { STEP_CONFIG, type WizardStep } from './types';

interface Props {
  currentStep: WizardStep;
  onStepClick?: (step: WizardStep) => void;
  maxReachedStep: WizardStep;
}

export function WizardStepper({ currentStep, onStepClick, maxReachedStep }: Props) {
  return (
    <nav className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <ol className="flex items-center justify-between gap-2">
        {STEP_CONFIG.map((cfg, idx) => {
          const isActive = cfg.step === currentStep;
          const isComplete = cfg.step < currentStep;
          const isReachable = cfg.step <= maxReachedStep;
          const isLast = idx === STEP_CONFIG.length - 1;

          return (
            <li key={cfg.step} className="flex items-center flex-1">
              <button
                type="button"
                onClick={() => isReachable && onStepClick?.(cfg.step)}
                disabled={!isReachable}
                className={`flex items-center gap-2 ${
                  isReachable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                }`}
              >
                <span
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold border-2 transition-colors ${
                    isActive
                      ? 'bg-accent-500 border-accent-500 text-white'
                      : isComplete
                      ? 'bg-brand-700 border-brand-700 text-white'
                      : 'bg-white border-gray-300 text-gray-500'
                  }`}
                >
                  {isComplete ? <Check className="w-4 h-4" /> : cfg.step}
                </span>
                <span
                  className={`text-sm hidden md:inline ${
                    isActive ? 'font-bold text-brand-900' : 'text-gray-600'
                  }`}
                >
                  {cfg.shortTitle}
                </span>
              </button>
              {!isLast && (
                <span
                  className={`flex-1 h-px mx-2 ${
                    cfg.step < currentStep ? 'bg-brand-700' : 'bg-gray-200'
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
