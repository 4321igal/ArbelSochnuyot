import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { generateClient } from 'aws-amplify/data';

const client = generateClient<any>();

type Order = any;
type OrderItem = any;

const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending', description: 'Order received, awaiting confirmation' },
  { value: 'confirmed', label: 'Confirmed', description: 'Payment confirmed, preparing order' },
  { value: 'processing', label: 'Processing', description: 'Order is being processed' },
  { value: 'shipped', label: 'Shipped', description: 'Order has been shipped' },
  { value: 'delivered', label: 'Delivered', description: 'Order delivered to customer' },
  { value: 'cancelled', label: 'Cancelled', description: 'Order has been cancelled' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  processing: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  shipped: 'bg-purple-100 text-purple-800 border-purple-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

export function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadOrder(id);
    }
  }, [id]);

  async function loadOrder(orderId: string) {
    setLoading(true);
    setError(null);
    try {
      const { data: orderData, errors } = await client.models.Order.get({ id: orderId });
      
      if (errors || !orderData) {
        setError('Order not found');
        return;
      }

      setOrder(orderData);

      // Load order items
      const { data: itemsData } = await client.models.OrderItem.list({
        filter: { orderId: { eq: orderId } },
      });
      setItems(itemsData);
    } catch (err) {
      console.error('Error loading order:', err);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  }

  async function updateOrderStatus(newStatus: string) {
    if (!order) return;
    
    setUpdating(true);
    try {
      const { data, errors } = await client.models.Order.update({
        id: order.id,
        status: newStatus,
      });

      if (errors) {
        throw new Error('Failed to update status');
      }

      setOrder(data);
    } catch (err) {
      console.error('Error updating order:', err);
      alert('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  }

  function formatDate(dateString: string | null | undefined) {
    if (!dateString) return '-';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  }

  function formatCurrency(amount: number | null | undefined) {
    if (amount == null) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900">{error || 'Order not found'}</h3>
        <Link to="/admin/orders" className="mt-4 inline-block text-indigo-600 hover:text-indigo-500">
          ← Back to Orders
        </Link>
      </div>
    );
  }

  const shippingAddress = order.shippingAddress as { 
    street?: string; 
    city?: string; 
    state?: string; 
    postalCode?: string; 
    country?: string;
  } | null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/orders')}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </h1>
            <p className="text-sm text-gray-500">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-medium border ${STATUS_COLORS[order.status ?? 'pending']}`}>
          {order.status?.charAt(0).toUpperCase()}{order.status?.slice(1)}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 py-4 border-b last:border-0">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.productName}</h3>
                    <p className="text-sm text-gray-500">
                      SKU: {item.productSku || '-'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {formatCurrency(item.price)} × {item.quantity}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatCurrency((item.price ?? 0) * (item.quantity ?? 0))}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Totals */}
            <div className="mt-6 pt-6 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900">{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discountAmount && order.discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Discount</span>
                  <span className="text-green-600">-{formatCurrency(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Shipping</span>
                <span className="text-gray-900">{formatCurrency(order.shippingCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax</span>
                <span className="text-gray-900">{formatCurrency(order.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Status Update */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ORDER_STATUSES.map((status) => (
                <button
                  key={status.value}
                  onClick={() => updateOrderStatus(status.value)}
                  disabled={updating || order.status === status.value}
                  className={`p-3 rounded-lg border-2 text-left transition-colors ${
                    order.status === status.value
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="font-medium text-gray-900">{status.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{status.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 uppercase">Name</label>
                <p className="text-gray-900">{order.customerName || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Email</label>
                <p className="text-gray-900">{order.customerEmail || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Phone</label>
                <p className="text-gray-900">{order.customerPhone || '-'}</p>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h2>
            {shippingAddress ? (
              <div className="text-gray-700">
                <p>{shippingAddress.street}</p>
                <p>
                  {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
                </p>
                <p>{shippingAddress.country}</p>
              </div>
            ) : (
              <p className="text-gray-500">No shipping address provided</p>
            )}
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 uppercase">Status</label>
                <p className={`font-medium ${
                  order.paymentStatus === 'paid' ? 'text-green-600' :
                  order.paymentStatus === 'failed' ? 'text-red-600' :
                  'text-yellow-600'
                }`}>
                  {order.paymentStatus?.charAt(0).toUpperCase()}{order.paymentStatus?.slice(1) || 'Pending'}
                </p>
              </div>
              {order.paymentIntentId && (
                <div>
                  <label className="text-xs text-gray-500 uppercase">Payment ID</label>
                  <p className="text-gray-900 font-mono text-sm break-all">
                    {order.paymentIntentId}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Notes</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}

          {/* Order Metadata */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Info</h2>
            <div className="space-y-3 text-sm">
              <div>
                <label className="text-xs text-gray-500 uppercase">Order ID</label>
                <p className="text-gray-900 font-mono">{order.id}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Created</label>
                <p className="text-gray-900">{formatDate(order.createdAt)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Last Updated</label>
                <p className="text-gray-900">{formatDate(order.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
