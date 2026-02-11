import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  GetCommand, 
  PutCommand, 
  QueryCommand, 
  UpdateCommand,
  DeleteCommand,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';

/**
 * DynamoDB Client and Operations
 * 
 * Provides typed access to DynamoDB tables for:
 * - Products
 * - Orders
 * - Carts
 * - ProductSearchMeta
 */

// Types
export interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  images?: string[];
  categoryId: string;
  brand?: string;
  sku?: string;
  attributes?: Record<string, unknown>;
  stockQty: number;
  isActive: boolean;
  isFeatured: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  priceSnapshot: number;
  titleSnapshot: string;
  imageSnapshot?: string;
}

export interface Cart {
  id: string;
  userId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  userId: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  currency: string;
  paymentMethod?: string;
  paymentRef?: string;
  paidAt?: string;
  shippingAddress: unknown;
  billingAddress: unknown;
  shippingMethod: string;
  trackingNumber?: string;
  idempotencyKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  priceSnapshot: number;
  titleSnapshot: string;
  imageSnapshot?: string;
  attributesSnapshot?: unknown;
  createdAt: string;
}

export interface ProductSearchMeta {
  id: string;
  productId: string;
  aiSummary?: string;
  aiTags?: string[];
  aiSEO?: string;
  confidence?: number;
  language: string;
  lastEnrichedAt?: string;
  enrichmentVersion: number;
  createdAt?: string;
  updatedAt: string;
}

// Table names from environment
const getTableName = (model: string): string => {
  return process.env[`${model.toUpperCase()}_TABLE_NAME`] || model;
};

/**
 * Create DynamoDB Document Client
 */
export function createDynamoDBClient(): DynamoDBDocumentClient {
  const client = new DynamoDBClient({});
  return DynamoDBDocumentClient.from(client, {
    marshallOptions: {
      removeUndefinedValues: true,
    },
  });
}

/**
 * Get product by ID
 */
export async function getProduct(
  client: DynamoDBDocumentClient, 
  productId: string
): Promise<Product | null> {
  const command = new GetCommand({
    TableName: getTableName('Product'),
    Key: { id: productId },
  });

  const result = await client.send(command);
  return (result.Item as Product) || null;
}

/**
 * Get cart by ID
 */
export async function getCart(
  client: DynamoDBDocumentClient, 
  cartId: string
): Promise<Cart | null> {
  const command = new GetCommand({
    TableName: getTableName('Cart'),
    Key: { id: cartId },
  });

  const result = await client.send(command);
  return (result.Item as Cart) || null;
}

/**
 * Get cart items by cart ID
 */
export async function getCartItems(
  client: DynamoDBDocumentClient, 
  cartId: string
): Promise<CartItem[]> {
  const command = new QueryCommand({
    TableName: getTableName('CartItem'),
    IndexName: 'byCartId',
    KeyConditionExpression: 'cartId = :cartId',
    ExpressionAttributeValues: {
      ':cartId': cartId,
    },
  });

  const result = await client.send(command);
  return (result.Items as CartItem[]) || [];
}

/**
 * Update order fields
 */
export async function updateOrder(
  client: DynamoDBDocumentClient,
  orderId: string,
  updates: Partial<Order>
): Promise<void> {
  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, unknown> = {};

  Object.entries(updates).forEach(([key, value], index) => {
    const attrName = `#attr${index}`;
    const attrValue = `:val${index}`;
    updateExpressions.push(`${attrName} = ${attrValue}`);
    expressionAttributeNames[attrName] = key;
    expressionAttributeValues[attrValue] = value;
  });

  const command = new UpdateCommand({
    TableName: getTableName('Order'),
    Key: { id: orderId },
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
  });

  await client.send(command);
}

/**
 * Upsert ProductSearchMeta
 */
export async function upsertProductSearchMeta(
  client: DynamoDBDocumentClient,
  meta: ProductSearchMeta
): Promise<ProductSearchMeta> {
  const command = new PutCommand({
    TableName: getTableName('ProductSearchMeta'),
    Item: {
      ...meta,
      createdAt: meta.createdAt || new Date().toISOString(),
    },
  });

  await client.send(command);
  return meta;
}

/**
 * Create order with items in a transaction
 * 
 * This ensures atomic creation of:
 * 1. Order record
 * 2. All OrderItem records
 * 3. Cart status update
 * 4. Stock decrement (optional)
 */
export async function transactWriteOrder(
  client: DynamoDBDocumentClient,
  order: Order,
  cartItems: CartItem[],
  cartId: string
): Promise<Order> {
  const now = new Date().toISOString();

  // Build transaction items
  const transactItems = [
    // Create order
    {
      Put: {
        TableName: getTableName('Order'),
        Item: order,
        ConditionExpression: 'attribute_not_exists(id)',
      },
    },
    // Update cart status to CONVERTED
    {
      Update: {
        TableName: getTableName('Cart'),
        Key: { id: cartId },
        UpdateExpression: 'SET #status = :status, updatedAt = :now',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { 
          ':status': 'CONVERTED',
          ':now': now,
        },
      },
    },
  ];

  // Create order items
  for (const item of cartItems) {
    const orderItem: OrderItem = {
      id: `oi-${order.id}-${item.productId}`,
      orderId: order.id,
      productId: item.productId,
      quantity: item.quantity,
      priceSnapshot: item.priceSnapshot,
      titleSnapshot: item.titleSnapshot,
      imageSnapshot: item.imageSnapshot,
      createdAt: now,
    };

    transactItems.push({
      Put: {
        TableName: getTableName('OrderItem'),
        Item: orderItem,
        ConditionExpression: 'attribute_not_exists(id)',
      },
    });

    // Optionally decrement stock
    // transactItems.push({
    //   Update: {
    //     TableName: getTableName('Product'),
    //     Key: { id: item.productId },
    //     UpdateExpression: 'SET stockQty = stockQty - :qty',
    //     ConditionExpression: 'stockQty >= :qty',
    //     ExpressionAttributeValues: { ':qty': item.quantity },
    //   },
    // });
  }

  // Delete cart items
  for (const item of cartItems) {
    transactItems.push({
      Delete: {
        TableName: getTableName('CartItem'),
        Key: { id: item.id },
      },
    });
  }

  // Execute transaction
  const command = new TransactWriteCommand({
    TransactItems: transactItems,
  });

  await client.send(command);

  return order;
}
