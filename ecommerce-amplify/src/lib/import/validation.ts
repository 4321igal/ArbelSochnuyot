import type { AdminSchema, SchemaField, SchemaTable } from '@/lib/api/schema';
import { getField, getTable } from '@/lib/api/schema';

export interface ValidationError {
  rowIndex: number;
  field: string;
  message: string;
  value?: unknown;
}

const ISO_DATETIME =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/;

/**
 * Type-safe parsing by DB type. Reject invalid before execution.
 */
export function parseByType(
  raw: string | undefined,
  field: SchemaField
): { value: unknown; error?: string } {
  const empty = raw === undefined || raw === null || String(raw).trim() === '';
  if (empty) {
    if (field.required) return { value: undefined, error: 'שדה חובה' };
    return { value: undefined };
  }
  const s = String(raw).trim();

  switch (field.type) {
    case 'id':
    case 'string':
      return { value: s };
    case 'integer': {
      const n = parseInt(s, 10);
      if (Number.isNaN(n)) return { value: undefined, error: 'ערך מספרי לא תקין' };
      return { value: n };
    }
    case 'float': {
      const f = parseFloat(s);
      if (Number.isNaN(f)) return { value: undefined, error: 'ערך עשרוני לא תקין' };
      return { value: f };
    }
    case 'boolean': {
      const lower = s.toLowerCase();
      if (['true', '1', 'yes', 'כן'].includes(lower)) return { value: true };
      if (['false', '0', 'no', 'לא'].includes(lower)) return { value: false };
      return { value: undefined, error: 'ערך בוליאני לא תקין (true/false)' };
    }
    case 'datetime': {
      if (ISO_DATETIME.test(s)) return { value: s };
      const d = new Date(s);
      if (Number.isNaN(d.getTime())) return { value: undefined, error: 'תאריך לא תקין (ISO מומלץ)' };
      return { value: d.toISOString() };
    }
    case 'json': {
      try {
        const parsed = JSON.parse(s);
        return { value: parsed };
      } catch {
        return { value: undefined, error: 'JSON לא תקין' };
      }
    }
    case 'string[]': {
      if (s.startsWith('[')) {
        try {
          const arr = JSON.parse(s);
          if (!Array.isArray(arr)) return { value: undefined, error: 'מערך לא תקין' };
          return { value: arr.map(String) };
        } catch {
          return { value: undefined, error: 'מערך JSON לא תקין' };
        }
      }
      return { value: s.split(',').map((x) => x.trim()).filter(Boolean) };
    }
    case 'enum': {
      const allowed = field.enumValues ?? [];
      if (allowed.length && !allowed.includes(s)) {
        return { value: undefined, error: `ערך חוקי: ${allowed.join(', ')}` };
      }
      return { value: s };
    }
    default:
      return { value: s };
  }
}

/**
 * Validate one row against table schema. Respect required, types; FK validated at execution.
 */
export function validateRow(
  row: Record<string, string>,
  table: SchemaTable,
  mapping: Record<string, string>,
  rowIndex: number
): ValidationError[] {
  const errors: ValidationError[] = [];
  for (const [csvCol, dbFieldName] of Object.entries(mapping)) {
    if (!dbFieldName) continue;
    const field = getField(table, dbFieldName);
    if (!field) continue;
    const raw = row[csvCol];
    const { error } = parseByType(raw, field);
    if (error) {
      errors.push({ rowIndex, field: dbFieldName, message: error, value: raw });
    }
  }
  return errors;
}

/**
 * Validate all rows. Returns flat list of errors; no schema mutation.
 */
export function validateRows(
  schema: AdminSchema,
  tableName: string,
  rows: Record<string, string>[],
  mapping: Record<string, string>
): ValidationError[] {
  const table = getTable(schema, tableName);
  if (!table) return [{ rowIndex: 0, field: '', message: 'טבלה לא קיימת בסכמה' }];
  const errors: ValidationError[] = [];
  for (let i = 0; i < rows.length; i++) {
    errors.push(...validateRow(rows[i], table, mapping, i));
  }
  return errors;
}
