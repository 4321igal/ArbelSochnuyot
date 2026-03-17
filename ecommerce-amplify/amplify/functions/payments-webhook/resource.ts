import { defineFunction } from '@aws-amplify/backend';

/**
 * Payments Webhook Lambda Function
 * 
 * Handles payment provider webhooks (Stripe, PayPal, etc.)
 * - Validates webhook signature
 * - Updates order status based on payment events
 * - Logs all events for audit trail
 */
export const paymentsWebhook = defineFunction({
  name: 'paymentsWebhook',
  entry: './handler.ts',
  timeoutSeconds: 30,
  memoryMB: 256,
  runtime: 22, // Node.js 22.x (Node 20.x EOL Apr 2026)
  environment: {
    PAYMENT_PROVIDER: 'stripe', // or 'paypal', 'checkout', etc.
    LOG_LEVEL: 'INFO',
  },
  bundling: {
    externalModules: [
      '@aws-sdk/*',
    ],
  },
});
