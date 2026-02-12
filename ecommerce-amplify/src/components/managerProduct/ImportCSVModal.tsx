import React from 'react';
import { X, Upload, Check } from 'lucide-react';
import type { CSVPreviewItem } from './hooks/useCSVImport';

interface ImportCSVModalProps {
  isOpen: boolean;
  csvFile: File | null;
  importPreview: CSVPreviewItem[];
  onCSVUpload: (file: File) => void;
  onImport: () => void;
  onClose: () => void;
  onSelectNew: () => void;
}

export default function ImportCSVModal({
  isOpen,
  csvFile,
  importPreview,
  onCSVUpload,
  onImport,
  onClose,
  onSelectNew
}: ImportCSVModalProps) {
  if (!isOpen) return null;

  const handleCSVUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCSVUpload(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold">יבוא מוצרים מקובץ CSV</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {!csvFile ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">📋 פורמט הקובץ הנדרש</h3>
                <p className="text-sm text-blue-800 mb-3">
                  הקובץ צריך לכלול את העמודות הבאות (ניתן להוסיף עמודות נוספות):
                </p>
                <div className="bg-white rounded p-3 text-sm font-mono">
                  rawName,rawDescription,barcode,category,image
                </div>
              </div>

              <input
                type="file"
                accept=".csv"
                onChange={handleCSVUploadChange}
                className="hidden"
                id="csvUpload"
              />
              <label
                htmlFor="csvUpload"
                className="block w-full p-12 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all"
              >
                <Upload className="mx-auto text-gray-400 mb-3" size={48} />
                <p className="text-lg font-medium text-gray-700 mb-1">
                  לחץ או גרור קובץ CSV לכאן
                </p>
                <p className="text-sm text-gray-500">
                  קובץ CSV עד 10MB
                </p>
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <Check className="text-green-600 flex-shrink-0" size={24} />
                <div>
                  <h3 className="font-medium text-green-900">קובץ הועלה בהצלחה!</h3>
                  <p className="text-sm text-green-800 mt-1">
                    נמצאו {importPreview.length} מוצרים
                  </p>
                </div>
              </div>

              {importPreview.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">שם מוצר</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">תיאור</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">קטגוריה</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">ברקוד</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {importPreview.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm font-medium">{item.rawName || item.name}</td>
                            <td className="px-4 py-2 text-sm text-gray-600 truncate max-w-xs">
                              {item.rawDescription || item.description || '-'}
                            </td>
                            <td className="px-4 py-2 text-sm">{item.category || 'כללי'}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">{item.barcode || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onImport}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all"
                >
                  יבא {importPreview.length} מוצרים
                </button>
                <button
                  onClick={onSelectNew}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  בחר קובץ אחר
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
