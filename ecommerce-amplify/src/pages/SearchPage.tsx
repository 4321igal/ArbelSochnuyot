import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProductGrid } from '../components/product/ProductGrid';
import { listProducts, type Product } from '../lib/api/products';
import { useEffect } from 'react';

/**
 * Search Page
 */
export function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function search() {
      setIsLoading(true);
      try {
        // Note: This is a basic implementation
        // For production, implement search via OpenSearch or DynamoDB
        const result = await listProducts({ isActive: true, limit: 50 });
        
        // Client-side filter (not ideal for production)
        const filtered = result.items.filter(p => 
          p.title.toLowerCase().includes(query.toLowerCase()) ||
          p.description?.toLowerCase().includes(query.toLowerCase()) ||
          p.brand?.toLowerCase().includes(query.toLowerCase())
        );
        
        setProducts(filtered);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (query) {
      search();
    } else {
      setProducts([]);
      setIsLoading(false);
    }
  }, [query]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Search Results
      </h1>
      <p className="text-gray-600 mb-8">
        {query ? (
          <>
            {products.length} results for "{query}"
          </>
        ) : (
          'Enter a search term to find products'
        )}
      </p>

      <ProductGrid 
        products={products} 
        isLoading={isLoading}
        emptyMessage={query ? `No products found for "${query}"` : 'Enter a search term'}
      />
    </div>
  );
}
