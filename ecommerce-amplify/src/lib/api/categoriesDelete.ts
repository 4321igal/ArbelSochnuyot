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
/** Max concurrent API calls to avoid throttling */
const CONCURRENCY = 12;

export interface DeepDeleteSummary {
  deletedCategoriesCount: number;
  deletedSearchMetaCount: number;
  affectedProductsCount: number;
  errors: Array<{ id: string; reason: string }>;
}

/**
 * Collect all category IDs in the subtree rooted at categoryId (including the root).
 * Fetches children of multiple parents in parallel for speed.
 */
export async function gatherCategorySubtreeIds(categoryId: string): Promise<string[]> {
  const ids: string[] = [categoryId];
  let levelIds: string[] = [categoryId];
  while (levelIds.length > 0) {
    const chunkSize = CONCURRENCY;
    const nextLevel: string[] = [];
    for (let i = 0; i < levelIds.length; i += chunkSize) {
      const chunk = levelIds.slice(i, i + chunkSize);
      const results = await Promise.all(
        chunk.map((parentId) =>
          (async () => {
            const out: string[] = [];
            let nextToken: string | undefined;
            do {
              const { items, nextToken: nt } = await listCategoriesByParentId(parentId, {
                limit: 100,
                nextToken,
              });
              items.forEach((c) => out.push(c.id));
              nextToken = nt ?? undefined;
            } while (nextToken);
            return out;
          })()
        )
      );
      for (const childIds of results) {
        nextLevel.push(...childIds);
        ids.push(...childIds);
      }
    }
    levelIds = nextLevel;
  }
  return ids;
}

/**
 * Collect all product IDs that belong to any of the given category IDs.
 * Runs category queries in parallel (chunks of CONCURRENCY) for speed.
 */
export async function gatherProductIdsByCategoryIds(categoryIds: string[]): Promise<string[]> {
  const productIds = new Set<string>();
  for (let i = 0; i < categoryIds.length; i += CONCURRENCY) {
    const chunk = categoryIds.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      chunk.map((categoryId) =>
        (async () => {
          const out: string[] = [];
          let nextToken: string | undefined;
          do {
            const { items, nextToken: nt } = await listProductIdsByCategoryId(categoryId, {
              limit: 100,
              nextToken,
            });
            items.forEach((p) => out.push(p.id));
            nextToken = nt ?? undefined;
          } while (nextToken);
          return out;
        })()
      )
    );
    results.flat().forEach((id) => productIds.add(id));
  }
  return Array.from(productIds);
}

/**
 * List ProductSearchMeta by productId and delete each. Processes multiple productIds in parallel.
 */
async function deleteProductSearchMetaForProductIds(productIds: string[]): Promise<{ deleted: number; errors: Array<{ id: string; reason: string }> }> {
  let deleted = 0;
  const errors: Array<{ id: string; reason: string }> = [];
  for (let i = 0; i < productIds.length; i += CONCURRENCY) {
    const chunk = productIds.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      chunk.map(async (productId) => {
        const metaIds: string[] = [];
        let nextToken: string | undefined;
        do {
          const { data, nextToken: nt } = await client.models.ProductSearchMeta.list({
            filter: { productId: { eq: productId } },
            limit: 100,
            nextToken,
          });
          nextToken = nt ?? undefined;
          (data || []).forEach((m: { id: string }) => metaIds.push(m.id));
        } while (nextToken);
        return metaIds;
      })
    );
    const allMetaIds = results.flat();
    const deleteResults = await Promise.allSettled(
      allMetaIds.map((id) => client.models.ProductSearchMeta.delete({ id }))
    );
    deleteResults.forEach((r, idx) => {
      if (r.status === 'fulfilled' && !r.value.errors?.length) deleted++;
      else if (r.status === 'rejected')
        errors.push({ id: allMetaIds[idx], reason: r.reason?.message ?? String(r.reason) });
      else if (r.status === 'fulfilled' && r.value.errors?.length)
        errors.push({ id: allMetaIds[idx], reason: r.value.errors[0]?.message ?? 'Delete failed' });
    });
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
 * Delete categories by ID (children first). Deletes in parallel batches of BATCH_SIZE.
 */
async function deleteCategoriesInOrder(
  categoryIds: string[],
  reverseOrder: boolean
): Promise<{ deleted: number; errors: Array<{ id: string; reason: string }> }> {
  const order = reverseOrder ? [...categoryIds].reverse() : categoryIds;
  const errors: Array<{ id: string; reason: string }> = [];
  let deleted = 0;
  for (let i = 0; i < order.length; i += BATCH_SIZE) {
    const batch = order.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(batch.map((id) => deleteCategory(id)));
    results.forEach((r, idx) => {
      if (r.status === 'fulfilled') deleted++;
      else errors.push({ id: batch[idx], reason: (r as PromiseRejectedResult).reason?.message ?? 'Delete failed' });
    });
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
 * Bulk soft-delete categories. Runs in parallel batches. Admin-only in UI.
 */
export async function bulkSoftDeleteCategories(
  categoryIds: string[],
  deletedBy: string
): Promise<BulkSoftDeleteResult> {
  const errors: Array<{ id: string; reason: string }> = [];
  let successCount = 0;
  for (let i = 0; i < categoryIds.length; i += BATCH_SIZE) {
    const batch = categoryIds.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(batch.map((id) => softDeleteCategory(id, deletedBy)));
    results.forEach((r, idx) => {
      if (r.status === 'fulfilled') successCount++;
      else errors.push({ id: batch[idx], reason: (r as PromiseRejectedResult).reason?.message ?? String((r as PromiseRejectedResult).reason) });
    });
  }
  return { successCount, errors };
}

/**
 * Bulk restore soft-deleted categories. Runs in parallel batches.
 */
export async function bulkRestoreCategories(categoryIds: string[]): Promise<BulkSoftDeleteResult> {
  const errors: Array<{ id: string; reason: string }> = [];
  let successCount = 0;
  for (let i = 0; i < categoryIds.length; i += BATCH_SIZE) {
    const batch = categoryIds.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(batch.map((id) => restoreCategory(id)));
    results.forEach((r, idx) => {
      if (r.status === 'fulfilled') successCount++;
      else errors.push({ id: batch[idx], reason: (r as PromiseRejectedResult).reason?.message ?? String((r as PromiseRejectedResult).reason) });
    });
  }
  return { successCount, errors };
}

/**
 * Get category IDs in delete-safe order (children before parents). Fetches getCategoryById in parallel batches.
 */
async function categoryIdsInDeleteOrder(ids: string[]): Promise<string[]> {
  const set = new Set(ids);
  const parentOf = new Map<string, string | null>();
  for (let i = 0; i < ids.length; i += CONCURRENCY) {
    const chunk = ids.slice(i, i + CONCURRENCY);
    const cats = await Promise.all(chunk.map((id) => getCategoryById(id)));
    chunk.forEach((id, idx) => parentOf.set(id, cats[idx]?.parentId ?? null));
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
  const subtrees = await Promise.all(categoryIds.map((id) => gatherCategorySubtreeIds(id)));
  const allCategoryIds = new Set<string>();
  subtrees.forEach((arr) => arr.forEach((x) => allCategoryIds.add(x)));
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
