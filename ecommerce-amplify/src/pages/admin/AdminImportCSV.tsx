import { useState, useCallback } from 'react';
import { Upload, Check, AlertCircle, Plus, Loader2 } from 'lucide-react';
import { uploadCSVImport } from '@/lib/api/storage';
import { listCategories, createProduct } from '@/lib/api/products';
import type { Category } from '@/lib/api/products';

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const parseRow = (row: string): string[] => {
    const out: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
      const c = row[i];
      if (c === '"') inQuotes = !inQuotes;
      else if ((c === ',' && !inQuotes) || (c === '\n' && !inQuotes)) {
        out.push(cur.trim());
        cur = '';
        if (c === '\n') break;
      } else cur += c;
    }
    if (cur.length) out.push(cur.trim());
    return out;
  };
  const rawHeaders = parseRow(lines[0]);
  const headers = rawHeaders.map((h, i) => (h && String(h).trim()) || `Column ${i + 1}`);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseRow(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = cells[idx] ?? '';
    });
    rows.push(row);
  }
  return { headers, rows };
}

/**
 * Admin: העלאת CSV ל-S3, עריכה והוספת מוצרים במהירות.
 */
export function AdminImportCSV() {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [s3Key, setS3Key] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [defaultCategoryId, setDefaultCategoryId] = useState<string>('');
  const [colTitle, setColTitle] = useState<string>('');
  const [colDesc, setColDesc] = useState<string>('');
  const [colPrice, setColPrice] = useState<string>('');
  const [colCategory, setColCategory] = useState<string>('');
  const [colSku, setColSku] = useState<string>('');
  const [addAsActive, setAddAsActive] = useState(true);
  const [addingRow, setAddingRow] = useState<number | null>(null);
  const [addingAll, setAddingAll] = useState(false);

  const loadCategories = useCallback(async () => {
    const list = await listCategories();
    setCategories(list);
    if (list.length && !defaultCategoryId) setDefaultCategoryId(list[0].id);
  }, [defaultCategoryId]);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploadError(null);
      setUploading(true);
      try {
        const { key } = await uploadCSVImport(file);
        setS3Key(key);
        const text = await file.text();
        const { headers: h, rows: r } = parseCSV(text);
        setHeaders(h);
        setRows(r);
        const lower = (s: string) => s.toLowerCase().trim();
        if (h.length && !colTitle) setColTitle(h[0]);
        const descCol = h.find((x) => /^(description|desc|תיאור)$/i.test(lower(x)));
        if (descCol) setColDesc(descCol);
        const priceCol = h.find((x) => /^(price|מחיר)$/i.test(lower(x)));
        if (priceCol) setColPrice(priceCol);
        const catCol = h.find((x) => /^(category|cat|קטגוריה)$/i.test(lower(x)));
        if (catCol) setColCategory(catCol);
        const skuCol = h.find((x) => /^(sku|barcode|ברקוד)$/i.test(lower(x)));
        if (skuCol) setColSku(skuCol);
        const titleCol = h.find((x) => /^(title|name|product|שם|מוצר)$/i.test(lower(x)));
        if (titleCol) setColTitle(titleCol);
        await loadCategories();
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : 'שגיאה בהעלאה');
      } finally {
        setUploading(false);
      }
    },
    [loadCategories, colTitle]
  );

  const setCell = useCallback((rowIndex: number, col: string, value: string) => {
    setRows((prev) => {
      const next = [...prev];
      next[rowIndex] = { ...next[rowIndex], [col]: value };
      return next;
    });
  }, []);

  const getVal = (row: Record<string, string>, col: string) => col ? row[col] ?? '' : '';
  const title = (row: Record<string, string>) => getVal(row, colTitle);
  const desc = (row: Record<string, string>) => getVal(row, colDesc);
  const price = (row: Record<string, string>) => {
    const v = getVal(row, colPrice);
    const n = parseFloat(v);
    return Number.isNaN(n) ? 0 : n;
  };
  const categoryIdForRow = (row: Record<string, string>): string => {
    const name = getVal(row, colCategory)?.trim();
    if (name) {
      const cat = categories.find(
        (c) => c.name === name || c.slug === name.toLowerCase().replace(/\s+/g, '-')
      );
      if (cat) return cat.id;
    }
    return defaultCategoryId;
  };
  const sku = (row: Record<string, string>) => getVal(row, colSku);

  const addRowAsProduct = useCallback(
    async (rowIndex: number) => {
      const row = rows[rowIndex];
      const catId = categoryIdForRow(row);
      if (!catId) {
        alert('בחר קטגוריה ברירת מחדל או הוסף עמודת קטגוריה');
        return;
      }
      const t = title(row)?.trim() || `מוצר ${rowIndex + 1}`;
      setAddingRow(rowIndex);
      try {
        await createProduct({
          title: t,
          description: desc(row) || undefined,
          price: price(row),
          currency: 'ILS',
          categoryId: catId,
          sku: sku(row) || undefined,
          stockQty: 0,
          isActive: addAsActive,
          isFeatured: false,
        });
      } finally {
        setAddingRow(null);
      }
    },
    [rows, defaultCategoryId, categories, colTitle, colDesc, colPrice, colCategory, colSku, addAsActive]
  );

  const addAllAsProducts = useCallback(async () => {
    if (!defaultCategoryId && !rows.some((r) => categoryIdForRow(r))) {
      alert('בחר קטגוריה ברירת מחדל');
      return;
    }
    setAddingAll(true);
    let ok = 0;
    for (let i = 0; i < rows.length; i++) {
      try {
        await addRowAsProduct(i);
        ok++;
      } catch {
        // continue
      }
    }
    setAddingAll(false);
    alert(`נוספו ${ok} מוצרים`);
  }, [rows, defaultCategoryId, addRowAsProduct]);

  const selectNewFile = useCallback(() => {
    setS3Key(null);
    setHeaders([]);
    setRows([]);
    setUploadError(null);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">יבוא CSV</h1>
        <p className="text-gray-600 mt-1">
          העלה קובץ CSV ל-S3, ערוך את הנתונים והוסף מוצרים במהירות.
        </p>
      </div>

      {!s3Key ? (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              הקובץ יועלה ל-S3 ואז תוכל לערוך את השורות ולהוסיף מוצרים בשורה או בכולן.
            </p>
          </div>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
            id="admin-csv-upload"
            disabled={uploading}
          />
          <label
            htmlFor="admin-csv-upload"
            className={`block w-full p-12 border-2 border-dashed rounded-lg text-center transition-all ${
              uploading
                ? 'border-gray-200 bg-gray-50 cursor-wait'
                : 'border-gray-300 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50'
            }`}
          >
            {uploading ? (
              <Loader2 className="mx-auto text-gray-400 mb-3 animate-spin" size={48} />
            ) : (
              <Upload className="mx-auto text-gray-400 mb-3" size={48} />
            )}
            <p className="text-lg font-medium text-gray-700 mb-1">
              {uploading ? 'מעלה ל-S3...' : 'לחץ או גרור קובץ CSV לכאן'}
            </p>
            <p className="text-sm text-gray-500">קובץ CSV עד 10MB</p>
          </label>
          {uploadError && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
              <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
              <p className="text-sm text-red-800">{uploadError}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <Check className="text-green-600 flex-shrink-0" size={24} />
            <div className="flex-1 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-medium text-green-900">הועלה ל-S3</h3>
                <p className="text-sm text-green-800 mt-1 font-mono break-all">{s3Key}</p>
                <p className="text-sm text-green-700 mt-1">{rows.length} שורות</p>
              </div>
              <button
                onClick={selectNewFile}
                className="px-4 py-2 border border-green-300 rounded-lg text-green-800 hover:bg-green-100 text-sm"
              >
                קובץ חדש
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-medium text-gray-800 mb-3">מיפוי עמודות למוצר</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">שם מוצר</label>
                <select
                  value={colTitle}
                  onChange={(e) => setColTitle(e.target.value)}
                  className="w-full border rounded px-2 py-1.5 text-sm"
                >
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">תיאור</label>
                <select
                  value={colDesc}
                  onChange={(e) => setColDesc(e.target.value)}
                  className="w-full border rounded px-2 py-1.5 text-sm"
                >
                  <option value="">—</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">מחיר</label>
                <select
                  value={colPrice}
                  onChange={(e) => setColPrice(e.target.value)}
                  className="w-full border rounded px-2 py-1.5 text-sm"
                >
                  <option value="">—</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">קטגוריה (מעמודה)</label>
                <select
                  value={colCategory}
                  onChange={(e) => setColCategory(e.target.value)}
                  className="w-full border rounded px-2 py-1.5 text-sm"
                >
                  <option value="">—</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">סקו/ברקוד</label>
                <select
                  value={colSku}
                  onChange={(e) => setColSku(e.target.value)}
                  className="w-full border rounded px-2 py-1.5 text-sm"
                >
                  <option value="">—</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">קטגוריה ברירת מחדל</label>
                <select
                  value={defaultCategoryId}
                  onChange={(e) => setDefaultCategoryId(e.target.value)}
                  className="w-full border rounded px-2 py-1.5 text-sm"
                >
                  {categories.length === 0 && (
                    <option value="">— צור קטגוריה קודם —</option>
                  )}
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="addAsActive"
                checked={addAsActive}
                onChange={(e) => setAddAsActive(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="addAsActive" className="text-sm text-gray-700">
                הוסף כפעיל (יוצג בחנות ללקוחות)
              </label>
            </div>
            {colPrice && (
              <p className="text-sm text-gray-600 mb-2">
                מיפוי מחיר: עמודה <strong>{colPrice}</strong> → שדה מחיר במוצר.
              </p>
            )}
            {categories.length === 0 && (
              <p className="text-amber-700 text-sm mb-2">הוסף קטגוריה בעמוד קטגוריות לפני הוספת מוצרים.</p>
            )}

            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-800">עריכת נתונים</h3>
              <button
                onClick={addAllAsProducts}
                disabled={addingAll || rows.length === 0}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {addingAll ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                הוסף את כל המוצרים
              </button>
            </div>

            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {headers.map((h) => (
                      <th key={h} className="px-3 py-2 text-right font-medium text-gray-600 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-right font-medium text-gray-600 w-28">פעולה</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50">
                      {headers.map((col) => (
                        <td key={col} className="px-2 py-1">
                          <input
                            type="text"
                            value={row[col] ?? ''}
                            onChange={(e) => setCell(rowIndex, col, e.target.value)}
                            className="w-full min-w-[80px] border border-gray-200 rounded px-2 py-1 text-sm"
                          />
                        </td>
                      ))}
                      <td className="px-2 py-1">
                        <button
                          onClick={() => addRowAsProduct(rowIndex)}
                          disabled={addingRow !== null}
                          className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-sm disabled:opacity-50"
                        >
                          {addingRow === rowIndex ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Plus size={16} />
                          )}
                          הוסף כמוצר
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
