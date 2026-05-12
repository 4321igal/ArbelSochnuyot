import type { Transmission, FuelType, DriveType, VehicleCondition, VehicleStatus, OwnershipType } from '@/lib/api/vehicles';

export const TRANSMISSION_LABELS: Record<Transmission, string> = {
  AUTO: 'אוטומטית',
  MANUAL: 'ידנית',
  DSG: 'רובוטית (DSG)',
  CVT: 'רציפה (CVT)',
};

export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  GASOLINE: 'בנזין',
  DIESEL: 'דיזל',
  HYBRID: 'היברידי',
  ELECTRIC: 'חשמלי',
  PLUGIN_HYBRID: 'היברידי נטען',
  LPG: 'גז (LPG)',
};

export const DRIVE_TYPE_LABELS: Record<DriveType, string> = {
  FWD: 'הנעה קדמית',
  RWD: 'הנעה אחורית',
  AWD: 'הנעה כפולה (AWD)',
  FOUR_WD: '4x4',
};

export const CONDITION_LABELS: Record<VehicleCondition, string> = {
  NEW: 'חדש',
  USED: 'יד שנייה',
  DEMO: 'דמו / השכרה',
};

export const STATUS_LABELS: Record<VehicleStatus, string> = {
  AVAILABLE: 'זמין',
  RESERVED: 'שמור',
  SOLD: 'נמכר',
  HIDDEN: 'מוסתר',
};

export const OWNERSHIP_TYPE_LABELS: Record<OwnershipType, string> = {
  PRIVATE: 'פרטית',
  LEASING: 'ליסינג',
  RENTAL: 'השכרה',
  TAXI: 'מונית',
  COMPANY: 'חברה',
  IMPORTER: 'יבואן',
};

export const COMMON_FEATURES = [
  'מערכת מולטימדיה',
  'חיישני חניה',
  'מצלמה אחורית',
  'בקרת שיוט',
  'בקרת שיוט אדפטיבית',
  'התראת סטייה מנתיב',
  'בלימה אוטומטית',
  'גג נפתח',
  'מושבים בעור',
  'מושבים מחוממים',
  'מושבים חשמליים',
  'חלונות חשמל',
  'מראות חשמליות',
  'חיישני גשם',
  'אורות LED',
  'גלגלי סגסוגת',
  'בלוטות׳',
  'CarPlay / Android Auto',
];
