import { defineFunction } from '@aws-amplify/backend';

export const aiEnrichVehicle = defineFunction({
  name: 'aiEnrichVehicle',
  entry: './handler.ts',
  timeoutSeconds: 60,
  memoryMB: 512,
  runtime: 22,
  environment: {
    OPENAI_MODEL: 'gpt-4o-mini',
    TARGET_LANGUAGE: 'he',
    LOG_LEVEL: 'INFO',
  },
  bundling: {
    externalModules: ['@aws-sdk/*'],
  },
});
