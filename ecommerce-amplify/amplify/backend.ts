import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { paymentsWebhook } from './functions/payments-webhook/resource';
import { aiEnrichProduct } from './functions/ai-enrich-product/resource';
import { placeOrder } from './functions/place-order/resource';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';

/**
 * AWS Amplify Gen2 Backend Configuration
 * 
 * This defines the complete backend infrastructure for the e-commerce application:
 * - Authentication (Cognito with Admin/Customer groups)
 * - Data (AppSync GraphQL API with DynamoDB)
 * - Storage (S3 for product images)
 * - Functions (Lambda for payments, AI enrichment, order processing)
 */
const backend = defineBackend({
  auth,
  data,
  storage,
  paymentsWebhook,
  aiEnrichProduct,
  placeOrder,
});

// Grant Lambda functions access to Secrets Manager for API keys
const secretsPolicy = new PolicyStatement({
  effect: Effect.ALLOW,
  actions: [
    'secretsmanager:GetSecretValue',
    'ssm:GetParameter',
    'ssm:GetParameters',
  ],
  resources: [
    'arn:aws:secretsmanager:*:*:secret:amplify/ecommerce/*',
    'arn:aws:ssm:*:*:parameter/amplify/ecommerce/*',
  ],
});

// Add secrets access to AI function
backend.aiEnrichProduct.resources.lambda.addToRolePolicy(secretsPolicy);

// Add secrets access to payments webhook
backend.paymentsWebhook.resources.lambda.addToRolePolicy(secretsPolicy);

// Configure CORS for S3 storage bucket
const s3Bucket = backend.storage.resources.bucket;
s3Bucket.addCorsRule({
  allowedHeaders: ['*'],
  allowedMethods: [
    require('aws-cdk-lib/aws-s3').HttpMethods.GET,
    require('aws-cdk-lib/aws-s3').HttpMethods.PUT,
    require('aws-cdk-lib/aws-s3').HttpMethods.POST,
    require('aws-cdk-lib/aws-s3').HttpMethods.DELETE,
    require('aws-cdk-lib/aws-s3').HttpMethods.HEAD,
  ],
  allowedOrigins: [
    'http://localhost:5173',
    'https://*.amplifyapp.com',
    // Add your production domain here
  ],
  exposedHeaders: ['ETag'],
  maxAge: 3000,
});

// Export stack outputs
backend.addOutput({
  custom: {
    apiEndpoint: backend.data.resources.graphqlApi.graphqlUrl,
  },
});
