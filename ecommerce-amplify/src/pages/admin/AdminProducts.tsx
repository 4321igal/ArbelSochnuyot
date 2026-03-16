import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { listProducts, deleteProduct, updateProduct, type Product } from '../../lib/api/products';
import { getImageUrl } from '../../lib/api/storage';

/**
 * Admin Products Page - CRUD for products
 */
export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const location = useLocation();
  const createdProductIdRef = useRef<string | null>(null);

  useEffect(() => {
    setSelectedIds(new Set());
    loadProducts();
  }, [filter]);

  // After creating a product, refetch list once after short delay (eventual consistency)
  useEffect(() => {
    const state = location.state as { createdProductId?: string } | null;
    const id = state?.createdProductId;
    if (!id || createdProductIdRef.current === id) return;
    createdProductIdRef.current = id;
    const t = setTimeout(() => {
      loadProducts();
    }, 600);
    return () => clearTimeout(t);
  }, [location.state]);

  const loadProducts = async (token?: string) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await listProducts({
        limit: 20,
        nextToken: token,
        isActive: filter === 'all' ? undefined : filter === 'active',
      });
      
      if (token) {
        setProducts(prev => [...prev, ...result.items]);
      } else {
        setProducts(result.items);
      }
      setNextToken(result.nextToken || null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load products';
      setLoadError(message);
      console.error('Failed to load products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      await updateProduct(product.id, { isActive: !product.isActive });
      setProducts(prev =>
        prev.map(p => p.id === product.id ? { ...p, isActive: !p.isActive } : p)
      );
    } catch (error) {
      console.error('Failed to update product:', error);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await deleteProduct(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map(p => p.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected product(s)?`)) return;

    setDeleting(true);
    try {
      for (const id of selectedIds) {
        try {
          await deleteProduct(id);
        } catch (e) {
          console.error('Failed to delete product:', id, e);
        }
      }
      setProducts(prev => prev.filter(p => !selectedIds.has(p.id)));
      setSelectedIds(new Set());
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500">{products.length} products</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={deleting}
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : `Delete ${selectedIds.size} selected`}
            </button>
          )}
          <Link
            to="/admin/products/new"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700"
          >
            + Add Product
          </Link>
        </div>
      </div>

      {loadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{loadError}</span>
          <button
            type="button"
            onClick={() => loadProducts()}
            className="text-red-800 font-medium hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex gap-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'active' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('inactive')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'inactive' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Inactive
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading && products.length === 0 ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No products found
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={products.length > 0 && selectedIds.size === products.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((product) => (
                <tr key={product.id} className={`hover:bg-gray-50 ${selectedIds.has(product.id) ? 'bg-indigo-50' : ''}`}>
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
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={getImageUrl(product.images?.[0])}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{product.title}</p>
                        <p className="text-sm text-gray-500">{product.sku || 'No SKU'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium">₪{product.price.toFixed(2)}</p>
                    {product.compareAtPrice && (
                      <p className="text-sm text-gray-500 line-through">
                        ₪{product.compareAtPrice.toFixed(2)}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${
                      product.stockQty <= 0 ? 'text-red-600' :
                      product.stockQty <= 5 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {product.stockQty}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(product)}
                      className={`px-2 py-1 text-xs font-bold rounded ${
                        product.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {product.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/admin/products/${product.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Load More */}
        {nextToken && (
          <div className="p-4 text-center border-t">
            <button
              onClick={() => loadProducts(nextToken)}
              disabled={isLoading}
              className="text-indigo-600 hover:text-indigo-700 font-medium disabled:text-gray-400"
            >
              {isLoading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
