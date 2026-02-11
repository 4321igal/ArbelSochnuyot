import { defineFunction } from '@aws-amplify/backend';

/**
 * Place Order Lambda Function
 * 
 * Atomic order creation:
 * - Converts Cart + CartItems to Order + OrderItems
 * - Validates stock availability
 * - Clears cart after successful order
 * - Supports idempotency to prevent duplicate orders
 */
export const placeOrder = defineFunction({
  name: 'placeOrder',
  entry: './handler.ts',
  timeoutSeconds: 30,
  memoryMB: 512,
  runtime: 20, // Node.js 20
  environment: {
    LOG_LEVEL: 'INFO',
  },
});
