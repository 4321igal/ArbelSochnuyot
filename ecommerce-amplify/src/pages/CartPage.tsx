import { Link } from 'react-router-dom';
import { useCart } from '../lib/cart/CartContext';
import { useAuth } from '../lib/auth/AuthContext';
import { getImageUrl } from '../lib/api/storage';

/**
 * Cart Page
 */
export function CartPage() {
  const { items, itemCount, subtotal, updateQuantity, removeItem, isLoading } = useCart();
  const { isAuthenticated } = useAuth();

  const shipping = subtotal >= 200 ? 0 : 29.90;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <svg className="w-24 h-24 text-gray-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
        <p className="text-gray-600 mb-8">Looks like you haven't added anything to your cart yet.</p>
        <Link
          to="/"
          className="inline-block bg-indigo-600 text-white font-bold px-8 py-3 rounded-lg hover:bg-indigo-700"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Shopping Cart ({itemCount} items)
      </h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-sm p-4 flex gap-4"
            >
              {/* Image */}
              <Link
                to={`/product/${item.productId}`}
                className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0"
              >
                <img
                  src={getImageUrl(item.imageSnapshot)}
                  alt={item.titleSnapshot}
                  className="w-full h-full object-cover"
                />
              </Link>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <Link
                  to={`/product/${item.productId}`}
                  className="font-medium text-gray-900 hover:text-indigo-600 line-clamp-2"
                >
                  {item.titleSnapshot}
                </Link>
                
                <p className="text-lg font-bold text-gray-900 mt-1">
                  ₪{item.priceSnapshot.toFixed(2)}
                </p>

                {/* Quantity */}
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center border border-gray-300 rounded">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={isLoading}
                      className="px-3 py-1 text-gray-600 hover:text-gray-900 disabled:opacity-50"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={isLoading}
                      className="px-3 py-1 text-gray-600 hover:text-gray-900 disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    disabled={isLoading}
                    className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {/* Line Total */}
              <div className="text-right">
                <p className="font-bold text-gray-900">
                  ₪{(item.priceSnapshot * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">₪{subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium">
                  {shipping === 0 ? (
                    <span className="text-green-600">FREE</span>
                  ) : (
                    `₪${shipping.toFixed(2)}`
                  )}
                </span>
              </div>

              {subtotal < 200 && (
                <p className="text-xs text-gray-500">
                  Add ₪{(200 - subtotal).toFixed(2)} more for free shipping!
                </p>
              )}
              
              <hr />
              
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>₪{total.toFixed(2)}</span>
              </div>
            </div>

            <Link
              to={isAuthenticated ? '/checkout' : '/auth?redirect=/checkout'}
              className="block w-full mt-6 bg-indigo-600 text-white text-center font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {isAuthenticated ? 'Proceed to Checkout' : 'Sign In to Checkout'}
            </Link>

            <Link
              to="/"
              className="block w-full mt-3 text-center text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
