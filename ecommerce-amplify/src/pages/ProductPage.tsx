import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProduct, type Product } from '../lib/api/products';
import { useCart } from '../lib/cart/CartContext';
import { getImageUrl } from '../lib/api/storage';

/**
 * Product Detail Page
 */
export function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const { addItem, isLoading: cartLoading } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const data = await getProduct(id);
        setProduct(data);
      } catch (error) {
        console.error('Failed to load product:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    
    await addItem({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.images?.[0] || undefined,
    }, quantity);
    
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse" />
            <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse" />
            <div className="h-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-12 bg-gray-200 rounded w-1/2 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
        <p className="text-gray-600 mb-8">The product you're looking for doesn't exist.</p>
        <Link to="/" className="text-indigo-600 hover:text-indigo-700 font-medium">
          ← Back to Home
        </Link>
      </div>
    );
  }

  const images = product.images?.filter(Boolean) || [];
  const discount = product.compareAtPrice
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-indigo-600">Home</Link>
        <span className="mx-2">/</span>
        <Link to={`/category/${product.categoryId}`} className="hover:text-indigo-600">
          Category
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{product.title}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Images */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={getImageUrl(images[selectedImage])}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 ${
                    idx === selectedImage ? 'border-indigo-600' : 'border-transparent'
                  }`}
                >
                  <img
                    src={getImageUrl(img)}
                    alt={`${product.title} - ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          {/* Brand */}
          {product.brand && (
            <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">
              {product.brand}
            </p>
          )}

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {product.title}
          </h1>

          {/* Price */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-3xl font-bold text-gray-900">
              ₪{product.price.toFixed(2)}
            </span>
            {product.compareAtPrice && (
              <>
                <span className="text-xl text-gray-500 line-through">
                  ₪{product.compareAtPrice.toFixed(2)}
                </span>
                <span className="bg-red-100 text-red-700 text-sm font-bold px-2 py-1 rounded">
                  Save {discount}%
                </span>
              </>
            )}
          </div>

          {/* Stock */}
          {product.stockQty > 0 ? (
            <p className="text-green-600 font-medium mb-6">
              ✓ In Stock ({product.stockQty} available)
            </p>
          ) : (
            <p className="text-red-600 font-medium mb-6">
              ✕ Out of Stock
            </p>
          )}

          {/* Description */}
          {product.description && (
            <div className="prose prose-gray mb-6">
              <p>{product.description}</p>
            </div>
          )}

          {/* Attributes */}
          {product.attributes && Object.keys(product.attributes).length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Specifications</h3>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(product.attributes).map(([key, value]) => (
                  <div key={key} className="flex">
                    <dt className="text-gray-500 capitalize">{key}:</dt>
                    <dd className="ml-2 text-gray-900">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Add to Cart */}
          {product.stockQty > 0 && (
            <div className="flex gap-4">
              {/* Quantity */}
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  -
                </button>
                <span className="px-4 py-2 font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(product.stockQty, q + 1))}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  +
                </button>
              </div>

              {/* Add Button */}
              <button
                onClick={handleAddToCart}
                disabled={cartLoading}
                className={`flex-1 font-bold py-3 px-6 rounded-lg transition-colors ${
                  addedToCart
                    ? 'bg-green-600 text-white'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                } disabled:bg-gray-400`}
              >
                {addedToCart ? '✓ Added to Cart!' : cartLoading ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>
          )}

          {/* SKU */}
          {product.sku && (
            <p className="text-sm text-gray-500 mt-6">
              SKU: {product.sku}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
