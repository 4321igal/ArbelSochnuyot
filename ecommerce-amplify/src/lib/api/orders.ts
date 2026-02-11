import { client } from '../amplify/client';
import { v4 as uuidv4 } from 'uuid';

/**
 * Orders API
 * 
 * Provides methods for order operations
 */

export interface Address {
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

export interface Order {
  id: string;
  userId: string;
  orderNumber: string;
  status: 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  currency: string;
  paymentMethod?: string | null;
  paymentRef?: string | null;
  paidAt?: string | null;
  shippingAddress: Address;
  billingAddress?: Address;
  shippingMethod: string;
  trackingNumber?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  priceSnapshot: number;
  titleSnapshot: string;
  imageSnapshot?: string | null;
}

export interface PlaceOrderInput {
  cartId: string;
  shippingAddress: Address;
  billingAddress?: Address;
  shippingMethod: string;
  paymentMethod: string;
}

/**
 * Place order using Lambda function
 */
export async function placeOrder(input: PlaceOrderInput): Promise<Order> {
  const idempotencyKey = uuidv4();

  const { data, errors } = await client.mutations.placeOrderMutation({
    cartId: input.cartId,
    shippingAddress: input.shippingAddress,
    billingAddress: input.billingAddress || input.shippingAddress,
    shippingMethod: input.shippingMethod,
    paymentMethod: input.paymentMethod,
    idempotencyKey,
  });

  if (errors || !data) {
    throw new Error(errors?.[0]?.message || 'Failed to place order');
  }

  return mapOrder(data);
}

/**
 * Get user's orders
 */
export async function listUserOrders(): Promise<Order[]> {
  const { data } = await client.models.Order.list({
    limit: 50,
  });

  return (data || []).map(mapOrder);
}

/**
 * Get order by ID
 */
export async function getOrder(id: string): Promise<Order | null> {
  const { data } = await client.models.Order.get({ id });

  if (!data) {
    return null;
  }

  const order = mapOrder(data);

  // Fetch order items
  const { data: items } = await client.models.OrderItem.list({
    filter: { orderId: { eq: id } },
  });

  order.items = (items || []).map(item => ({
    id: item.id,
    orderId: item.orderId,
    productId: item.productId,
    quantity: item.quantity,
    priceSnapshot: item.priceSnapshot,
    titleSnapshot: item.titleSnapshot,
    imageSnapshot: item.imageSnapshot,
  }));

  return order;
}

/**
 * List all orders (Admin)
 */
export async function listAllOrders(options?: {
  status?: string;
  limit?: number;
  nextToken?: string;
}): Promise<{ items: Order[]; nextToken?: string | null }> {
  const filter: Record<string, unknown> = {};
  
  if (options?.status) {
    filter.status = { eq: options.status };
  }

  const { data, nextToken } = await client.models.Order.list({
    filter: Object.keys(filter).length > 0 ? filter : undefined,
    limit: options?.limit || 20,
    nextToken: options?.nextToken,
  });

  return {
    items: (data || []).map(mapOrder),
    nextToken,
  };
}

/**
 * Update order status (Admin)
 */
export async function updateOrderStatus(
  id: string, 
  status: Order['status'],
  trackingNumber?: string
): Promise<Order> {
  const { data, errors } = await client.models.Order.update({
    id,
    status,
    trackingNumber,
  });

  if (errors || !data) {
    throw new Error('Failed to update order');
  }

  return mapOrder(data);
}

/**
 * Map API response to Order type
 */
function mapOrder(data: unknown): Order {
  const o = data as Record<string, unknown>;
  return {
    id: o.id as string,
    userId: o.userId as string,
    orderNumber: o.orderNumber as string,
    status: o.status as Order['status'],
    subtotal: o.subtotal as number,
    shippingCost: o.shippingCost as number,
    taxAmount: o.taxAmount as number,
    discountAmount: o.discountAmount as number,
    total: o.total as number,
    currency: (o.currency as string) || 'ILS',
    paymentMethod: o.paymentMethod as string | null,
    paymentRef: o.paymentRef as string | null,
    paidAt: o.paidAt as string | null,
    shippingAddress: o.shippingAddress as Address,
    billingAddress: o.billingAddress as Address,
    shippingMethod: o.shippingMethod as string,
    trackingNumber: o.trackingNumber as string | null,
    createdAt: o.createdAt as string | null,
    updatedAt: o.updatedAt as string | null,
  };
}
