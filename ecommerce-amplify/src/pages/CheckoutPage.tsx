import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../lib/cart/CartContext';
import { placeOrder, type Address } from '../lib/api/orders';

/**
 * Checkout Page
 */
export function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, items, subtotal, clearCart } = useCart();
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [shippingAddress, setShippingAddress] = useState<Address>({
    firstName: '',
    lastName: '',
    line1: '',
    line2: '',
    city: '',
    postalCode: '',
    country: 'Israel',
    phone: '',
  });
  
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('card');

  const shipping = shippingMethod === 'express' ? 59.90 : shippingMethod === 'pickup' ? 0 : 29.90;
  const total = subtotal + shipping;

  const handleAddressChange = (field: keyof Address, value: string) => {
    setShippingAddress(prev => ({ ...prev, [field]: value }));
  };

  const validateAddress = (): boolean => {
    const required = ['firstName', 'lastName', 'line1', 'city', 'postalCode', 'country'];
    for (const field of required) {
      if (!shippingAddress[field as keyof Address]) {
        setError(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!cart) {
      setError('No cart found');
      return;
    }

    if (!validateAddress()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const order = await placeOrder({
        cartId: cart.id,
        shippingAddress,
        shippingMethod,
        paymentMethod,
      });

      // Clear cart after successful order
      await clearCart();

      // Redirect to order confirmation
      navigate(`/orders?success=${order.orderNumber}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        {['Shipping', 'Payment', 'Review'].map((label, idx) => (
          <div key={label} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step > idx + 1
                  ? 'bg-green-600 text-white'
                  : step === idx + 1
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step > idx + 1 ? '✓' : idx + 1}
            </div>
            <span className="ml-2 text-sm font-medium text-gray-600">{label}</span>
            {idx < 2 && (
              <div className="w-12 h-0.5 bg-gray-200 mx-4" />
            )}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Step 1: Shipping */}
          {step === 1 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Shipping Address</h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.firstName}
                    onChange={(e) => handleAddressChange('firstName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.lastName}
                    onChange={(e) => handleAddressChange('lastName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.line1}
                    onChange={(e) => handleAddressChange('line1', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.line2}
                    onChange={(e) => handleAddressChange('line2', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.city}
                    onChange={(e) => handleAddressChange('city', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.postalCode}
                    onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={shippingAddress.phone}
                    onChange={(e) => handleAddressChange('phone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mt-8 mb-4">Shipping Method</h3>
              <div className="space-y-3">
                {[
                  { id: 'standard', label: 'Standard Shipping', price: 29.90, time: '5-7 business days' },
                  { id: 'express', label: 'Express Shipping', price: 59.90, time: '2-3 business days' },
                  { id: 'pickup', label: 'Store Pickup', price: 0, time: 'Ready in 2 hours' },
                ].map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer ${
                      shippingMethod === method.id
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="shipping"
                        value={method.id}
                        checked={shippingMethod === method.id}
                        onChange={(e) => setShippingMethod(e.target.value)}
                        className="mr-3"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{method.label}</p>
                        <p className="text-sm text-gray-500">{method.time}</p>
                      </div>
                    </div>
                    <span className="font-bold">
                      {method.price === 0 ? 'FREE' : `₪${method.price.toFixed(2)}`}
                    </span>
                  </label>
                ))}
              </div>

              <button
                onClick={() => validateAddress() && setStep(2)}
                className="w-full mt-6 bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700"
              >
                Continue to Payment
              </button>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Method</h2>
              
              <div className="space-y-3">
                {[
                  { id: 'card', label: 'Credit/Debit Card', icon: '💳' },
                  { id: 'paypal', label: 'PayPal', icon: '🅿️' },
                  { id: 'apple', label: 'Apple Pay', icon: '🍎' },
                ].map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-center p-4 border rounded-lg cursor-pointer ${
                      paymentMethod === method.id
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <span className="text-2xl mr-3">{method.icon}</span>
                    <span className="font-medium text-gray-900">{method.label}</span>
                  </label>
                ))}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mt-6">
                <p className="text-sm">
                  <strong>Demo Mode:</strong> No actual payment will be processed. 
                  This is a skeleton implementation.
                </p>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 border border-gray-300 text-gray-700 font-bold py-3 px-4 rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700"
                >
                  Review Order
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Review Your Order</h2>
              
              {/* Shipping Address */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-2">Shipping Address</h3>
                <p className="text-gray-600">
                  {shippingAddress.firstName} {shippingAddress.lastName}<br />
                  {shippingAddress.line1}<br />
                  {shippingAddress.line2 && <>{shippingAddress.line2}<br /></>}
                  {shippingAddress.city}, {shippingAddress.postalCode}<br />
                  {shippingAddress.country}
                </p>
                <button
                  onClick={() => setStep(1)}
                  className="text-indigo-600 text-sm font-medium mt-2"
                >
                  Edit
                </button>
              </div>

              {/* Payment */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-2">Payment Method</h3>
                <p className="text-gray-600 capitalize">{paymentMethod}</p>
                <button
                  onClick={() => setStep(2)}
                  className="text-indigo-600 text-sm font-medium mt-2"
                >
                  Edit
                </button>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 border border-gray-300 text-gray-700 font-bold py-3 px-4 rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  {isSubmitting ? 'Processing...' : `Place Order • ₪${total.toFixed(2)}`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
            
            <div className="space-y-3 mb-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item.titleSnapshot.substring(0, 30)}... × {item.quantity}
                  </span>
                  <span className="font-medium">
                    ₪{(item.priceSnapshot * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            
            <hr className="my-4" />
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>₪{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span>{shipping === 0 ? 'FREE' : `₪${shipping.toFixed(2)}`}</span>
              </div>
            </div>
            
            <hr className="my-4" />
            
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>₪{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
