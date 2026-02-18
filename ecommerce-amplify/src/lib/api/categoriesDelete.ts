import { client } from '@/lib/amplify/client';
import {
  listCategoriesByParentId,
  listProductIdsByCategoryId,
  getCategoryById,
  deleteCategory,
  deleteProduct,
  softDeleteCategory,
  restoreCategory,
} from '@/lib/api/products';

const BATCH_SIZE = 25;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;

export interface DeepDeleteSummary {
  deletedCategoriesCount: number;
  deletedSearchMetaCount: number;
  affectedProductsCount: number;
  errors: Array<{ id: string; reason: string }>;
}

/**
 * Collect all category IDs in the subtree rooted at categoryId (including the root).
 * Uses listCategoriesByParentId with pagination.
 */
export async function gatherCategorySubtreeIds(categoryId: string): Promise<string[]> {
  const ids: string[] = [categoryId];
  const queue: string[] = [categoryId];
  while (queue.length > 0) {
    const parentId = queue.shift()!;
    let nextToken: string | undefined;
    do {
      const { items, nextToken: nt } = await listCategoriesByParentId(parentId, {
        limit: 100,
        nextToken,
      });
      for (const c of items) {
        ids.push(c.id);
        queue.push(c.id);
      }
      nextToken = nt ?? undefined;
    } while (nextToken);
  }
  return ids;
}

/**
 * Collect all product IDs that belong to any of the given category IDs.
 * Paginates per category (Amplify has no "in" filter).
 */
export async function gatherProductIdsByCategoryIds(categoryIds: string[]): Promise<string[]> {
  const productIds = new Set<string>();
  for (const categoryId of categoryIds) {
    let nextToken: string | undefined;
    do {
      const { items, nextToken: nt } = await listProductIdsByCategoryId(categoryId, {
        limit: 100,
        nextToken,
      });
      items.forEach((p) => productIds.add(p.id));
      nextToken = nt ?? undefined;
    } while (nextToken);
  }
  return Array.from(productIds);
}

/**
 * List ProductSearchMeta by productId and delete each. Paginates.
 */
async function deleteProductSearchMetaForProductIds(productIds: string[]): Promise<{ deleted: number; errors: Array<{ id: string; reason: string }> }> {
  let deleted = 0;
  const errors: Array<{ id: string; reason: string }> = [];
  for (const productId of productIds) {
    let nextToken: string | undefined;
    do {
      const { data, nextToken: nt } = await client.models.ProductSearchMeta.list({
        filter: { productId: { eq: productId } },
        limit: 100,
        nextToken,
      });
      nextToken = nt ?? undefined;
      for (const meta of data || []) {
        const id = (meta as { id: string }).id;
        try {
          const { errors: errs } = await client.models.ProductSearchMeta.delete({ id });
          if (errs?.length) throw new Error(errs[0]?.message ?? String(errs[0]));
          deleted++;
        } catch (e) {
          errors.push({ id, reason: e instanceof Error ? e.message : String(e) });
        }
      }
    } while (nextToken);
  }
  return { deleted, errors };
}

/**
 * Delete products by ID in batches with retry. Best-effort; returns count and errors.
 */
async function deleteProductsInBatches(
  productIds: string[]
): Promise<{ deleted: number; errors: Array<{ id: string; reason: string }> }> {
  const errors: Array<{ id: string; reason: string }> = [];
  let deleted = 0;
  for (let i = 0; i < productIds.length; i += BATCH_SIZE) {
    const batch = productIds.slice(i, i + BATCH_SIZE);
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const results = await Promise.allSettled(
        batch.map((id) => deleteProduct(id))
      );
      const failed: string[] = [];
      results.forEach((r, idx) => {
        if (r.status === 'fulfilled') deleted++;
        else failed.push(batch[idx]);
      });
      if (failed.length === 0) break;
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      } else {
        failed.forEach((id) =>
          errors.push({
            id,
            reason: (results[batch.indexOf(id)] as PromiseRejectedResult)?.reason?.message ?? 'Delete failed',
          })
        );
      }
    }
  }
  return { deleted, errors };
}

/**
 * Delete categories by ID in reverse order (children first). No batching needed for categories (no FK from Product once products are gone).
 */
async function deleteCategoriesInOrder(
  categoryIds: string[],
  reverseOrder: boolean
): Promise<{ deleted: number; errors: Array<{ id: string; reason: string }> }> {
  const order = reverseOrder ? [...categoryIds].reverse() : categoryIds;
  const errors: Array<{ id: string; reason: string }> = [];
  let deleted = 0;
  for (const id of order) {
    try {
      await deleteCategory(id);
      deleted++;
    } catch (e) {
      errors.push({ id, reason: e instanceof Error ? e.message : String(e) });
    }
  }
  return { deleted, errors };
}

