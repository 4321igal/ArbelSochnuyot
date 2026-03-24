import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProductGrid } from '../components/product/ProductGrid';
import { listProducts, type Product } from '../lib/api/products';

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Search Page
 * Debounces search so rapid URL/input changes don't trigger multiple API calls.
 */
export function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setProducts([]);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      try {
        const result = await listProducts({ isActive: true, limit: 50 });
        if (cancelled) return;
        const q = debouncedQuery.trim().toLowerCase();
        const filtered = result.items.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q) ||
            p.brand?.toLowerCase().includes(q)
        );
        setProducts(filtered);
      } catch (error) {
        if (!cancelled) console.error('Search failed:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Search Results
      </h1>
      <p className="text-gray-600 mb-8">
        {debouncedQuery ? (
          <>
            {products.length} results for "{debouncedQuery}"
          </>
        ) : (
          'Enter a search term to find products'
        )}
      </p>

      <ProductGrid
        products={products}
        isLoading={isLoading}
        emptyMessage={debouncedQuery ? `No products found for "${debouncedQuery}"` : 'Enter a search term'}
      />
    </div>
  );
}
