/**
 * Schema types – must match backend data model (no schema mutation).
 */
export type FieldType =
  | 'id'
  | 'string'
  | 'integer'
  | 'float'
  | 'boolean'
  | 'datetime'
  | 'json'
  | 'string[]'
  | 'enum';

export interface ForeignKeyRef {
  table: string;
  field: string;
}

export interface SchemaField {
  name: string;
  type: FieldType;
  required: boolean;
  unique?: boolean;
  foreignKey?: ForeignKeyRef;
  enumValues?: string[];
  default?: unknown;
}

export interface SchemaRelation {
  type: 'belongsTo' | 'hasMany' | 'hasOne';
  targetTable: string;
  foreignKeyField: string;
}

export interface SchemaTable {
  name: string;
  fields: SchemaField[];
  relations: SchemaRelation[];
}

export interface AdminSchema {
  tables: SchemaTable[];
}

/**
 * Static schema for CSV import – matches backend data model (Category, Product, ProductSearchMeta).
 * Used when getAdminSchema API is not deployed; keeps import UI and validation working.
 */
const ADMIN_SCHEMA_STATIC: AdminSchema = {
  tables: [
    {
      name: 'Category',
      fields: [
        { name: 'id', type: 'id', required: true, unique: true },
        { name: 'name', type: 'string', required: true },
        { name: 'slug', type: 'string', required: true },
        { name: 'description', type: 'string', required: false },
        { name: 'parentId', type: 'id', required: false, foreignKey: { table: 'Category', field: 'id' } },
        { name: 'imageUrl', type: 'string', required: false },
        { name: 'sortOrder', type: 'integer', required: false, default: 0 },
        { name: 'isActive', type: 'boolean', required: false, default: true },
        { name: 'createdAt', type: 'datetime', required: false },
        { name: 'updatedAt', type: 'datetime', required: false },
      ],
      relations: [
        { type: 'belongsTo', targetTable: 'Category', foreignKeyField: 'parentId' },
        { type: 'hasMany', targetTable: 'Category', foreignKeyField: 'parentId' },
        { type: 'hasMany', targetTable: 'Product', foreignKeyField: 'categoryId' },
      ],
    },
    {
      name: 'Product',
      fields: [
        { name: 'id', type: 'id', required: true, unique: true },
        { name: 'title', type: 'string', required: true },
        { name: 'description', type: 'string', required: false },
        { name: 'price', type: 'float', required: true },
        { name: 'compareAtPrice', type: 'float', required: false },
        { name: 'currency', type: 'string', required: false, default: 'ILS' },
        { name: 'images', type: 'string[]', required: false },
        { name: 'categoryId', type: 'id', required: true, foreignKey: { table: 'Category', field: 'id' } },
        { name: 'brand', type: 'string', required: false },
        { name: 'sku', type: 'string', required: false },
        { name: 'barcode', type: 'string', required: false },
        { name: 'attributes', type: 'json', required: false },
        { name: 'stockQty', type: 'integer', required: false, default: 0 },
        { name: 'lowStockThreshold', type: 'integer', required: false, default: 5 },
        { name: 'isActive', type: 'boolean', required: false, default: true },
        { name: 'isFeatured', type: 'boolean', required: false, default: false },
        { name: 'weight', type: 'float', required: false },
        { name: 'dimensions', type: 'json', required: false },
        { name: 'tags', type: 'string[]', required: false },
        { name: 'createdAt', type: 'datetime', required: false },
        { name: 'updatedAt', type: 'datetime', required: false },
      ],
      relations: [
        { type: 'belongsTo', targetTable: 'Category', foreignKeyField: 'categoryId' },
        { type: 'hasOne', targetTable: 'ProductSearchMeta', foreignKeyField: 'productId' },
        { type: 'hasMany', targetTable: 'CartItem', foreignKeyField: 'productId' },
        { type: 'hasMany', targetTable: 'OrderItem', foreignKeyField: 'productId' },
      ],
    },
    {
      name: 'ProductSearchMeta',
      fields: [
        { name: 'id', type: 'id', required: true, unique: true },
        { name: 'productId', type: 'id', required: true, foreignKey: { table: 'Product', field: 'id' } },
        { name: 'aiSummary', type: 'string', required: false },
        { name: 'aiTags', type: 'string[]', required: false },
        { name: 'aiSEO', type: 'string', required: false },
        { name: 'confidence', type: 'float', required: false },
        { name: 'language', type: 'string', required: false, default: 'he' },
        { name: 'lastEnrichedAt', type: 'datetime', required: false },
        { name: 'enrichmentVersion', type: 'integer', required: false, default: 1 },
        { name: 'createdAt', type: 'datetime', required: false },
        { name: 'updatedAt', type: 'datetime', required: false },
      ],
      relations: [{ type: 'belongsTo', targetTable: 'Product', foreignKeyField: 'productId' }],
    },
  ],
};

/**
 * Returns schema for CSV import (static – matches backend data model).
 * Mapping UI and validation use this; no backend query required.
 */
export async function getAdminSchema(): Promise<AdminSchema> {
  return ADMIN_SCHEMA_STATIC;
}

export function getTable(schema: AdminSchema, tableName: string): SchemaTable | undefined {
  return schema.tables.find((t) => t.name === tableName);
}

export function getField(table: SchemaTable, fieldName: string): SchemaField | undefined {
  return table.fields.find((f) => f.name === fieldName);
}

export function getUniqueFields(table: SchemaTable): SchemaField[] {
  return table.fields.filter((f) => f.unique);
}

export function getRequiredFields(table: SchemaTable): SchemaField[] {
  return table.fields.filter((f) => f.required);
}

export function getForeignKeyFields(table: SchemaTable): SchemaField[] {
  return table.fields.filter((f) => f.foreignKey);
}
