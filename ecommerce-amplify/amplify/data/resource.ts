import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { paymentsWebhook } from '../functions/payments-webhook/resource';
import { aiEnrichProduct } from '../functions/ai-enrich-product/resource';
import { placeOrder } from '../functions/place-order/resource';

/**
 * E-Commerce Data Schema - Amplify Gen2
 * 
 * Models:
 * - Category: Product categories with hierarchical support
 * - Product: Main product catalog
 * - ProductSearchMeta: AI-generated SEO and search metadata
 * - Cart: User shopping cart
 * - CartItem: Items in cart
 * - Order: Completed orders
 * - OrderItem: Items in orders
 * - UserProfile: Extended user information
 * 
 * Authorization:
 * - Public read for catalog (Category, Product, ProductSearchMeta)
 * - Owner-based access for Cart, Order
 * - Admin group has full access
 */

const schema = a.schema({
  // ============================================
  // CATEGORY MODEL
  // ============================================
  Category: a
    .model({
      id: a.id().required(),
      name: a.string().required(),
      slug: a.string().required(),
      description: a.string(),
      parentId: a.id(),
      imageUrl: a.string(),
      sortOrder: a.integer().default(0),
      isActive: a.boolean().default(true),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      // Relationships
      parent: a.belongsTo('Category', 'parentId'),
      children: a.hasMany('Category', 'parentId'),
      products: a.hasMany('Product', 'categoryId'),
    })
    .secondaryIndexes((index) => [
      index('slug'),
      index('parentId').sortKeys(['sortOrder']),
    ])
    .authorization((allow) => [
      allow.guest().to(['read']),
      allow.authenticated().to(['read', 'create']),
      allow.group('Admin').to(['create', 'read', 'update', 'delete']),
    ]),

  // ============================================
  // PRODUCT MODEL
  // ============================================
  Product: a
    .model({
      id: a.id().required(),
      title: a.string().required(),
      description: a.string(),
      price: a.float().required(),
      compareAtPrice: a.float(),
      currency: a.string().default('ILS'),
      images: a.string().array(),
      categoryId: a.id().required(),
      brand: a.string(),
      sku: a.string(),
      barcode: a.string(),
      attributes: a.json(), // { color: "red", size: "XL", ... }
      stockQty: a.integer().default(0),
      lowStockThreshold: a.integer().default(5),
      isActive: a.boolean().default(true),
      isFeatured: a.boolean().default(false),
      weight: a.float(),
      dimensions: a.json(), // { length, width, height }
      tags: a.string().array(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      // Relationships
      category: a.belongsTo('Category', 'categoryId'),
      searchMeta: a.hasOne('ProductSearchMeta', 'productId'),
      cartItems: a.hasMany('CartItem', 'productId'),
      orderItems: a.hasMany('OrderItem', 'productId'),
    })
    .secondaryIndexes((index) => [
      index('categoryId').sortKeys(['createdAt']).name('byCategoryCreatedAt'),
      index('brand').sortKeys(['createdAt']).name('byBrandCreatedAt'),
    ])
    .authorization((allow) => [
      allow.guest().to(['read']),
      allow.authenticated().to(['read', 'create', 'update']),
      allow.group('Admin').to(['create', 'read', 'update', 'delete']),
    ]),

  // ============================================
  // PRODUCT SEARCH META (AI-Generated)
  // ============================================
  ProductSearchMeta: a
    .model({
      id: a.id().required(),
      productId: a.id().required(),
      aiSummary: a.string(),
      aiTags: a.string().array(),
      aiSEO: a.string(),
      confidence: a.float(),
      language: a.string().default('he'),
      lastEnrichedAt: a.datetime(),
      enrichmentVersion: a.integer().default(1),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      // Relationships
      product: a.belongsTo('Product', 'productId'),
    })
    .secondaryIndexes((index) => [
      index('productId'),
    ])
    .authorization((allow) => [
      allow.guest().to(['read']),
      allow.authenticated().to(['read']),
      allow.group('Admin').to(['create', 'read', 'update', 'delete']),
    ]),

  // ============================================
  // CART MODEL
  // ============================================
  Cart: a
    .model({
      id: a.id().required(),
      userId: a.string().required(),
      status: a.enum(['ACTIVE', 'CONVERTED', 'ABANDONED']),
      expiresAt: a.datetime(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      // Relationships
      items: a.hasMany('CartItem', 'cartId'),
    })
    .secondaryIndexes((index) => [
      index('userId').sortKeys(['createdAt']),
    ])
    .authorization((allow) => [
      allow.owner().identityClaim('sub'),
      allow.group('Admin').to(['read']),
    ]),

  // ============================================
  // CART ITEM MODEL
  // ============================================
  CartItem: a
    .model({
      id: a.id().required(),
      cartId: a.id().required(),
      productId: a.id().required(),
      quantity: a.integer().required().default(1),
      // Snapshots for price consistency
      priceSnapshot: a.float().required(),
      titleSnapshot: a.string().required(),
      imageSnapshot: a.string(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      // Relationships
      cart: a.belongsTo('Cart', 'cartId'),
      product: a.belongsTo('Product', 'productId'),
    })
    .secondaryIndexes((index) => [
      index('cartId'),
      index('productId'),
    ])
    .authorization((allow) => [
      allow.owner().identityClaim('sub'),
      allow.group('Admin').to(['read']),
    ]),

  // ============================================
  // ORDER MODEL
  // ============================================
  Order: a
    .model({
      id: a.id().required(),
      userId: a.string().required(),
      orderNumber: a.string().required(),
      status: a.enum(['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
      // Totals
      subtotal: a.float().required(),
      shippingCost: a.float().default(0),
      taxAmount: a.float().default(0),
      discountAmount: a.float().default(0),
      total: a.float().required(),
      currency: a.string().default('ILS'),
      // Payment
      paymentMethod: a.string(),
      paymentRef: a.string(),
      paidAt: a.datetime(),
      // Shipping
      shippingAddress: a.json(),
      billingAddress: a.json(),
      shippingMethod: a.string(),
      trackingNumber: a.string(),
      // Metadata
      notes: a.string(),
      idempotencyKey: a.string(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      // Relationships
      items: a.hasMany('OrderItem', 'orderId'),
      user: a.belongsTo('UserProfile', 'userId'),
    })
    .secondaryIndexes((index) => [
      index('userId').sortKeys(['createdAt']).name('byUserCreatedAt'),
      index('status').sortKeys(['createdAt']).name('byStatusCreatedAt'),
      index('orderNumber'),
      index('idempotencyKey'),
    ])
    .authorization((allow) => [
      allow.owner().identityClaim('sub'),
      allow.group('Admin').to(['create', 'read', 'update', 'delete']),
    ]),

  // ============================================
  // ORDER ITEM MODEL
  // ============================================
  OrderItem: a
    .model({
      id: a.id().required(),
      orderId: a.id().required(),
      productId: a.id().required(),
      quantity: a.integer().required(),
      // Snapshots - immutable record of purchase
      priceSnapshot: a.float().required(),
      titleSnapshot: a.string().required(),
      imageSnapshot: a.string(),
      attributesSnapshot: a.json(),
      createdAt: a.datetime(),
      // Relationships
      order: a.belongsTo('Order', 'orderId'),
      product: a.belongsTo('Product', 'productId'),
    })
    .secondaryIndexes((index) => [
      index('orderId'),
      index('productId'),
    ])
    .authorization((allow) => [
      allow.owner().identityClaim('sub'),
      allow.group('Admin').to(['create', 'read', 'update', 'delete']),
    ]),

  // ============================================
  // USER PROFILE MODEL
  // ============================================
  UserProfile: a
    .model({
      id: a.id().required(),
      userId: a.string().required(),
      email: a.string(),
      firstName: a.string(),
      lastName: a.string(),
      phone: a.string(),
      avatarUrl: a.string(),
      defaultAddressId: a.string(),
      addresses: a.json(), // Array of address objects
      preferences: a.json(), // User preferences
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      // Relationships
      orders: a.hasMany('Order', 'userId'),
    })
    .secondaryIndexes((index) => [
      index('userId'),
      index('email'),
    ])
    .authorization((allow) => [
      allow.owner().identityClaim('sub'),
      allow.group('Admin').to(['read', 'update']),
    ]),

  // ============================================
  // CUSTOM MUTATIONS (Lambda Functions)
  // ============================================
  
  // Place Order - atomic cart to order conversion
  placeOrderMutation: a
    .mutation()
    .arguments({
      cartId: a.string().required(),
      shippingAddress: a.json().required(),
      billingAddress: a.json(),
      shippingMethod: a.string().required(),
      paymentMethod: a.string().required(),
      idempotencyKey: a.string().required(),
    })
    .returns(a.ref('Order'))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(placeOrder)),

  // AI Enrich Product - trigger AI metadata generation
  enrichProductMutation: a
    .mutation()
    .arguments({
      productId: a.string().required(),
    })
    .returns(a.ref('ProductSearchMeta'))
    .authorization((allow) => [allow.group('Admin')])
    .handler(a.handler.function(aiEnrichProduct)),

  // Payments Webhook - handle payment provider callbacks
  processPaymentWebhook: a
    .mutation()
    .arguments({
      payload: a.string().required(),
      signature: a.string().required(),
    })
    .returns(a.json())
    .authorization((allow) => [allow.guest()]) // Webhooks need public access
    .handler(a.handler.function(paymentsWebhook)),

});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 365,
    },
  },
});
