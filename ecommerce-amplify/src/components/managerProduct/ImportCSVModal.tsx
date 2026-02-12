import React, { useEffect, useState, useCallback } from 'react';
import { X, Upload, Check, AlertCircle } from 'lucide-react';
import type { CSVPreviewItem } from './hooks/useCSVImport';
import type { AdminSchema } from '@/lib/api/schema';
import { getAdminSchema, getTable, getUniqueFields } from '@/lib/api/schema';
import { validateRows, type ValidationError } from '@/lib/import/validation';
import { executeImport, type RowResult } from '@/lib/import/processor';

interface ImportCSVModalProps {
  isOpen: boolean;
  csvFile: File | null;
  importPreview: CSVPreviewItem[];
  csvHeaders: string[];
  csvRows: Record<string, string>[];
  onCSVUpload: (file: File) => void;
  onImport: () => void;
  onClose: () => void;
  onSelectNew: () => void;
}

const EMPTY_MAPPING: Record<string, string> = {};

export default function ImportCSVModal({
  isOpen,
  csvFile,
  importPreview,
  csvHeaders,
  csvRows,
  onCSVUpload,
  onImport,
  onClose,
  onSelectNew,
}: ImportCSVModalProps) {
  const [schema, setSchema] = useState<AdminSchema | null>(null);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [targetTable, setTargetTable] = useState<string>('');
  const [mapping, setMapping] = useState<Record<string, string>>(EMPTY_MAPPING);
  const [upsertByField, setUpsertByField] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [importResults, setImportResults] = useState<RowResult[] | null>(null);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setIsLoadingSchema(true);
    setSchemaError(null);
    getAdminSchema()
      .then((s) => {
        if (!cancelled) {
          setSchema(s);
          setTargetTable(s.tables[0]?.name ?? '');
          setMapping(EMPTY_MAPPING);
          setUpsertByField('');
          setValidationErrors([]);
          setImportResults(null);
        }
      })
      .catch((e) => {
        if (!cancelled) setSchemaError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSchema(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const table = targetTable ? getTable(schema!, targetTable) : undefined;
  const uniqueFields = table ? getUniqueFields(table) : [];
  const availableFields = table?.fields ?? [];

  const handleMappingChange = useCallback((csvCol: string, dbField: string) => {
    setMapping((prev) => {
      const next = { ...prev };
      if (dbField) next[csvCol] = dbField;
      else delete next[csvCol];
      return next;
    });
    setValidationErrors([]);
    setImportResults(null);
  }, []);

  const handleValidate = useCallback(() => {
    if (!schema || !targetTable || csvRows.length === 0) return;
    const errors = validateRows(schema, targetTable, csvRows, mapping);
    setValidationErrors(errors);
  }, [schema, targetTable, csvRows, mapping]);

  const handleRunImport = useCallback(async () => {
    if (!schema || !targetTable || csvRows.length === 0) return;
    const errors = validateRows(schema, targetTable, csvRows, mapping);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    setIsImporting(true);
    setImportResults(null);
    try {
      const results = await executeImport(schema, targetTable, csvRows, mapping, {
        upsertByField: upsertByField || undefined,
        batchSize: 5,
      });
      setImportResults(results);
      const allOk = results.every((r) => r.success);
      if (allOk) {
        onImport();
      }
    } catch (e) {
      setImportResults([
        { rowIndex: 0, success: false, error: e instanceof Error ? e.message : String(e) },
      ]);
    } finally {
      setIsImporting(false);
    }
  }, [schema, targetTable, csvRows, mapping, upsertByField, onImport]);

  if (!isOpen) return null;

  const handleCSVUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onCSVUpload(file);
  };

  const successCount = importResults?.filter((r) => r.success).length ?? 0;
  const failCount = importResults ? importResults.length - successCount : 0;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold">יבוא מקובץ CSV (מבוסס סכמה)</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {!csvFile ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">📋 פורמט</h3>
                <p className="text-sm text-blue-800">
                  העלה קובץ CSV. לאחר מכן בחר טבלה ומפה עמודות לשדות הקיימים בסכמה בלבד.
                </p>
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
                <p className="text-lg font-medium text-gray-700 mb-1">לחץ או גרור קובץ CSV לכאן</p>
                <p className="text-sm text-gray-500">קובץ CSV עד 10MB</p>
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              {isLoadingSchema && (
                <p className="text-sm text-gray-500">טוען סכמה...</p>
              )}
              {schemaError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
                  <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                  <p className="text-sm text-red-800">{schemaError}</p>
                </div>
              )}
              {schema && !schemaError && (
                <>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                    <Check className="text-green-600 flex-shrink-0" size={24} />
                    <div>
                      <h3 className="font-medium text-green-900">קובץ הועלה</h3>
                      <p className="text-sm text-green-800 mt-1">
                        {importPreview.length} שורות, עמודות: {csvHeaders.join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">טבלת יעד</label>
                      <select
                        value={targetTable}
                        onChange={(e) => {
                          setTargetTable(e.target.value);
                          setMapping(EMPTY_MAPPING);
                          setUpsertByField('');
                          setValidationErrors([]);
                          setImportResults(null);
                        }}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      >
                        {schema.tables.map((t) => (
                          <option key={t.name} value={t.name}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {uniqueFields.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Upsert לפי שדה (אופציונלי)
                        </label>
                        <select
                          value={upsertByField}
                          onChange={(e) => {
                            setUpsertByField(e.target.value);
                            setImportResults(null);
                          }}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                          <option value="">— לא</option>
                          {uniqueFields.map((f) => (
                            <option key={f.name} value={f.name}>
                              {f.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-800 mb-2">מיפוי עמודות → שדות (מהסכמה בלבד)</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-4 py-2 text-right font-medium text-gray-600">עמודת CSV</th>
                            <th className="px-4 py-2 text-right font-medium text-gray-600">שדה בטבלה</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {csvHeaders.map((col) => (
                            <tr key={col}>
                              <td className="px-4 py-2 font-mono">{col}</td>
                              <td className="px-4 py-2">
                                <select
                                  value={mapping[col] ?? ''}
                                  onChange={(e) => handleMappingChange(col, e.target.value)}
                                  className="w-full border border-gray-300 rounded px-2 py-1"
                                >
                                  <option value="">— לא למפות</option>
                                  {availableFields.map((f) => (
                                    <option key={f.name} value={f.name}>
                                      {f.name} ({f.type}) {f.required ? ' *' : ''}
                                    </option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {validationErrors.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <h4 className="font-medium text-amber-900 mb-2">שגיאות ולידציה</h4>
                      <ul className="text-sm text-amber-800 list-disc list-inside space-y-1">
                        {validationErrors.slice(0, 10).map((err, i) => (
                          <li key={i}>
                            שורה {err.rowIndex + 1}, שדה {err.field}: {err.message}
                          </li>
                        ))}
                        {validationErrors.length > 10 && (
                          <li>... ועוד {validationErrors.length - 10}</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {importResults !== null && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">תוצאות יבוא</h4>
                      <p className="text-sm text-gray-700">
                        הצלחה: {successCount} | כישלון: {failCount}
                      </p>
                      {failCount > 0 && (
                        <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                          {importResults
                            .filter((r) => !r.success)
                            .slice(0, 5)
                            .map((r, i) => (
                              <li key={i}>
                                שורה {r.rowIndex + 1}: {r.error}
                              </li>
                            ))}
                          {importResults.filter((r) => !r.success).length > 5 && (
                            <li>... ועוד</li>
                          )}
                        </ul>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleValidate}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      בדוק ולידציה
                    </button>
                    <button
                      onClick={handleRunImport}
                      disabled={isImporting}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {isImporting ? 'מייבא...' : `יבא ${csvRows.length} שורות`}
                    </button>
                    <button
                      onClick={onSelectNew}
                      className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      בחר קובץ אחר
                    </button>
                    {successCount === csvRows.length && successCount > 0 && (
                      <button
                        onClick={onClose}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        סיום
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
