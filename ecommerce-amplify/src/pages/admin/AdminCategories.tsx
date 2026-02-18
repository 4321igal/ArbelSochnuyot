import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, Plus, Pencil, Trash2, Eye, EyeOff, Upload } from 'lucide-react';
import {
  listAllCategories,
  getProductCountByCategoryMap,
  updateCategory,
  softDeleteCategory,
  type Category,
} from '@/lib/api/products';
import { importCategoriesFromJson, type CategoryImportSummary } from '@/lib/api/categoriesImport';
import {
  bulkSoftDeleteCategories,
  bulkRestoreCategories,
  bulkHardDeleteDeep,
  type DeepDeleteSummary,
} from '@/lib/api/categoriesDelete';
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
  const { isAdmin, userId } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<CategoryWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'disabled' | 'deleted'>('all');
  const [filterRootOnly, setFilterRootOnly] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<CategoryImportSummary | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isAllFilteredSelected, setIsAllFilteredSelected] = useState(false);
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [hardDeleteConfirm, setHardDeleteConfirm] = useState<{ ids: string[]; expected: string } | null>(null);
  const [deepDeleteResult, setDeepDeleteResult] = useState<DeepDeleteSummary | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [allCategories, countMap] = await Promise.all([
        listAllCategories({ includeInactive: true, includeDeleted: true }),
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
    if (filterStatus === 'active') list = list.filter((c) => c.isActive && !c.isDeleted);
    if (filterStatus === 'disabled') list = list.filter((c) => !c.isActive && !c.isDeleted);
    if (filterStatus === 'deleted') list = list.filter((c) => c.isDeleted);
    if (filterRootOnly) list = list.filter((c) => !c.parentId);
    return list.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }, [categories, search, filterStatus, filterRootOnly]);

  const effectiveSelectedIds = useMemo(() => {
    if (isAllFilteredSelected) {
      return filtered.filter((c) => !excludedIds.has(c.id)).map((c) => c.id);
    }
    return Array.from(selectedIds);
  }, [isAllFilteredSelected, excludedIds, selectedIds, filtered]);

  const toggleSelect = useCallback((id: string) => {
    if (isAllFilteredSelected) {
      setExcludedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }
  }, [isAllFilteredSelected]);

  const selectAllOnPage = useCallback(() => {
    const onPage = filtered.map((c) => c.id);
    const allSelected = onPage.every((id) =>
      isAllFilteredSelected ? !excludedIds.has(id) : selectedIds.has(id)
    );
    if (allSelected) {
      if (isAllFilteredSelected) {
        setExcludedIds((prev) => new Set([...prev, ...onPage]));
      } else {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          onPage.forEach((id) => next.delete(id));
          return next;
        });
      }
    } else {
      if (isAllFilteredSelected) {
        setExcludedIds((prev) => {
          const next = new Set(prev);
          onPage.forEach((id) => next.delete(id));
          return next;
        });
      } else {
        setSelectedIds((prev) => new Set([...prev, ...onPage]));
      }
    }
  }, [filtered, isAllFilteredSelected, excludedIds, selectedIds]);

  const selectAllResults = useCallback(() => {
    setIsAllFilteredSelected(true);
    setExcludedIds(new Set());
    setSelectedIds(new Set());
  }, []);

  const clearSelection = useCallback(() => {
    setIsAllFilteredSelected(false);
    setExcludedIds(new Set());
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback(
    (id: string) => {
      if (isAllFilteredSelected) return !excludedIds.has(id);
      return selectedIds.has(id);
    },
    [isAllFilteredSelected, excludedIds, selectedIds]
  );

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
      if (cat.isDeleted) return;
      if (!userId) return;
      if (!confirm(`Soft delete "${cat.name}"?`)) return;
      setActionLoading(cat.id);
      try {
        await softDeleteCategory(cat.id, userId);
        await loadData();
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Failed to delete');
      } finally {
        setActionLoading(null);
      }
    },
    [loadData, userId]
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

  const handleBulkSoftDelete = useCallback(async () => {
    const ids = effectiveSelectedIds;
    if (!ids.length || !userId) return;
    setBulkLoading(true);
    setError(null);
    try {
      const { successCount, errors: errs } = await bulkSoftDeleteCategories(ids, userId);
      if (errs.length) setError(`${successCount} done; ${errs.length} failed: ${errs[0]?.reason}`);
      else setError(null);
      clearSelection();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk soft delete failed');
    } finally {
      setBulkLoading(false);
    }
  }, [effectiveSelectedIds, userId, loadData, clearSelection]);

  const handleBulkRestore = useCallback(async () => {
    const ids = effectiveSelectedIds;
    if (!ids.length) return;
    setBulkLoading(true);
    setError(null);
    try {
      const { successCount, errors: errs } = await bulkRestoreCategories(ids);
      if (errs.length) setError(`${successCount} done; ${errs.length} failed: ${errs[0]?.reason}`);
      else setError(null);
      clearSelection();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk restore failed');
    } finally {
      setBulkLoading(false);
    }
  }, [effectiveSelectedIds, loadData, clearSelection]);

  const handleBulkHardDelete = useCallback(() => {
    const ids = effectiveSelectedIds;
    if (!ids.length || !isAdmin) return;
    setHardDeleteConfirm({
      ids,
      expected: ids.length === 1 ? `DELETE ${ids[0]}` : `DELETE ${ids.length}`,
    });
  }, [effectiveSelectedIds, isAdmin]);

  const confirmHardDelete = useCallback(async () => {
    if (!hardDeleteConfirm) return;
    const { ids } = hardDeleteConfirm;
    setHardDeleteConfirm(null);
    setBulkLoading(true);
    setError(null);
    setDeepDeleteResult(null);
    try {
      const summary = await bulkHardDeleteDeep(ids);
      setDeepDeleteResult(summary);
      clearSelection();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deep delete failed');
    } finally {
      setBulkLoading(false);
    }
  }, [hardDeleteConfirm, loadData, clearSelection]);

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

      {effectiveSelectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <span className="font-medium text-amber-900">
            {effectiveSelectedIds.length} selected
            {isAllFilteredSelected && ` (all ${filtered.length} results)`}
          </span>
          <button
            type="button"
            onClick={clearSelection}
            className="text-sm text-amber-700 hover:underline"
          >
            Clear
          </button>
          <span className="text-gray-400">|</span>
          <button
            type="button"
            onClick={handleBulkSoftDelete}
            disabled={bulkLoading || effectiveSelectedIds.some((id) => categories.find((c) => c.id === id)?.isDeleted)}
            className="rounded bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
          >
            Soft delete
          </button>
          <button
            type="button"
            onClick={handleBulkRestore}
            disabled={bulkLoading || effectiveSelectedIds.every((id) => !categories.find((c) => c.id === id)?.isDeleted)}
            className="rounded bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            Restore
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={handleBulkHardDelete}
              disabled={bulkLoading}
              className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              Hard delete (deep)
            </button>
          )}
        </div>
      )}

      {hardDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <p className="font-medium text-gray-900">Permanent delete</p>
            <p className="mt-2 text-sm text-gray-600">
              This will delete {hardDeleteConfirm.ids.length} category(ies) and all their child categories and products. Type below to confirm.
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Type: <code className="rounded bg-gray-100 px-1">{hardDeleteConfirm.expected}</code>
            </p>
            <input
              type="text"
              placeholder={hardDeleteConfirm.expected}
              className="mt-3 w-full rounded border border-gray-300 px-3 py-2 text-sm"
              id="hard-delete-confirm-input"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setHardDeleteConfirm(null)}
                className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('hard-delete-confirm-input') as HTMLInputElement;
                  if (input?.value?.trim() === hardDeleteConfirm.expected.trim()) {
                    confirmHardDelete();
                  } else {
                    alert('Type the exact confirmation text to proceed.');
                  }
                }}
                className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {deepDeleteResult && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
          <p className="font-medium text-gray-800">Deep delete summary</p>
          <p className="text-gray-600">
            Categories: {deepDeleteResult.deletedCategoriesCount}, Products: {deepDeleteResult.affectedProductsCount}, Search meta: {deepDeleteResult.deletedSearchMetaCount}
          </p>
          {deepDeleteResult.errors.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-red-700">
              {deepDeleteResult.errors.slice(0, 10).map((err, i) => (
                <li key={i}>{err.id}: {err.reason}</li>
              ))}
              {deepDeleteResult.errors.length > 10 && (
                <li>… and {deepDeleteResult.errors.length - 10} more</li>
              )}
            </ul>
          )}
          <button
            type="button"
            onClick={() => setDeepDeleteResult(null)}
            className="mt-2 text-indigo-600 hover:underline"
          >
            Dismiss
          </button>
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
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'disabled' | 'deleted')}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
            <option value="deleted">Deleted</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filterRootOnly}
              onChange={(e) => setFilterRootOnly(e.target.checked)}
            />
            Root only
          </label>
          {filtered.length > 0 && (
            <button
              type="button"
              onClick={isAllFilteredSelected ? clearSelection : selectAllResults}
              className="text-sm text-indigo-600 hover:underline"
            >
              {isAllFilteredSelected ? 'Clear selection' : `Select all ${filtered.length} results`}
            </button>
          )}
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
                  <th className="w-10 px-2 py-3 text-right">
                    <input
                      type="checkbox"
                      checked={filtered.length > 0 && filtered.every((c) => isSelected(c.id))}
                      ref={(el) => {
                        if (!el) return;
                        el.indeterminate =
                          filtered.length > 0 &&
                          filtered.some((c) => isSelected(c.id)) &&
                          !filtered.every((c) => isSelected(c.id));
                      }}
                      onChange={selectAllOnPage}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
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
                  <tr key={cat.id} className={`hover:bg-gray-50 ${isSelected(cat.id) ? 'bg-indigo-50' : ''}`}>
                    <td className="w-10 px-2 py-2">
                      <input
                        type="checkbox"
                        checked={isSelected(cat.id)}
                        onChange={() => toggleSelect(cat.id)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
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
                          cat.isDeleted
                            ? 'text-red-600 font-medium'
                            : cat.isActive
                              ? 'text-green-600 font-medium'
                              : 'text-gray-500'
                        }
                      >
                        {cat.isDeleted ? 'Deleted' : cat.isActive ? 'Active' : 'Disabled'}
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
                          disabled={actionLoading === cat.id || !!cat.isDeleted}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Soft delete"
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
