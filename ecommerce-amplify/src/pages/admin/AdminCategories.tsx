import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, Plus, Pencil, Trash2, Eye, EyeOff, Upload } from 'lucide-react';
import {
  listAllCategories,
  getProductCountByCategoryMap,
  updateCategory,
  deleteCategory,
  type Category,
} from '@/lib/api/products';
import { importCategoriesFromJson, type CategoryImportSummary } from '@/lib/api/categoriesImport';
import { useAuth } from '@/lib/auth/AuthContext';
import { CategoryFormModal } from '@/components/admin/CategoryFormModal';

export interface CategoryWithMeta extends Category {
  level: number;
  productCount: number;
  childCount: number;
}

function computeLevelAndChildren(categories: Category[]): Map<string, { level: number; childCount: number }> {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const result = new Map<string, { level: number; childCount: number }>();

  function getLevel(id: string, visited = new Set<string>()): number {
    if (visited.has(id)) return 0;
    visited.add(id);
    const cat = byId.get(id);
    if (!cat?.parentId) return 0;
    return 1 + getLevel(cat.parentId, visited);
  }

  categories.forEach((c) => {
    const level = getLevel(c.id);
    const childCount = categories.filter((x) => x.parentId === c.id).length;
    result.set(c.id, { level, childCount });
  });
  return result;
}

function formatDate(s: string | null | undefined): string {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

export function AdminCategories() {
  const { isAdmin } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<CategoryWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'disabled'>('all');
  const [filterRootOnly, setFilterRootOnly] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<CategoryImportSummary | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [allCategories, countMap] = await Promise.all([
        listAllCategories({ includeInactive: true }),
        getProductCountByCategoryMap(),
      ]);
      const meta = computeLevelAndChildren(allCategories);
      const withMeta: CategoryWithMeta[] = allCategories.map((c) => {
        const { level, childCount } = meta.get(c.id) ?? { level: 0, childCount: 0 };
        return {
          ...c,
          level,
          productCount: countMap[c.id] ?? 0,
          childCount,
        };
      });
      setCategories(withMeta);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const parentName = useMemo(() => {
    const byId = new Map(categories.map((c) => [c.id, c]));
    return (id: string | null | undefined) => {
      if (!id) return '—';
      return byId.get(id)?.name ?? id;
    };
  }, [categories]);

  const filtered = useMemo(() => {
    let list = categories;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q));
    }
    if (filterStatus === 'active') list = list.filter((c) => c.isActive);
    if (filterStatus === 'disabled') list = list.filter((c) => !c.isActive);
    if (filterRootOnly) list = list.filter((c) => !c.parentId);
    return list.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }, [categories, search, filterStatus, filterRootOnly]);

  const handleToggleActive = useCallback(
    async (cat: CategoryWithMeta) => {
      setActionLoading(cat.id);
      try {
        await updateCategory(cat.id, { isActive: !cat.isActive });
        await loadData();
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Failed to update');
      } finally {
        setActionLoading(null);
      }
    },
    [loadData]
  );

  const handleDelete = useCallback(
    async (cat: CategoryWithMeta) => {
      if (cat.childCount > 0) {
        alert('לא ניתן למחוק קטגוריה עם תת-קטגוריות.');
        return;
      }
      if (cat.productCount > 0) {
        alert('לא ניתן למחוק קטגוריה עם מוצרים משויכים.');
        return;
      }
      if (!confirm(`למחוק את "${cat.name}"?`)) return;
      setActionLoading(cat.id);
      try {
        await deleteCategory(cat.id);
        await loadData();
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Failed to delete');
      } finally {
        setActionLoading(null);
      }
    },
    [loadData]
  );

  const handleSave = useCallback(() => {
    setModalOpen(false);
    setEditingCategory(null);
    loadData();
  }, [loadData]);

  const openAdd = () => {
    setEditingCategory(null);
    setModalOpen(true);
  };
  const openEdit = (cat: Category) => {
    setEditingCategory(cat);
    setModalOpen(true);
  };

  const handleImportJson = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file || !isAdmin) return;
      setImportLoading(true);
      setImportResult(null);
      setError(null);
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const summary = await importCategoriesFromJson(Array.isArray(data) ? data : [data]);
        setImportResult(summary);
        await loadData();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Import failed');
      } finally {
        setImportLoading(false);
      }
    },
    [isAdmin, loadData]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleImportJson}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={importLoading}
                className="inline-flex items-center gap-2 border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                <Upload size={18} />
                {importLoading ? 'Importing…' : 'Import JSON'}
              </button>
            </>
          )}
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700"
          >
            <Plus size={18} />
            Add Category
          </button>
        </div>
      </div>

      {importResult && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
          <p className="font-medium text-gray-800">Import summary</p>
          <p className="text-gray-600">
            Inserted: {importResult.insertedCount}, Updated: {importResult.updatedCount}, Skipped: {importResult.skippedCount}
          </p>
          {importResult.errors.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-red-700">
              {importResult.errors.map((err, i) => (
                <li key={i}>
                  Row {err.rowIndex}: {err.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-300 rounded-lg pl-3 pr-9 py-2 text-sm"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'disabled')}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filterRootOnly}
              onChange={(e) => setFilterRootOnly(e.target.checked)}
            />
            Root only
          </label>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">ID</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Category Name</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Slug</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Parent</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Level</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Products</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Order</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Created</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-xs text-gray-500">{cat.id.slice(0, 8)}…</td>
                    <td className="px-4 py-2 font-medium">{cat.name}</td>
                    <td className="px-4 py-2 text-gray-600">{cat.slug}</td>
                    <td className="px-4 py-2">{parentName(cat.parentId)}</td>
                    <td className="px-4 py-2">{cat.level}</td>
                    <td className="px-4 py-2">{cat.productCount}</td>
                    <td className="px-4 py-2">{cat.sortOrder}</td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          cat.isActive
                            ? 'text-green-600 font-medium'
                            : 'text-gray-500'
                        }
                      >
                        {cat.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-500">{formatDate(cat.createdAt)}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(cat)}
                          className="p-1.5 text-gray-600 hover:bg-gray-200 rounded"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(cat)}
                          disabled={actionLoading === cat.id}
                          className="p-1.5 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-50"
                          title={cat.isActive ? 'Disable' : 'Enable'}
                        >
                          {cat.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                          onClick={() => handleDelete(cat)}
                          disabled={actionLoading === cat.id || cat.childCount > 0 || cat.productCount > 0}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="p-8 text-center text-gray-500">No categories match the filters.</div>
        )}
      </div>

      <CategoryFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingCategory(null);
        }}
        onSaved={handleSave}
        editingCategory={editingCategory}
        allCategories={categories as Category[]}
      />
    </div>
  );
}
