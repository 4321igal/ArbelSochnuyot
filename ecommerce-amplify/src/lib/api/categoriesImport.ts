import { client } from '@/lib/amplify/client';
import {
  listAllCategories,
  updateCategory,
  deleteCategory,
  normalizeSlug,
  type Category,
} from '@/lib/api/products';

/**
 * JSON import row: 1:1 with Category table columns.
 * id optional (for insert we can let backend generate, or provide for upsert).
 * Required: name, slug.
 */
export interface CategoryImportRow {
  id?: string;
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  imageUrl?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CategoryImportSummary {
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
  errors: Array<{ rowIndex: number; reason: string }>;
}

type RollbackAction =
  | { type: 'delete'; id: string }
  | { type: 'update'; id: string; previous: Partial<Category> };

function validateRow(row: unknown, _rowIndex: number): { ok: true; data: CategoryImportRow } | { ok: false; reason: string } {
  if (row === null || typeof row !== 'object' || Array.isArray(row)) {
    return { ok: false, reason: 'Row must be an object' };
  }
  const r = row as Record<string, unknown>;
  const name = r.name;
  const slug = r.slug;
  if (name === undefined || name === null) {
    return { ok: false, reason: 'Missing required field: name' };
  }
  if (typeof name !== 'string' || !name.trim()) {
    return { ok: false, reason: 'name must be a non-empty string' };
  }
  if (slug === undefined || slug === null) {
    return { ok: false, reason: 'Missing required field: slug' };
  }
  if (typeof slug !== 'string' || !normalizeSlug(slug)) {
    return { ok: false, reason: 'slug must be a non-empty string' };
  }
  if (r.id !== undefined && r.id !== null && typeof r.id !== 'string') {
    return { ok: false, reason: 'id must be a string when provided' };
  }
  if (r.parentId !== undefined && r.parentId !== null && typeof r.parentId !== 'string') {
    return { ok: false, reason: 'parentId must be a string or null when provided' };
  }
  if (r.sortOrder !== undefined && r.sortOrder !== null) {
    const n = Number(r.sortOrder);
    if (Number.isNaN(n) || !Number.isInteger(n)) {
      return { ok: false, reason: 'sortOrder must be an integer' };
    }
  }
  if (r.isActive !== undefined && r.isActive !== null && typeof r.isActive !== 'boolean') {
    return { ok: false, reason: 'isActive must be a boolean when provided' };
  }

  const data: CategoryImportRow = {
    name: (name as string).trim(),
    slug: normalizeSlug(slug as string),
    description: r.description as string | null | undefined,
    parentId: r.parentId === null || r.parentId === undefined ? undefined : (r.parentId as string),
    imageUrl: r.imageUrl as string | null | undefined,
    sortOrder: r.sortOrder !== undefined && r.sortOrder !== null ? Number(r.sortOrder) : 0,
    isActive: r.isActive !== undefined && r.isActive !== null ? Boolean(r.isActive) : true,
  };
  if (r.id !== undefined && r.id !== null) data.id = String(r.id).trim() || undefined;
  if (data.parentId === '') data.parentId = null;

  return { ok: true, data };
}

async function rollback(actions: RollbackAction[]): Promise<void> {
  for (let i = actions.length - 1; i >= 0; i--) {
    const a = actions[i];
    try {
      if (a.type === 'delete') {
        await deleteCategory(a.id);
      } else {
        await updateCategory(a.id, a.previous);
      }
    } catch {
      // best-effort; log in dev if needed
    }
  }
}

/**
 * Import categories from a JSON array. Admin-only (caller must enforce).
 * - Validates required fields (name, slug) and types.
 * - Enforces unique slug (per row; existing DB + earlier rows in file).
 * - Supports hierarchy: parentId may be null or reference existing or earlier row.
 * - Upsert: id exists in DB -> update; else insert (with id from JSON if provided).
 * - Best-effort atomic: on first failure, rolls back created/updated rows.
 */
export async function importCategoriesFromJson(
  rows: unknown[]
): Promise<CategoryImportSummary> {
  const summary: CategoryImportSummary = {
    insertedCount: 0,
    updatedCount: 0,
    skippedCount: 0,
    errors: [],
  };

  if (!Array.isArray(rows)) {
    summary.errors.push({ rowIndex: 0, reason: 'Input must be a JSON array' });
    return summary;
  }

  const existingCategories = await listAllCategories({ includeInactive: true, includeDeleted: true });
  const existingIds = new Set(existingCategories.map((c) => c.id));
  const existingSlugs = new Set(existingCategories.map((c) => c.slug.toLowerCase()));
  const idToPrevious = new Map<string, Partial<Category>>();
  const rollbackActions: RollbackAction[] = [];
  const slugsUsedInImport = new Map<string, string>(); // slug -> id that claimed it
  const idsCreatedInImport = new Set<string>();
  const resolvedParentIds = new Set(existingIds); // ids that can be used as parentId (DB + earlier rows)

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const validated = validateRow(rows[rowIndex], rowIndex);
    if (!validated.ok) {
      summary.errors.push({ rowIndex, reason: validated.reason });
      summary.skippedCount++;
      continue;
    }
    const row = validated.data;

    if (row.parentId != null && row.parentId !== '') {
      if (!resolvedParentIds.has(row.parentId)) {
        summary.errors.push({
          rowIndex,
          reason: `parentId "${row.parentId}" does not exist in DB or earlier in file`,
        });
        summary.skippedCount++;
        continue;
      }
    }

    const slugKey = row.slug.toLowerCase();
    const existingId = row.id && existingIds.has(row.id) ? row.id : null;
    const slugTakenByOther = existingCategories.some(
      (c) => c.slug.toLowerCase() === slugKey && c.id !== row.id
    );
    const slugClaimedInFile = slugsUsedInImport.get(slugKey);
    if (slugClaimedInFile && slugClaimedInFile !== row.id) {
      summary.errors.push({ rowIndex, reason: `Duplicate slug in file: "${row.slug}"` });
      summary.skippedCount++;
      continue;
    }
    if (existingId && slugTakenByOther) {
      summary.errors.push({ rowIndex, reason: `Slug "${row.slug}" already used by another category` });
      summary.skippedCount++;
      continue;
    }
    if (!existingId && existingSlugs.has(slugKey)) {
      summary.errors.push({ rowIndex, reason: `Slug "${row.slug}" already exists in database` });
      summary.skippedCount++;
      continue;
    }

    try {
      if (row.id && existingIds.has(row.id)) {
        const existing = existingCategories.find((c) => c.id === row.id)!;
        const previous: Partial<Category> = {
          name: existing.name,
          slug: existing.slug,
          description: existing.description,
          parentId: existing.parentId,
          imageUrl: existing.imageUrl,
          sortOrder: existing.sortOrder,
          isActive: existing.isActive,
        };
        await updateCategory(row.id, {
          name: row.name,
          slug: row.slug,
          description: row.description ?? undefined,
          parentId: row.parentId ?? undefined,
          imageUrl: row.imageUrl ?? undefined,
          sortOrder: row.sortOrder ?? 0,
          isActive: row.isActive ?? true,
        });
        idToPrevious.set(row.id, previous);
        rollbackActions.push({ type: 'update', id: row.id, previous });
        summary.updatedCount++;
        slugsUsedInImport.set(slugKey, row.id);
      } else {
        const createPayload: Record<string, unknown> = {
          name: row.name,
          slug: row.slug,
          description: row.description ?? undefined,
          parentId: row.parentId ?? undefined,
          imageUrl: row.imageUrl ?? undefined,
          sortOrder: row.sortOrder ?? 0,
          isActive: row.isActive ?? true,
        };
        if (row.id && row.id.trim()) {
          createPayload.id = row.id.trim();
        }
        const res = (await client.models.Category.create(createPayload)) as unknown as {
          data?: { id: string } | { id: string }[];
          errors?: { message?: string }[];
        };
        if (res.errors?.length) {
          throw new Error(res.errors[0]?.message ?? 'Create failed');
        }
        const data = Array.isArray(res.data) ? res.data[0] : res.data;
        const createdId = data?.id ?? (row.id && row.id.trim() ? row.id.trim() : undefined);
        if (createdId) {
          idsCreatedInImport.add(createdId);
          rollbackActions.push({ type: 'delete', id: createdId });
        }
        summary.insertedCount++;
        slugsUsedInImport.set(slugKey, createdId ?? row.id ?? '');
        if (createdId) resolvedParentIds.add(createdId);
        if (row.id?.trim()) resolvedParentIds.add(row.id.trim());
      }
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e);
      summary.errors.push({ rowIndex, reason });
      await rollback(rollbackActions);
      return summary;
    }
  }

  return summary;
}
