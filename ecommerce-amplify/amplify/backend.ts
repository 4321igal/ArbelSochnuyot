import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { createInquiry } from './functions/create-inquiry/resource';
import { aiEnrichVehicle } from './functions/ai-enrich-vehicle/resource';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { HttpMethods } from 'aws-cdk-lib/aws-s3';

const backend = defineBackend({
  auth,
  data,
  storage,
  createInquiry,
  aiEnrichVehicle,
});

const secretsPolicy = new PolicyStatement({
  effect: Effect.ALLOW,
  actions: [
    'secretsmanager:GetSecretValue',
    'ssm:GetParameter',
    'ssm:GetParameters',
  ],
  resources: [
    'arn:aws:secretsmanager:*:*:secret:amplify/arbel/*',
    'arn:aws:ssm:*:*:parameter/amplify/arbel/*',
  ],
});

backend.aiEnrichVehicle.resources.lambda.addToRolePolicy(secretsPolicy);

const s3Bucket = backend.storage.resources.bucket;
s3Bucket.addCorsRule({
  allowedHeaders: ['*'],
  allowedMethods: [
    HttpMethods.GET,
    HttpMethods.PUT,
    HttpMethods.POST,
    HttpMethods.DELETE,
    HttpMethods.HEAD,
  ],
  allowedOrigins: [
    'http://localhost:5173',
    'https://*.amplifyapp.com',
  ],
  exposedHeaders: ['ETag'],
  maxAge: 3000,
});

backend.addOutput({
  custom: {
    apiEndpoint: backend.data.resources.graphqlApi.graphqlUrl,
  },
});
