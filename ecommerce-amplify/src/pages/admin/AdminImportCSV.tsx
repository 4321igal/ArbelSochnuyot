import { Link } from 'react-router-dom';
import { Upload, AlertCircle } from 'lucide-react';

export function AdminImportCSV() {
  return (
    <div className="space-y-4 max-w-3xl">
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <Upload className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-brand-900 mb-2">ייבוא רכבים מ-CSV</h2>
        <p className="text-gray-600 mb-6">
          תכונה זו תאפשר העלאת קובץ CSV עם רכבים ומיפוי עמודות לסכמה (יצרן, דגם, שנה, מחיר, ק"מ וכו').
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-start">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-900 mb-1 text-sm">בפיתוח</h3>
              <p className="text-amber-800 text-sm leading-relaxed">
                הסכמה ל-CSV (Make, BodyType, Vehicle, VehicleSearchMeta) כבר זמינה ב-Lambda{' '}
                <code className="text-xs bg-amber-100 px-1 py-0.5 rounded">getAdminSchema</code>.
                נדרש לעדכן את ה-UI של הייבוא כך שיתמוך בטבלאות הרכב וקריאת ה-API החדש.
              </p>
            </div>
          </div>
        </div>
        <Link to="/admin/vehicles/new" className="btn-primary mt-6 inline-flex">
          <Upload className="w-4 h-4" />
          הוסף רכב ידנית בינתיים
        </Link>
      </div>
    </div>
  );
}
