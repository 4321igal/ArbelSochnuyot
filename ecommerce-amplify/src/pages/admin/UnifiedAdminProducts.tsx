import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  listProducts,
  listAllCategories,
  updateProduct,
  softDeleteProduct,
  restoreProduct,
  hardDeleteProduct,
  bulkSoftDelete,
  bulkRestore,
  bulkHardDelete,
  type Product,
  type Category,
  type ProductListStatus,
} from '../../lib/api/products';
import { StorageImage } from '@/components/StorageImage';
import { useAuth } from '../../lib/auth/AuthContext';
import { FilterTabs } from '../../components/adminProducts/FilterTabs';
import { BulkActionsBar } from '../../components/adminProducts/BulkActionsBar';
import ErrorBoundary from '../../components/managerProduct/ErrorBoundary';

export function UnifiedAdminProducts() {
  const { userId, isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [status, setStatus] = useState<ProductListStatus>('active');
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const location = useLocation();
  const createdProductIdRef = useRef<string | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadProducts = useCallback(
    async (token?: string) => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const result = await listProducts({
          limit: 20,
          nextToken: token,
          status,
          search: searchDebounced || undefined,
        });
        if (token) {
          setProducts((prev) => [...prev, ...result.items]);
        } else {
          setProducts(result.items);
        }
        setNextToken(result.nextToken || null);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load products';
        setLoadError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [status, searchDebounced]
  );

  // Single effect: load categories + products in parallel (avoids sequential requests and double loading state)
  useEffect(() => {
    setSelectedIds(new Set());
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);
    (async () => {
      try {
        const [list, result] = await Promise.all([
          listAllCategories({ includeInactive: true, includeDeleted: true }),
          listProducts({ limit: 20, status, search: searchDebounced || undefined }),
        ]);
        if (!cancelled) {
          setCategories(list);
          setProducts(result.items);
          setNextToken(result.nextToken || null);
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Failed to load';
          setLoadError(message);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [status, searchDebounced]);

  useEffect(() => {
    const state = location.state as { createdProductId?: string } | null;
    const id = state?.createdProductId;
    if (!id || createdProductIdRef.current === id) return;
    createdProductIdRef.current = id;
    const t = setTimeout(() => loadProducts(), 600);
    return () => clearTimeout(t);
  }, [location.state, loadProducts]);

  const handleInlineUpdate = async (
    id: string,
    patch: Partial<Pick<Product, 'price' | 'stockQty' | 'isActive' | 'categoryId'>>
  ) => {
    try {
      const updated = await updateProduct(id, patch);
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      showToast('Updated', 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Update failed', 'error');
    }
  };

  const handleSoftDelete = async (id: string) => {
    if (!userId) return;
    if (!confirm('Soft delete this product?')) return;
    try {
      await softDeleteProduct(id, userId);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      showToast('Product soft deleted', 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Delete failed', 'error');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      showToast('Product restored', 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Restore failed', 'error');
    }
  };

  const handleHardDelete = async (id: string) => {
    if (!confirm('Permanently delete this product? This cannot be undone.')) return;
    try {
      await hardDeleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      showToast('Product permanently deleted', 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Delete failed', 'error');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(products.map((p) => p.id)));
  };

  const handleBulkSoftDelete = async () => {
    if (selectedIds.size === 0 || !userId) return;
    if (!confirm(`Soft delete ${selectedIds.size} selected product(s)?`)) return;
    setBulkLoading(true);
    try {
      const { success, failed } = await bulkSoftDelete(Array.from(selectedIds), userId);
      setProducts((prev) => prev.filter((p) => !success.includes(p.id)));
      setSelectedIds(new Set());
      if (failed.length) showToast(`${success.length} deleted; ${failed.length} failed`, 'error');
      else showToast(`${success.length} product(s) soft deleted`, 'success');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkRestore = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Restore ${selectedIds.size} selected product(s)?`)) return;
    setBulkLoading(true);
    try {
      const { success, failed } = await bulkRestore(Array.from(selectedIds));
      setProducts((prev) => prev.filter((p) => !success.includes(p.id)));
      setSelectedIds(new Set());
      if (failed.length) showToast(`${success.length} restored; ${failed.length} failed`, 'error');
      else showToast(`${success.length} product(s) restored`, 'success');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkHardDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Permanently delete ${selectedIds.size} product(s)? This cannot be undone.`)) return;
    setBulkLoading(true);
    try {
      const { success, failed } = await bulkHardDelete(Array.from(selectedIds));
      setProducts((prev) => prev.filter((p) => !success.includes(p.id)));
      setSelectedIds(new Set());
      if (failed.length) showToast(`${success.length} deleted; ${failed.length} failed`, 'error');
      else showToast(`${success.length} product(s) permanently deleted`, 'success');
    } finally {
      setBulkLoading(false);
    }
  };

  const inDeletedView = status === 'deleted';

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {toast && (
          <div
            className={`rounded-lg border px-4 py-3 ${
              toast.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {toast.message}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-500">{products.length} products</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/products/new"
              className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
            >
              + Add Product
            </Link>
            {isAdmin && (
              <Link
                to="/admin/import-csv"
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
              >
                Import CSV
              </Link>
            )}
          </div>
        </div>

        {loadError && (
          <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            <span>{loadError}</span>
            <button
              type="button"
              onClick={() => loadProducts()}
              className="font-medium text-red-800 hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        <div className="rounded-lg bg-white p-4 shadow-sm">
          <FilterTabs
            value={status}
            onChange={setStatus}
            showDeletedTab={!!isAdmin}
            search={search}
            onSearchChange={setSearch}
          />
        </div>

        <BulkActionsBar
          selectedCount={selectedIds.size}
          onClearSelection={() => setSelectedIds(new Set())}
          status={status}
          isAdmin={!!isAdmin}
          onBulkSoftDelete={handleBulkSoftDelete}
          onBulkRestore={handleBulkRestore}
          onBulkHardDelete={handleBulkHardDelete}
          loading={bulkLoading}
        />

        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          {isLoading && products.length === 0 ? (
            <div className="flex p-8 justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-b-transparent" />
            </div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No products found</div>
          ) : (
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={products.length > 0 && selectedIds.size === products.length}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className={`hover:bg-gray-50 ${selectedIds.has(product.id) ? 'bg-indigo-50' : ''}`}
                  >
                    <td className="w-10 px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(product.id)}
                        onChange={() => toggleSelect(product.id)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          <StorageImage
                            keyOrUrl={product.images?.[0]}
                            alt={product.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-gray-900">{product.title}</p>
                          <p className="text-sm text-gray-500">{product.sku || 'No SKU'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={product.categoryId}
                        onChange={(e) =>
                          handleInlineUpdate(product.id, {
                            categoryId: e.target.value,
                          })
                        }
                        className="rounded border border-gray-300 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={product.price}
                        onBlur={(e) => {
                          const v = parseFloat(e.target.value);
                          if (!Number.isNaN(v) && v !== product.price)
                            handleInlineUpdate(product.id, { price: v });
                        }}
                        className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        min="0"
                        defaultValue={product.stockQty}
                        onBlur={(e) => {
                          const v = parseInt(e.target.value, 10);
                          if (!Number.isNaN(v) && v !== product.stockQty)
                            handleInlineUpdate(product.id, { stockQty: v });
                        }}
                        className="w-16 rounded border border-gray-300 px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-6 py-4">
                      {!inDeletedView && (
                        <button
                          type="button"
                          onClick={() =>
                            handleInlineUpdate(product.id, { isActive: !product.isActive })
                          }
                          className={`rounded px-2 py-1 text-xs font-bold ${
                            product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {product.isActive ? 'Active' : 'Inactive'}
                        </button>
                      )}
                      {inDeletedView && (
                        <span className="text-sm text-gray-500">Deleted</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/admin/products/${product.id}/edit`}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                        >
                          Edit
                        </Link>
                        {!inDeletedView && (
                          <button
                            type="button"
                            onClick={() => handleSoftDelete(product.id)}
                            className="text-sm font-medium text-amber-600 hover:text-amber-700"
                          >
                            Delete
                          </button>
                        )}
                        {inDeletedView && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleRestore(product.id)}
                              className="text-sm font-medium text-green-600 hover:text-green-700"
                            >
                              Restore
                            </button>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => handleHardDelete(product.id)}
                                className="text-sm font-medium text-red-600 hover:text-red-700"
                              >
                                Perma delete
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {nextToken && (
            <div className="border-t p-4 text-center">
              <button
                type="button"
                onClick={() => loadProducts(nextToken)}
                disabled={isLoading}
                className="font-medium text-indigo-600 hover:text-indigo-700 disabled:text-gray-400"
              >
                {isLoading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
