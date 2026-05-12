import type { WizardData, WizardStep } from './types';

export type ValidationErrors = Record<string, string>;

const nextYear = new Date().getFullYear() + 1;

export function validateStep(step: WizardStep, data: WizardData): ValidationErrors {
  const errors: ValidationErrors = {};

  if (step === 1) {
    if (!data.makeId) errors.makeId = 'יש לבחור יצרן';
    if (!data.modelName?.trim()) errors.modelName = 'יש להזין שם דגם';
    if (!data.year) {
      errors.year = 'יש להזין שנה';
    } else if (data.year < 1950 || data.year > nextYear) {
      errors.year = `שנה חייבת להיות בין 1950 ל-${nextYear}`;
    }
  }

  if (step === 2) {
    if (data.mileage != null && data.mileage < 0) {
      errors.mileage = 'קילומטראז\' לא יכול להיות שלילי';
    }
    if (data.condition === 'USED' && (data.mileage == null || data.mileage <= 0)) {
      errors.mileage = 'יש להזין קילומטראז\' לרכב יד שניה';
    }
    if (data.enginePower != null && data.enginePower < 0) {
      errors.enginePower = 'הספק לא יכול להיות שלילי';
    }
    if (data.engineCapacity != null && data.engineCapacity < 0) {
      errors.engineCapacity = 'נפח מנוע לא יכול להיות שלילי';
    }
  }

  if (step === 3) {
    if (data.hand != null && data.hand < 1) {
      errors.hand = 'יד חייבת להיות לפחות 1';
    }
    if (data.previousOwners != null && data.previousOwners < 0) {
      errors.previousOwners = 'מספר בעלים קודמים לא יכול להיות שלילי';
    }
    if (data.vin && data.vin.length !== 17) {
      errors.vin = 'VIN חייב להיות 17 תווים';
    }
  }

  if (step === 4) {
    if (data.doors != null && (data.doors < 1 || data.doors > 10)) {
      errors.doors = 'מספר דלתות לא תקין';
    }
    if (data.seats != null && (data.seats < 1 || data.seats > 20)) {
      errors.seats = 'מספר מושבים לא תקין';
    }
  }

  if (step === 6) {
    if (!data.price || data.price <= 0) {
      errors.price = 'יש להזין מחיר חיובי';
    }
    if (!data.status) {
      errors.status = 'יש לבחור סטטוס';
    }
  }

  return errors;
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}
