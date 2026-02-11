import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ProductGrid } from '../components/product/ProductGrid';
import { 
  listProductsByCategory, 
  getCategoryBySlug, 
  type Product, 
  type Category 
} from '../lib/api/products';

/**
 * Category Page
 * 
 * Features:
 * - Product listing with pagination
 * - Filters (brand, price range)
 * - Sort options
 */
export function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Filters
  const sortBy = searchParams.get('sort') || 'newest';
  const brand = searchParams.get('brand') || '';

  useEffect(() => {
    async function loadCategory() {
      if (!slug) return;
      
      setIsLoading(true);
      try {
        const cat = await getCategoryBySlug(slug);
        setCategory(cat);
        
        if (cat) {
          const result = await listProductsByCategory(cat.id, { limit: 20 });
          setProducts(result.items);
          setNextToken(result.nextToken || null);
        }
      } catch (error) {
        console.error('Failed to load category:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadCategory();
  }, [slug]);

  const loadMore = async () => {
    if (!category || !nextToken || isLoadingMore) return;
    
    setIsLoadingMore(true);
    try {
      const result = await listProductsByCategory(category.id, { 
        limit: 20, 
        nextToken 
      });
      setProducts(prev => [...prev, ...result.items]);
      setNextToken(result.nextToken || null);
    } catch (error) {
      console.error('Failed to load more products:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleSortChange = (newSort: string) => {
    setSearchParams(prev => {
      prev.set('sort', newSort);
      return prev;
    });
  };

  // Sort products
  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'name':
        return a.title.localeCompare(b.title);
      case 'newest':
      default:
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }
  });

  // Filter by brand
  const filteredProducts = brand
    ? sortedProducts.filter(p => p.brand?.toLowerCase() === brand.toLowerCase())
    : sortedProducts;

  // Get unique brands for filter
  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8" />
        </div>
        <ProductGrid products={[]} isLoading={true} />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Category Not Found</h1>
        <p className="text-gray-600">The category you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
        {category.description && (
          <p className="mt-2 text-gray-600">{category.description}</p>
        )}
        <p className="mt-2 text-sm text-gray-500">
          {filteredProducts.length} products
        </p>
      </div>

      {/* Filters & Sort */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 pb-6 border-b">
        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          {/* Brand Filter */}
          {brands.length > 0 && (
            <select
              value={brand}
              onChange={(e) => {
                setSearchParams(prev => {
                  if (e.target.value) {
                    prev.set('brand', e.target.value);
                  } else {
                    prev.delete('brand');
                  }
                  return prev;
                });
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Brands</option>
              {brands.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          )}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      <ProductGrid 
        products={filteredProducts}
        emptyMessage={`No products found in ${category.name}`}
      />

      {/* Load More */}
      {nextToken && (
        <div className="mt-8 text-center">
          <button
            onClick={loadMore}
            disabled={isLoadingMore}
            className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 disabled:bg-gray-100"
          >
            {isLoadingMore ? 'Loading...' : 'Load More Products'}
          </button>
        </div>
      )}
    </div>
  );
}
