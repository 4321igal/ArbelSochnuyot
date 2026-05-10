/**
 * Import schema metadata – single source of truth for CSV import.
 * Must stay in sync with amplify/data/resource.ts (no schema mutation).
 *
 * Used by: getAdminSchema Lambda (returns this), frontend mapping & validation.
 */

export type FieldType =
  | 'id'
  | 'string'
  | 'integer'
  | 'float'
  | 'boolean'
  | 'datetime'
  | 'date'
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

export const IMPORT_SCHEMA: AdminSchema = {
  tables: [
    {
      name: 'Make',
      fields: [
        { name: 'id', type: 'id', required: true, unique: true },
        { name: 'name', type: 'string', required: true },
        { name: 'slug', type: 'string', required: true, unique: true },
        { name: 'logoUrl', type: 'string', required: false },
        { name: 'sortOrder', type: 'integer', required: false, default: 0 },
        { name: 'isActive', type: 'boolean', required: false, default: true },
        { name: 'createdAt', type: 'datetime', required: false },
        { name: 'updatedAt', type: 'datetime', required: false },
      ],
      relations: [
        { type: 'hasMany', targetTable: 'Vehicle', foreignKeyField: 'makeId' },
      ],
    },
    {
      name: 'BodyType',
      fields: [
        { name: 'id', type: 'id', required: true, unique: true },
        { name: 'name', type: 'string', required: true },
        { name: 'slug', type: 'string', required: true, unique: true },
        { name: 'iconUrl', type: 'string', required: false },
        { name: 'sortOrder', type: 'integer', required: false, default: 0 },
        { name: 'isActive', type: 'boolean', required: false, default: true },
        { name: 'createdAt', type: 'datetime', required: false },
        { name: 'updatedAt', type: 'datetime', required: false },
      ],
      relations: [
        { type: 'hasMany', targetTable: 'Vehicle', foreignKeyField: 'bodyTypeId' },
      ],
    },
    {
      name: 'Vehicle',
      fields: [
        { name: 'id', type: 'id', required: true, unique: true },
        { name: 'makeId', type: 'id', required: true, foreignKey: { table: 'Make', field: 'id' } },
        { name: 'modelName', type: 'string', required: true },
        { name: 'trim', type: 'string', required: false },
        { name: 'year', type: 'integer', required: true },
        { name: 'bodyTypeId', type: 'id', required: false, foreignKey: { table: 'BodyType', field: 'id' } },
        { name: 'price', type: 'float', required: true },
        { name: 'listPrice', type: 'float', required: false },
        { name: 'currency', type: 'string', required: false, default: 'ILS' },
        { name: 'mileage', type: 'integer', required: false },
        {
          name: 'transmission',
          type: 'enum',
          required: false,
          enumValues: ['AUTO', 'MANUAL', 'DSG', 'CVT'],
        },
        {
          name: 'fuelType',
          type: 'enum',
          required: false,
          enumValues: ['GASOLINE', 'DIESEL', 'HYBRID', 'ELECTRIC', 'PLUGIN_HYBRID', 'LPG'],
        },
        { name: 'enginePower', type: 'integer', required: false },
        { name: 'engineCapacity', type: 'integer', required: false },
        {
          name: 'driveType',
          type: 'enum',
          required: false,
          enumValues: ['FWD', 'RWD', 'AWD', 'FOUR_WD'],
        },
        { name: 'color', type: 'string', required: false },
        { name: 'interiorColor', type: 'string', required: false },
        { name: 'doors', type: 'integer', required: false },
        { name: 'seats', type: 'integer', required: false },
        { name: 'vin', type: 'string', required: false },
        { name: 'plateNumber', type: 'string', required: false },
        { name: 'firstRegistrationDate', type: 'date', required: false },
        { name: 'hand', type: 'integer', required: false },
        { name: 'previousOwners', type: 'integer', required: false },
        { name: 'accidentFree', type: 'boolean', required: false, default: true },
        { name: 'inspectionExpiryDate', type: 'date', required: false },
        {
          name: 'status',
          type: 'enum',
          required: false,
          enumValues: ['AVAILABLE', 'RESERVED', 'SOLD', 'HIDDEN'],
        },
        { name: 'isFeatured', type: 'boolean', required: false, default: false },
        {
          name: 'condition',
          type: 'enum',
          required: false,
          enumValues: ['NEW', 'USED', 'DEMO'],
        },
        { name: 'description', type: 'string', required: false },
        { name: 'features', type: 'string[]', required: false },
        { name: 'images', type: 'string[]', required: false },
        { name: 'branchLocation', type: 'string', required: false },
        { name: 'createdAt', type: 'datetime', required: false },
        { name: 'updatedAt', type: 'datetime', required: false },
      ],
      relations: [
        { type: 'belongsTo', targetTable: 'Make', foreignKeyField: 'makeId' },
        { type: 'belongsTo', targetTable: 'BodyType', foreignKeyField: 'bodyTypeId' },
        { type: 'hasOne', targetTable: 'VehicleSearchMeta', foreignKeyField: 'vehicleId' },
        { type: 'hasMany', targetTable: 'Inquiry', foreignKeyField: 'vehicleId' },
      ],
    },
    {
      name: 'VehicleSearchMeta',
      fields: [
        { name: 'id', type: 'id', required: true, unique: true },
        { name: 'vehicleId', type: 'id', required: true, foreignKey: { table: 'Vehicle', field: 'id' } },
        { name: 'aiSummary', type: 'string', required: false },
        { name: 'aiHighlights', type: 'string[]', required: false },
        { name: 'aiSEO', type: 'string', required: false },
        { name: 'confidence', type: 'float', required: false },
        { name: 'language', type: 'string', required: false, default: 'he' },
        { name: 'lastEnrichedAt', type: 'datetime', required: false },
        { name: 'enrichmentVersion', type: 'integer', required: false, default: 1 },
        { name: 'createdAt', type: 'datetime', required: false },
        { name: 'updatedAt', type: 'datetime', required: false },
      ],
      relations: [
        { type: 'belongsTo', targetTable: 'Vehicle', foreignKeyField: 'vehicleId' },
      ],
    },
  ],
};
