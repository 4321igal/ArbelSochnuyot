import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { listUserOrders, type Order } from '../lib/api/orders';

/**
 * Orders Page - Customer order history
 */
export function OrdersPage() {
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const successOrderNumber = searchParams.get('success');

  useEffect(() => {
    async function loadOrders() {
      try {
        const data = await listUserOrders();
        setOrders(data);
      } catch (error) {
        console.error('Failed to load orders:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadOrders();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'PROCESSING':
      case 'SHIPPED':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
      case 'REFUNDED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

      {/* Success Message */}
      {successOrderNumber && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-lg mb-8">
          <div className="flex items-center">
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p className="font-bold">Order Placed Successfully!</p>
              <p className="text-sm">Order number: {successOrderNumber}</p>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Orders Yet</h2>
          <p className="text-gray-600 mb-6">You haven't placed any orders yet.</p>
          <Link
            to="/"
            className="inline-block bg-indigo-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-indigo-700"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-lg font-bold text-gray-900">
                      Order {order.orderNumber}
                    </h2>
                    <span className={`px-2 py-1 text-xs font-bold rounded ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Placed on {new Date(order.createdAt || '').toLocaleDateString('en-IL', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    ₪{order.total.toFixed(2)}
                  </p>
                  <Link
                    to={`/orders/${order.id}`}
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                  >
                    View Details →
                  </Link>
                </div>
              </div>

              {/* Tracking */}
              {order.trackingNumber && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    Tracking: <span className="font-medium">{order.trackingNumber}</span>
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
