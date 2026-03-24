import { memo } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../../lib/api/products';
import { useCart } from '../../lib/cart/CartContext';
import { StorageImage } from '@/components/StorageImage';

/**
 * Product Card Component
 * Memoized to avoid re-renders when parent list updates (e.g. scroll, unrelated state).
 */
interface ProductCardProps {
  product: Product;
  showAddToCart?: boolean;
}

function ProductCardInner({ product, showAddToCart = true }: ProductCardProps) {
  const { addItem, isLoading } = useCart();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    await addItem({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.images?.[0] || undefined,
    });
  };

  const discount = product.compareAtPrice
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : 0;

  return (
    <Link
      to={`/product/${product.id}`}
      className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <StorageImage
          keyOrUrl={product.images?.[0]}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Discount Badge */}
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            -{discount}%
          </span>
        )}

        {/* Out of Stock */}
        {product.stockQty <= 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white text-gray-800 font-bold px-4 py-2 rounded">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Brand */}
        {product.brand && (
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            {product.brand}
          </p>
        )}

        {/* Title */}
        <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">
          {product.title}
        </h3>

        {/* Price */}
        <div className="mt-2 flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900">
            ₪{product.price.toFixed(2)}
          </span>
          {product.compareAtPrice && (
            <span className="text-sm text-gray-500 line-through">
              ₪{product.compareAtPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Add to Cart */}
        {showAddToCart && product.stockQty > 0 && (
          <button
            onClick={handleAddToCart}
            disabled={isLoading}
            className="mt-3 w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
          >
            {isLoading ? 'Adding...' : 'Add to Cart'}
          </button>
        )}

        {/* Low Stock Warning */}
        {product.stockQty > 0 && product.stockQty <= 5 && (
          <p className="mt-2 text-xs text-orange-600">
            Only {product.stockQty} left in stock!
          </p>
        )}
      </div>
    </Link>
  );
}

export const ProductCard = memo(ProductCardInner);
