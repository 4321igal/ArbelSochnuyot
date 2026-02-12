import type { AdminSchema, SchemaField, SchemaTable } from '@/lib/api/schema';
import { getTable, getField, getUniqueFields } from '@/lib/api/schema';
import { parseByType } from './validation';
import { client } from '@/lib/amplify/client';

export interface RowResult {
  rowIndex: number;
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Resolve FK: e.g. Category by name/slug -> categoryId.
 * Uses existing API – no schema mutation.
 */
async function resolveCategoryId(
  value: string,
  _schema: AdminSchema
): Promise<string | null> {
  const v = String(value).trim();
  if (!v) return null;
  const { data } = await (client as any).models.Category.list({
    filter: {
      or: [
        { name: { eq: v } },
        { slug: { eq: v.toLowerCase().replace(/\s+/g, '-') } },
      ],
    },
    limit: 1,
  });
  const cat = data?.[0];
  return cat?.id ?? null;
}

/**
 * Find existing record by unique field (e.g. sku, barcode). Match only if field exists in table.
 */
async function findExistingByUnique(
  tableName: string,
  fieldName: string,
  value: unknown
): Promise<{ id: string } | null> {
  if (value === undefined || value === null || value === '') return null;
  const model = (client as any).models[tableName];
  if (!model?.list) return null;
  const filter = { [fieldName]: { eq: value } };
  const { data } = await model.list({ filter, limit: 1 });
  const item = data?.[0];
  return item?.id ? { id: item.id } : null;
}

/**
 * Build payload for one row from mapping + schema. Respect types and required.
 */
function buildPayload(
  row: Record<string, string>,
  table: SchemaTable,
  mapping: Record<string, string>,
  fkResolutions: Record<string, string>
): { payload: Record<string, unknown>; error?: string } {
  const payload: Record<string, unknown> = {};
  for (const [csvCol, dbFieldName] of Object.entries(mapping)) {
    if (!dbFieldName) continue;
    const field = getField(table, dbFieldName);
    if (!field) continue;
    const raw = row[csvCol];
    const resolved = field.foreignKey ? fkResolutions[dbFieldName] ?? raw : raw;
    const { value, error } = parseByType(
      resolved !== undefined && resolved !== null ? String(resolved) : undefined,
      field
    );
    if (error && field.required) return { payload: {}, error };
    if (value !== undefined && value !== null && value !== '') {
      payload[dbFieldName] = value;
    } else if (field.default !== undefined) {
      payload[dbFieldName] = field.default;
    }
  }
  return { payload };
}

/**
 * Execute import: respect NOT NULL, UNIQUE, FK. Run in batches; capture DB error per row.
 */
export async function executeImport(
  schema: AdminSchema,
  tableName: string,
  rows: Record<string, string>[],
  mapping: Record<string, string>,
  options: {
    upsertByField?: string; // e.g. 'sku' or 'barcode' – must exist in table and be unique
    batchSize?: number;
  }
): Promise<RowResult[]> {
  const table = getTable(schema, tableName);
  if (!table) {
    return rows.map((_, i) => ({
      rowIndex: i,
      success: false,
      error: 'טבלה לא קיימת בסכמה',
    }));
  }

  const uniqueFields = getUniqueFields(table);
  const upsertField =
    options.upsertByField &&
    uniqueFields.some((f) => f.name === options.upsertByField)
      ? options.upsertByField
      : undefined;

  const batchSize = options.batchSize ?? 5;
  const results: RowResult[] = [];

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (row, batchIdx) => {
        const rowIndex = i + batchIdx;
        try {
          const fkResolutions: Record<string, string> = {};
          for (const [csvCol, dbFieldName] of Object.entries(mapping)) {
            if (!dbFieldName) continue;
            const field = getField(table, dbFieldName);
            if (field?.foreignKey?.table === 'Category' && field.name === 'categoryId') {
              const raw = row[csvCol];
              const id = await resolveCategoryId(raw, schema);
              if (id) fkResolutions[dbFieldName] = id;
              else if (field.required && raw)
                return {
                  rowIndex,
                  success: false,
                  error: `קטגוריה לא נמצאה: ${raw}`,
                };
            }
          }

          const { payload, error } = buildPayload(row, table, mapping, fkResolutions);
          if (error)
            return { rowIndex, success: false, error: `שדה חובה חסר או לא תקין: ${error}` };

          const model = (client as any).models[tableName];
          if (!model?.create || !model?.update) {
            return { rowIndex, success: false, error: 'מודל לא נתמך ליבוא' };
          }

          if (upsertField && payload[upsertField] != null) {
            const existing = await findExistingByUnique(
              tableName,
              upsertField,
              payload[upsertField]
            );
            if (existing) {
              const { data, errors } = await model.update({
                id: existing.id,
                ...payload,
              });
              if (errors?.length)
                return {
                  rowIndex,
                  success: false,
                  error: String(errors[0].message ?? errors[0]),
                };
              return {
                rowIndex,
                success: true,
                id: (data as any)?.id ?? existing.id,
              };
            }
          }

          const { data, errors } = await model.create(payload);
          if (errors?.length)
            return {
              rowIndex,
              success: false,
              error: String(errors[0].message ?? errors[0]),
            };
          return {
            rowIndex,
            success: true,
            id: (data as any)?.id,
          };
        } catch (e) {
          return {
            rowIndex,
            success: false,
            error: e instanceof Error ? e.message : String(e),
          };
        }
      })
    );
    results.push(...batchResults);
  }

  return results;
}
