import { useEffect, useReducer, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, X } from 'lucide-react';

import {
  createVehicle,
  getVehicle,
  updateVehicle,
  type Vehicle,
} from '@/lib/api/vehicles';
import { listMakes, type Make } from '@/lib/api/makes';
import { listBodyTypes, type BodyType } from '@/lib/api/bodyTypes';
import {
  listModelsByMake,
  createVehicleModel,
  type VehicleModel,
} from '@/lib/api/vehicleModels';

import { WizardStepper } from './WizardStepper';
import { WizardNavigation } from './WizardNavigation';
import { validateStep, hasErrors } from './validation';
import {
  STEP_CONFIG,
  type WizardAction,
  type WizardData,
  type WizardState,
  type WizardStep,
} from './types';

import { Step1Identification } from './steps/Step1Identification';
import { Step2Mechanics } from './steps/Step2Mechanics';
import { Step3Ownership } from './steps/Step3Ownership';
import { Step4FeaturesDesign } from './steps/Step4FeaturesDesign';
import { Step5Images } from './steps/Step5Images';
import { Step6Pricing } from './steps/Step6Pricing';

const INITIAL_DATA: WizardData = {
  modelName: '',
  year: new Date().getFullYear(),
  currency: 'ILS',
  status: 'HIDDEN',
  isFeatured: false,
  accidentFree: true,
  features: [],
  images: [],
};

const INITIAL_STATE: WizardState = {
  vehicleId: null,
  currentStep: 1,
  data: INITIAL_DATA,
  saving: false,
  uploading: false,
  error: null,
  stepErrors: {},
};

function reducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, data: { ...state.data, [action.field]: action.value } };
    case 'SET_MANY':
      return { ...state, data: { ...state.data, ...action.values } };
    case 'SET_STEP':
      return { ...state, currentStep: action.step, stepErrors: {} };
    case 'SET_VEHICLE_ID':
      return { ...state, vehicleId: action.id };
    case 'SET_SAVING':
      return { ...state, saving: action.saving };
    case 'SET_UPLOADING':
      return { ...state, uploading: action.uploading };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    case 'SET_STEP_ERRORS':
      return { ...state, stepErrors: action.errors };
    case 'CLEAR_STEP_ERRORS':
      return { ...state, stepErrors: {} };
    default:
      return state;
  }
}

function vehicleToData(v: Vehicle): WizardData {
  return {
    makeId: v.makeId,
    modelName: v.modelName,
    trim: v.trim ?? null,
    year: v.year,
    bodyTypeId: v.bodyTypeId ?? null,
    price: v.price,
    listPrice: v.listPrice ?? null,
    currency: v.currency,
    mileage: v.mileage ?? null,
    transmission: v.transmission ?? null,
    fuelType: v.fuelType ?? null,
    enginePower: v.enginePower ?? null,
    engineCapacity: v.engineCapacity ?? null,
    driveType: v.driveType ?? null,
    color: v.color ?? null,
    interiorColor: v.interiorColor ?? null,
    doors: v.doors ?? null,
    seats: v.seats ?? null,
    vin: v.vin ?? null,
    plateNumber: v.plateNumber ?? null,
    firstRegistrationDate: v.firstRegistrationDate ?? null,
    hand: v.hand ?? null,
    previousOwners: v.previousOwners ?? null,
    ownershipType: v.ownershipType ?? null,
    accidentFree: v.accidentFree ?? null,
    inspectionExpiryDate: v.inspectionExpiryDate ?? null,
    status: v.status,
    isFeatured: v.isFeatured,
    condition: v.condition ?? null,
    description: v.description ?? null,
    features: (v.features ?? []).filter((f): f is string => !!f),
    images: (v.images ?? []).filter((i): i is string => !!i),
    branchLocation: v.branchLocation ?? null,
  };
}

interface Props {
  vehicleId?: string;
}

