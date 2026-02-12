import { Plus, Upload } from 'lucide-react';

interface ProductHeaderProps {
  onAddProduct: () => void;
  onImportCSV: () => void;
}

export default function ProductHeader({ onAddProduct, onImportCSV }: ProductHeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ניהול מוצרים</h1>
            <p className="text-sm text-gray-500 mt-1">נהל את קטלוג המוצרים שלך עם AI</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onAddProduct}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all"
            >
              <Plus size={20} />
              הוסף מוצר
            </button>
            <button
              onClick={onImportCSV}
              className="flex items-center gap-2 bg-white border-2 border-purple-600 text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50 transition-all"
            >
              <Upload size={20} />
              יבוא CSV
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
