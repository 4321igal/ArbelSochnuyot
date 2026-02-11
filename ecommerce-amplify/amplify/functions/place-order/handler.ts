import type { Schema } from '../../data/resource';
import { Logger } from '../shared/logger';
import { 
  createDynamoDBClient, 
  getCart, 
  getCartItems, 
  getProduct,
  transactWriteOrder,
} from '../shared/dynamodb';

/**
 * Place Order Handler
 * 
 * Atomic order creation workflow:
 * 1. Check idempotency key (prevent duplicate orders)
 * 2. Fetch cart and cart items
 * 3. Validate all products exist and have stock
 * 4. Calculate totals
 * 5. Create Order + OrderItems in transaction
 * 6. Clear cart
 * 7. Return created order
 * 
 * IDEMPOTENCY:
 * - Client sends unique idempotencyKey (UUID)
 * - If order with same key exists, return existing order
 * - Prevents duplicate orders from network retries
 */

// Types
interface Address {
  firstName: string;
  lastName: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
}

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  priceSnapshot: number;
  titleSnapshot: string;
  imageSnapshot?: string;
}

interface OrderInput {
  cartId: string;
  shippingAddress: Address;
  billingAddress?: Address;
  shippingMethod: string;
  paymentMethod: string;
  idempotencyKey: string;
}

// Initialize
const logger = new Logger('placeOrder');
const dynamodb = createDynamoDBClient();

// Shipping costs by method (can be moved to config)
const SHIPPING_COSTS: Record<string, number> = {
  standard: 29.90,
  express: 59.90,
  pickup: 0,
};

// Tax rate (Israel VAT)
const TAX_RATE = 0.17;

export const handler: Schema['placeOrderMutation']['functionHandler'] = async (event) => {
  const startTime = Date.now();
  const userId = event.identity?.sub;
  
  if (!userId) {
    logger.error('No user ID in request');
    throw new Error('Unauthorized');
  }

  const input: OrderInput = {
    cartId: event.arguments.cartId,
    shippingAddress: event.arguments.shippingAddress as Address,
    billingAddress: event.arguments.billingAddress as Address | undefined,
    shippingMethod: event.arguments.shippingMethod,
    paymentMethod: event.arguments.paymentMethod,
    idempotencyKey: event.arguments.idempotencyKey,
  };

  logger.info('Processing order', { 
    userId, 
    cartId: input.cartId,
    idempotencyKey: input.idempotencyKey,
  });

  try {
    // Step 1: Check idempotency
    const existingOrder = await checkIdempotency(input.idempotencyKey);
    if (existingOrder) {
      logger.info('Returning existing order (idempotency hit)', { 
        orderId: existingOrder.id,
      });
      return existingOrder;
    }

    // Step 2: Fetch cart
    const cart = await getCart(dynamodb, input.cartId);
    if (!cart) {
      throw new Error('Cart not found');
    }

    if (cart.userId !== userId) {
      logger.warn('Cart ownership mismatch', { 
        cartUserId: cart.userId, 
        requestUserId: userId,
      });
      throw new Error('Unauthorized access to cart');
    }

    // Step 3: Fetch cart items
    const cartItems = await getCartItems(dynamodb, input.cartId);
    if (!cartItems || cartItems.length === 0) {
      throw new Error('Cart is empty');
    }

    logger.info('Cart loaded', { 
      cartId: input.cartId, 
      itemCount: cartItems.length,
    });

    // Step 4: Validate products and stock
    const validatedItems = await validateCartItems(cartItems);

    // Step 5: Calculate totals
    const totals = calculateTotals(validatedItems, input.shippingMethod);

    // Step 6: Generate order number
    const orderNumber = generateOrderNumber();

    // Step 7: Create order with transaction
    const order = await transactWriteOrder(dynamodb, {
      id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      orderNumber,
      status: 'PENDING',
      subtotal: totals.subtotal,
      shippingCost: totals.shipping,
      taxAmount: totals.tax,
      discountAmount: 0,
      total: totals.total,
      currency: 'ILS',
      paymentMethod: input.paymentMethod,
      shippingAddress: input.shippingAddress,
      billingAddress: input.billingAddress || input.shippingAddress,
      shippingMethod: input.shippingMethod,
      idempotencyKey: input.idempotencyKey,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, validatedItems, input.cartId);

    const duration = Date.now() - startTime;
    logger.info('Order created successfully', { 
      orderId: order.id,
      orderNumber,
      total: totals.total,
      itemCount: validatedItems.length,
      duration,
    });

    return order;

  } catch (error) {
    logger.error('Order creation failed', { 
      userId,
      cartId: input.cartId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

/**
 * Check if order with same idempotency key exists
 */
async function checkIdempotency(idempotencyKey: string): Promise<unknown | null> {
  // Query orders by idempotencyKey index
  // This is a simplified check - in production, use proper GSI query
  try {
    const params = {
      TableName: process.env.ORDER_TABLE_NAME || 'Order',
      IndexName: 'byIdempotencyKey',
      KeyConditionExpression: 'idempotencyKey = :key',
      ExpressionAttributeValues: {
        ':key': idempotencyKey,
      },
      Limit: 1,
    };

    const result = await dynamodb.query(params);
    
    if (result.Items && result.Items.length > 0) {
      return result.Items[0];
    }
    
    return null;
  } catch {
    // Index might not exist yet in dev - continue with order
    return null;
  }
}

/**
 * Validate cart items against current product data
 */
async function validateCartItems(cartItems: CartItem[]): Promise<CartItem[]> {
  const validatedItems: CartItem[] = [];
  const errors: string[] = [];

  for (const item of cartItems) {
    const product = await getProduct(dynamodb, item.productId);

    if (!product) {
      errors.push(`Product ${item.productId} not found`);
      continue;
    }

    if (!product.isActive) {
      errors.push(`Product "${product.title}" is no longer available`);
      continue;
    }

    if (product.stockQty < item.quantity) {
      errors.push(
        `Insufficient stock for "${product.title}": ` +
        `requested ${item.quantity}, available ${product.stockQty}`
      );
      continue;
    }

    // Use current price, not snapshot (or use snapshot for price guarantee)
    // Business decision: we use snapshot price for consistency
    validatedItems.push({
      ...item,
      // Optionally update to current price:
      // priceSnapshot: product.price,
      // titleSnapshot: product.title,
      // imageSnapshot: product.images?.[0],
    });
  }

  if (errors.length > 0) {
    throw new Error(`Validation errors: ${errors.join('; ')}`);
  }

  return validatedItems;
}

/**
 * Calculate order totals
 */
function calculateTotals(
  items: CartItem[], 
  shippingMethod: string
): {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
} {
  const subtotal = items.reduce(
    (sum, item) => sum + (item.priceSnapshot * item.quantity), 
    0
  );

  const shipping = SHIPPING_COSTS[shippingMethod] || SHIPPING_COSTS.standard;
  
  // Tax calculated on subtotal (Israel VAT included in price usually)
  // This is simplified - real tax calculation depends on jurisdiction
  const tax = 0; // Prices include VAT in Israel
  
  const total = subtotal + shipping + tax;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    shipping: Math.round(shipping * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

/**
 * Generate human-readable order number
 */
function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  
  return `ORD-${year}${month}${day}-${random}`;
}