/**
 * Hard delete a category and its entire subtree (child categories + all products in those categories).
 * Order: 1) Gather subtree category IDs. 2) Gather all product IDs in those categories.
 * 3) Delete ProductSearchMeta for each product. 4) Delete products. 5) Delete categories (leaf-first).
 * Admin-only (enforce in UI).
 */
export async function hardDeleteCategoryDeep(categoryId: string): Promise<DeepDeleteSummary> {
  const summary: DeepDeleteSummary = {
    deletedCategoriesCount: 0,
    deletedSearchMetaCount: 0,
    affectedProductsCount: 0,
    errors: [],
  };

  const categoryIds = await gatherCategorySubtreeIds(categoryId);
  const productIds = await gatherProductIdsByCategoryIds(categoryIds);

  const metaResult = await deleteProductSearchMetaForProductIds(productIds);
  summary.deletedSearchMetaCount = metaResult.deleted;
  summary.errors.push(...metaResult.errors);

  const productResult = await deleteProductsInBatches(productIds);
  summary.affectedProductsCount = productResult.deleted;
  summary.errors.push(...productResult.errors);

  const catResult = await deleteCategoriesInOrder(categoryIds, true);
  summary.deletedCategoriesCount = catResult.deleted;
  summary.errors.push(...catResult.errors);

  return summary;
}

export interface BulkSoftDeleteResult {
  successCount: number;
  errors: Array<{ id: string; reason: string }>;
}

/**
 * Bulk soft-delete categories. Caller must pass deletedBy (e.g. userId). Admin-only in UI.
 */
export async function bulkSoftDeleteCategories(
  categoryIds: string[],
  deletedBy: string
): Promise<BulkSoftDeleteResult> {
  const errors: Array<{ id: string; reason: string }> = [];
  let successCount = 0;
  for (const id of categoryIds) {
    try {
      await softDeleteCategory(id, deletedBy);
      successCount++;
    } catch (e) {
      errors.push({ id, reason: e instanceof Error ? e.message : String(e) });
    }
  }
  return { successCount, errors };
}

/**
 * Bulk restore soft-deleted categories.
 */
export async function bulkRestoreCategories(categoryIds: string[]): Promise<BulkSoftDeleteResult> {
  const errors: Array<{ id: string; reason: string }> = [];
  let successCount = 0;
  for (const id of categoryIds) {
    try {
      await restoreCategory(id);
      successCount++;
    } catch (e) {
      errors.push({ id, reason: e instanceof Error ? e.message : String(e) });
    }
  }
  return { successCount, errors };
}

/**
 * Get category IDs in delete-safe order (children before parents) for a set of ids.
 * Fetches parentId for each; repeatedly deletes ids whose parent is not in set.
 */
async function categoryIdsInDeleteOrder(ids: string[]): Promise<string[]> {
  const set = new Set(ids);
  const parentOf = new Map<string, string | null>();
  for (const id of ids) {
    const cat = await getCategoryById(id);
    parentOf.set(id, cat?.parentId ?? null);
  }
  const order: string[] = [];
  let remaining = new Set(set);
  while (remaining.size > 0) {
    const leaf = Array.from(remaining).find(
      (id) => !parentOf.get(id) || !remaining.has(parentOf.get(id)!)
    );
    if (!leaf) break;
    order.push(leaf);
    remaining.delete(leaf);
  }
  return order;
}

/**
 * Bulk hard-delete categories (deep). Union of all subtrees; delete products and search meta, then categories in child-before-parent order.
 */
export async function bulkHardDeleteDeep(categoryIds: string[]): Promise<DeepDeleteSummary> {
  const summary: DeepDeleteSummary = {
    deletedCategoriesCount: 0,
    deletedSearchMetaCount: 0,
    affectedProductsCount: 0,
    errors: [],
  };
  const allCategoryIds = new Set<string>();
  for (const id of categoryIds) {
    const subtree = await gatherCategorySubtreeIds(id);
    subtree.forEach((x) => allCategoryIds.add(x));
  }
  const categoryIdsList = Array.from(allCategoryIds);
  const productIds = await gatherProductIdsByCategoryIds(categoryIdsList);

  const metaResult = await deleteProductSearchMetaForProductIds(productIds);
  summary.deletedSearchMetaCount = metaResult.deleted;
  summary.errors.push(...metaResult.errors);

  const productResult = await deleteProductsInBatches(productIds);
  summary.affectedProductsCount = productResult.deleted;
  summary.errors.push(...productResult.errors);

  const deleteOrder = await categoryIdsInDeleteOrder(categoryIdsList);
  const catResult = await deleteCategoriesInOrder(deleteOrder, false);
  summary.deletedCategoriesCount = catResult.deleted;
  summary.errors.push(...catResult.errors);

  return summary;
}
