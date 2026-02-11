import type { Schema } from '../../data/resource';
import { Logger } from '../shared/logger';
import { getSecret } from '../shared/secrets';
import { createDynamoDBClient, updateOrder } from '../shared/dynamodb';

/**
 * Payments Webhook Handler
 * 
 * Event Flow:
 * 1. Receive webhook from payment provider
 * 2. Validate signature using stored secret
 * 3. Parse event type (payment.success, payment.failed, etc.)
 * 4. Update order status in DynamoDB
 * 5. Return 200 to acknowledge receipt
 */

// Types
interface WebhookPayload {
  payload: string;
  signature: string;
}

interface PaymentEvent {
  id: string;
  type: string;
  created: number;
  data: {
    object: {
      id: string;
      amount: number;
      currency: string;
      status: string;
      metadata: {
        orderId: string;
        orderNumber: string;
      };
    };
  };
}

// Initialize
const logger = new Logger('paymentsWebhook');
const dynamodb = createDynamoDBClient();

export const handler: Schema['processPaymentWebhook']['functionHandler'] = async (event) => {
  const startTime = Date.now();
  
  try {
    logger.info('Webhook received', { 
      hasPayload: !!event.arguments.payload,
      hasSignature: !!event.arguments.signature 
    });

    const { payload, signature } = event.arguments;

    // Step 1: Validate signature
    const webhookSecret = await getSecret('amplify/ecommerce/PAYMENT_WEBHOOK_SECRET');
    const isValid = await validateSignature(payload, signature, webhookSecret);
    
    if (!isValid) {
      logger.warn('Invalid webhook signature');
      return {
        success: false,
        error: 'Invalid signature',
        statusCode: 401,
      };
    }

    // Step 2: Parse event
    const paymentEvent = safeParseJson<PaymentEvent>(payload);
    if (!paymentEvent) {
      logger.error('Failed to parse webhook payload');
      return {
        success: false,
        error: 'Invalid payload',
        statusCode: 400,
      };
    }

    logger.info('Processing payment event', { 
      eventId: paymentEvent.id,
      eventType: paymentEvent.type,
    });

    // Step 3: Handle event types
    const result = await handlePaymentEvent(paymentEvent);

    const duration = Date.now() - startTime;
    logger.info('Webhook processed', { 
      eventId: paymentEvent.id,
      success: result.success,
      duration,
    });

    return {
      success: true,
      eventId: paymentEvent.id,
      statusCode: 200,
    };

  } catch (error) {
    logger.error('Webhook processing failed', { 
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return {
      success: false,
      error: 'Internal server error',
      statusCode: 500,
    };
  }
};

/**
 * Validate webhook signature
 * 
 * TODO: Implement actual signature validation based on payment provider
 * - Stripe: HMAC-SHA256
 * - PayPal: Webhook ID verification
 */
async function validateSignature(
  payload: string, 
  signature: string, 
  secret: string
): Promise<boolean> {
  // SKELETON: Implement provider-specific validation
  // 
  // For Stripe:
  // import Stripe from 'stripe';
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  // const event = stripe.webhooks.constructEvent(payload, signature, secret);
  //
  // For now, basic HMAC validation placeholder:
  
  const crypto = await import('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  // Constant-time comparison to prevent timing attacks
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  
  if (sigBuffer.length !== expectedBuffer.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
}

/**
 * Handle different payment event types
 */
async function handlePaymentEvent(event: PaymentEvent): Promise<{ success: boolean }> {
  const { type, data } = event;
  const orderId = data.object.metadata?.orderId;

  if (!orderId) {
    logger.warn('Payment event missing orderId in metadata', { eventId: event.id });
    return { success: false };
  }

  switch (type) {
    case 'payment_intent.succeeded':
    case 'checkout.session.completed':
      await updateOrder(dynamodb, orderId, {
        status: 'PAID',
        paymentRef: data.object.id,
        paidAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      logger.info('Order marked as PAID', { orderId });
      break;

    case 'payment_intent.payment_failed':
      await updateOrder(dynamodb, orderId, {
        status: 'PENDING',
        updatedAt: new Date().toISOString(),
      });
      logger.warn('Payment failed', { orderId, paymentId: data.object.id });
      break;

    case 'charge.refunded':
      await updateOrder(dynamodb, orderId, {
        status: 'REFUNDED',
        updatedAt: new Date().toISOString(),
      });
      logger.info('Order refunded', { orderId });
      break;

    default:
      logger.info('Unhandled event type', { type, eventId: event.id });
  }

  return { success: true };
}

/**
 * Safe JSON parse with type guard
 */
function safeParseJson<T>(json: string): T | null {
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}
