import { IMPORT_SCHEMA } from './schema-data';

/**
 * Returns the import schema (tables, fields, types, required, unique, FKs).
 * Source: schema-data.ts – kept in sync with amplify/schema/import-schema.ts and data/resource.ts.
 */
export const handler = async (): Promise<typeof IMPORT_SCHEMA> => {
  return IMPORT_SCHEMA;
};
