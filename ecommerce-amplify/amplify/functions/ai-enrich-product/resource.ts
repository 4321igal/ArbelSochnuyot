import { defineFunction } from '@aws-amplify/backend';

/**
 * AI Enrich Product Lambda Function
 * 
 * Uses OpenAI to generate:
 * - Product summary (Hebrew)
 * - SEO-optimized description
 * - Tags for search/filtering
 * - Confidence score
 */
export const aiEnrichProduct = defineFunction({
  name: 'aiEnrichProduct',
  entry: './handler.ts',
  timeoutSeconds: 60, // OpenAI can be slow
  memoryMB: 512,
  runtime: 20, // Node.js 20
  environment: {
    OPENAI_MODEL: 'gpt-4o-mini',
    TARGET_LANGUAGE: 'he',
    LOG_LEVEL: 'INFO',
  },
  bundling: {
    externalModules: [
      '@aws-sdk/*',
    ],
  },
});