export function VehicleWizard({ vehicleId }: Props) {
  const navigate = useNavigate();
  const isEdit = !!vehicleId;

  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [loading, setLoading] = useState(isEdit);
  const [makes, setMakes] = useState<Make[]>([]);
  const [bodyTypes, setBodyTypes] = useState<BodyType[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [maxReachedStep, setMaxReachedStep] = useState<WizardStep>(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [makesList, bodyTypesList] = await Promise.all([
          listMakes(false),
          listBodyTypes(false),
        ]);
        if (cancelled) return;
        setMakes(makesList);
        setBodyTypes(bodyTypesList);

        if (isEdit && vehicleId) {
          const v = await getVehicle(vehicleId);
          if (cancelled) return;
          if (v) {
            dispatch({ type: 'SET_VEHICLE_ID', id: v.id });
            dispatch({ type: 'SET_MANY', values: vehicleToData(v) });
            setMaxReachedStep(6);
          } else {
            dispatch({ type: 'SET_ERROR', error: 'הרכב לא נמצא' });
          }
        }
      } catch (err) {
        if (!cancelled) {
          dispatch({
            type: 'SET_ERROR',
            error: err instanceof Error ? err.message : 'טעינה נכשלה',
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEdit, vehicleId]);

  useEffect(() => {
    let cancelled = false;
    const currentMakeId = state.data.makeId;
    if (!currentMakeId) {
      setModels([]);
      return;
    }
    setModelsLoading(true);
    (async () => {
      try {
        const list = await listModelsByMake(currentMakeId);
        if (!cancelled) setModels(list);
      } catch (err) {
        if (!cancelled) {
          dispatch({
            type: 'SET_ERROR',
            error: err instanceof Error ? err.message : 'טעינת דגמים נכשלה',
          });
        }
      } finally {
        if (!cancelled) setModelsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [state.data.makeId]);

  const handleAddNewModel = async (name: string) => {
    if (!state.data.makeId) return;
    try {
      const created = await createVehicleModel({ makeId: state.data.makeId, name });
      setModels((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name, 'he')));
      dispatch({ type: 'SET_FIELD', field: 'modelName', value: created.name });
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        error: err instanceof Error ? err.message : 'הוספת דגם נכשלה',
      });
    }
  };

  const setField = <K extends keyof WizardData>(field: K, value: WizardData[K]) => {
    dispatch({ type: 'SET_FIELD', field, value });
  };

  const setMany = (values: Partial<WizardData>) => {
    dispatch({ type: 'SET_MANY', values });
  };

  const persistCurrentData = async (overrideStatus?: Vehicle['status']) => {
    const payload = { ...state.data };
    if (overrideStatus) payload.status = overrideStatus;

    if (state.vehicleId) {
      await updateVehicle(state.vehicleId, payload);
      return state.vehicleId;
    }

    const created = await createVehicle({
      makeId: payload.makeId!,
      modelName: payload.modelName!,
      year: payload.year!,
      price: payload.price ?? 0,
      currency: payload.currency ?? 'ILS',
      status: payload.status ?? 'HIDDEN',
      isFeatured: payload.isFeatured ?? false,
      trim: payload.trim ?? null,
      bodyTypeId: payload.bodyTypeId ?? null,
      condition: payload.condition ?? null,
      branchLocation: payload.branchLocation ?? null,
    });
    dispatch({ type: 'SET_VEHICLE_ID', id: created.id });
    navigate(`/admin/vehicles/${created.id}/edit`, { replace: true });
    return created.id;
  };

  const handleNext = async () => {
    const errors = validateStep(state.currentStep, state.data);
    if (hasErrors(errors)) {
      dispatch({ type: 'SET_STEP_ERRORS', errors });
      return;
    }

    dispatch({ type: 'SET_SAVING', saving: true });
    dispatch({ type: 'SET_ERROR', error: null });
    try {
      await persistCurrentData();
      const nextStep = Math.min(state.currentStep + 1, 6) as WizardStep;
      dispatch({ type: 'SET_STEP', step: nextStep });
      if (nextStep > maxReachedStep) setMaxReachedStep(nextStep);
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        error: err instanceof Error ? err.message : 'שמירה נכשלה',
      });
    } finally {
      dispatch({ type: 'SET_SAVING', saving: false });
    }
  };

  const handleBack = () => {
    if (state.currentStep > 1) {
      dispatch({
        type: 'SET_STEP',
        step: (state.currentStep - 1) as WizardStep,
      });
    }
  };

  const handlePublish = async () => {
    const errors = validateStep(6, state.data);
    if (hasErrors(errors)) {
      dispatch({ type: 'SET_STEP_ERRORS', errors });
      return;
    }
    dispatch({ type: 'SET_SAVING', saving: true });
    dispatch({ type: 'SET_ERROR', error: null });
    try {
      const status = state.data.status ?? 'AVAILABLE';
      await persistCurrentData(status);
      navigate('/admin/vehicles');
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        error: err instanceof Error ? err.message : 'פרסום נכשל',
      });
    } finally {
      dispatch({ type: 'SET_SAVING', saving: false });
    }
  };

  const handleStepClick = (step: WizardStep) => {
    if (step <= maxReachedStep && step !== state.currentStep) {
      dispatch({ type: 'SET_STEP', step });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-brand-700" />
      </div>
    );
  }

  const stepProps = {
    data: state.data,
    stepErrors: state.stepErrors,
    setField,
    setMany,
  };

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-brand-900">
            {isEdit ? 'עריכת רכב' : 'הוספת רכב חדש'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {STEP_CONFIG[state.currentStep - 1].title}
          </p>
        </div>
        <Link to="/admin/vehicles" className="btn-secondary">
          <X className="w-4 h-4" />
          ביטול
        </Link>
      </div>

      <WizardStepper
        currentStep={state.currentStep}
        maxReachedStep={maxReachedStep}
        onStepClick={handleStepClick}
      />

      {state.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
          {state.error}
        </div>
      )}

      <div className="space-y-4">
        {state.currentStep === 1 && (
          <Step1Identification
            {...stepProps}
            makes={makes}
            bodyTypes={bodyTypes}
            models={models}
            modelsLoading={modelsLoading}
            onAddNewModel={handleAddNewModel}
          />
        )}
        {state.currentStep === 2 && <Step2Mechanics {...stepProps} />}
        {state.currentStep === 3 && <Step3Ownership {...stepProps} />}
        {state.currentStep === 4 && <Step4FeaturesDesign {...stepProps} />}
        {state.currentStep === 5 && (
          <Step5Images
            {...stepProps}
            vehicleId={state.vehicleId}
            uploading={state.uploading}
            setUploading={(v) => dispatch({ type: 'SET_UPLOADING', uploading: v })}
            setError={(msg) => dispatch({ type: 'SET_ERROR', error: msg })}
          />
        )}
        {state.currentStep === 6 && (
          <Step6Pricing {...stepProps} makes={makes} bodyTypes={bodyTypes} />
        )}
      </div>

      <WizardNavigation
        currentStep={state.currentStep}
        saving={state.saving}
        onBack={handleBack}
        onNext={handleNext}
        onPublish={handlePublish}
      />
    </div>
  );
}
