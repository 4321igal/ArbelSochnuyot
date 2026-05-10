import { defineFunction } from '@aws-amplify/backend';

export const createInquiry = defineFunction({
  name: 'createInquiry',
  entry: './handler.ts',
  timeoutSeconds: 15,
  memoryMB: 256,
  runtime: 22,
  environment: {
    LOG_LEVEL: 'INFO',
  },
  bundling: {
    externalModules: ['@aws-sdk/*'],
  },
});
