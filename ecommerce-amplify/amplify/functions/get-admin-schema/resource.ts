import { defineFunction } from '@aws-amplify/backend';

/**
 * Returns admin import schema (tables, fields, types, required, unique, FKs).
 * Used by CSV import UI for mapping and validation – no schema mutation.
 */
export const getAdminSchema = defineFunction({
  name: 'getAdminSchema',
  entry: './handler.ts',
  timeoutSeconds: 10,
  memoryMB: 128,
  runtime: 20,
});
