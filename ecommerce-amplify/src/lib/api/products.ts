import { client, type PaginationOptions, type PaginatedResult } from '../amplify/client';

/**
 * Product API
 * 
 * Provides typed methods for product operations
 */

export type ProductListStatus = 'active' | 'inactive' | 'deleted' | 'all';

export interface Product {
  id: string;
  title: string;
  description?: string | null;
  price: number;
  compareAtPrice?: number | null;
  currency: string;
  images?: (string | null)[] | null;
  categoryId: string;
  brand?: string | null;
  sku?: string | null;
  attributes?: Record<string, unknown> | null;
  stockQty: number;
  isActive: boolean;
  isFeatured: boolean;
  tags?: (string | null)[] | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  deletedAt?: string | null;
  deletedBy?: string | null;
  deleteReason?: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  imageUrl?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

/**
 * List products with pagination and optional status (active / inactive / deleted / all).
 * Excludes soft-deleted by default when status is active/inactive; deleted tab shows only soft-deleted.
 */
export async function listProducts(
  options?: PaginationOptions & {
    categoryId?: string;
    brand?: string;
    isActive?: boolean;
    isFeatured?: boolean;
    status?: ProductListStatus;
    search?: string;
  }
): Promise<PaginatedResult<Product>> {
  const filter: Record<string, unknown> = {};
  if (options?.categoryId) filter.categoryId = { eq: options.categoryId };
  if (options?.brand) filter.brand = { eq: options.brand };
  if (options?.isFeatured !== undefined) filter.isFeatured = { eq: options.isFeatured };
  const status = options?.status ?? 'active';
  if (status === 'active' || status === 'inactive') {
    filter.isActive = { eq: status === 'active' };
  }

  const limit = options?.limit || 20;
  const { data, nextToken } = await client.models.Product.list({
    filter: Object.keys(filter).length > 0 ? filter : undefined,
    limit: status === 'all' || status === 'deleted' ? Math.min(limit * 3, 100) : limit,
    nextToken: options?.nextToken,
  });

  let items = (data || []).map(mapProduct) as Product[];

  if (status === 'deleted') {
    items = items.filter((p) => p.deletedAt != null);
  } else if (status === 'active' || status === 'inactive') {
    items = items.filter((p) => p.deletedAt == null);
  }

  if (options?.search?.trim()) {
    const q = options.search.trim().toLowerCase();
    items = items.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q)) ||
        (p.sku?.toLowerCase().includes(q)) ||
        (p.brand?.toLowerCase().includes(q))
    );
  }

  return {
    items: items.slice(0, limit),
    nextToken: items.length > limit ? nextToken : undefined,
  };
}

/**
 * Get product by ID
 */
export async function getProduct(id: string): Promise<Product | null> {
  const { data, errors } = await client.models.Product.get({ id });
  
  if (errors || !data) {
    return null;
  }

  return mapProduct(data);
}

/**
 * List featured products
 */
export async function listFeaturedProducts(limit = 8): Promise<Product[]> {
  const { data } = await client.models.Product.list({
    filter: {
      isActive: { eq: true },
      isFeatured: { eq: true },
    },
    limit,
  });

  const items = (data || []).map(mapProduct).filter((p) => p.deletedAt == null);
  return items;
}

/**
 * List products by category (excludes soft-deleted)
 */
export async function listProductsByCategory(
  categoryId: string,
  options?: PaginationOptions
): Promise<PaginatedResult<Product>> {
  const { data, nextToken } = await client.models.Product.list({
    filter: {
      categoryId: { eq: categoryId },
      isActive: { eq: true },
    },
    limit: options?.limit || 20,
    nextToken: options?.nextToken,
  });

  const items = (data || []).map(mapProduct).filter((p) => p.deletedAt == null);
  return {
    items,
    nextToken,
  };
}

/**
 * List all categories (for storefront – active only).
 * Paginates to return all categories (Amplify default limit would cap results).
 */
export async function listCategories(): Promise<Category[]> {
  const all: Category[] = [];
  let nextToken: string | undefined;
  do {
    const { data, nextToken: nt } = await client.models.Category.list({
      filter: { isActive: { eq: true } },
      limit: 100,
      nextToken,
    });
    all.push(...(data || []).map(mapCategory));
    nextToken = nt ?? undefined;
  } while (nextToken);
  return all;
}

/**
 * List all categories for admin (optional filter by isActive).
 * Paginates to return all categories.
 */
export async function listAllCategories(options?: {
  includeInactive?: boolean;
}): Promise<Category[]> {
  const filter = options?.includeInactive ? undefined : { isActive: { eq: true } };
  const all: Category[] = [];
  let nextToken: string | undefined;
  do {
    const { data, nextToken: nt } = await client.models.Category.list({
      filter,
      limit: 100,
      nextToken,
    });
    all.push(...(data || []).map(mapCategory));
    nextToken = nt ?? undefined;
  } while (nextToken);
  return all;
}

/**
 * Get category by ID
 */
export async function getCategoryById(id: string): Promise<Category | null> {
  const { data, errors } = await client.models.Category.get({ id });
  if (errors || !data) return null;
  return mapCategory(data);
}

/**
 * Get product count for a category (for admin table)
 */
export async function getProductCountByCategoryId(categoryId: string): Promise<number> {
  const { data } = await client.models.Product.list({
    filter: { categoryId: { eq: categoryId } },
    limit: 5000,
  });
  return data?.length ?? 0;
}

/**
 * Check if a category slug is already used (excludeId for edit mode)
 */
export async function categorySlugExists(slug: string, excludeId?: string): Promise<boolean> {
  const { data } = await client.models.Category.list({
    filter: { slug: { eq: slug } },
    limit: 10,
  });
  if (!data?.length) return false;
  if (excludeId) return data.some((c: any) => c.id !== excludeId);
  return true;
}

/**
 * Get product count per category (for admin table – one pass over products)
 */
export async function getProductCountByCategoryMap(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  let nextToken: string | undefined;
  do {
    const { data, nextToken: nt } = await client.models.Product.list({
      limit: 100,
      nextToken,
    });
    nextToken = nt ?? undefined;
    for (const p of data || []) {
      const cid = (p as any).categoryId;
      if (cid) counts[cid] = (counts[cid] || 0) + 1;
    }
  } while (nextToken);
  return counts;
}

/**
 * Normalize slug for consistent URLs: lowercase, spaces to hyphens, strip invalid chars.
 */
function normalizeSlug(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-\u0590-\u05FF]/g, '');
}

/**
 * Get category by slug (returns category even if inactive – UI can show "unavailable").
 * Tries exact match first, then case-insensitive match so /category/barpintotest2 finds "BarPintoTest2".
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const trimmed = slug?.trim() || '';
  if (!trimmed) return null;

  const { data } = await client.models.Category.list({
    filter: { slug: { eq: trimmed } },
    limit: 1,
  });

  if (data?.length) {
    return mapCategory(data[0]);
  }

  // Fallback: slug in DB might have different casing (e.g. "BarPintoTest2")
  const all = await listAllCategories({ includeInactive: true });
  const slugLower = trimmed.toLowerCase();
  const found = all.find((c) => c.slug.toLowerCase() === slugLower);
  return found ?? null;
}

function mapCategory(cat: any): Category {
  return {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    parentId: cat.parentId,
    imageUrl: cat.imageUrl,
    sortOrder: cat.sortOrder || 0,
    isActive: cat.isActive ?? true,
    createdAt: cat.createdAt ?? null,
    updatedAt: cat.updatedAt ?? null,
  };
}

/**
 * Create category
 */
export async function createCategory(input: {
  name: string;
  slug?: string;
  description?: string | null;
  parentId?: string | null;
  imageUrl?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}): Promise<Category> {
  const slug =
    (input.slug && normalizeSlug(input.slug)) ||
    (input.name.trim() && normalizeSlug(input.name)) ||
    `cat-${Date.now()}`;
  const res = (await client.models.Category.create({
    name: input.name.trim(),
    slug,
    description: input.description ?? undefined,
    parentId: input.parentId ?? undefined,
    imageUrl: input.imageUrl ?? undefined,
    sortOrder: input.sortOrder ?? 0,
    isActive: input.isActive ?? true,
  })) as { data?: unknown; errors?: { message?: string }[] };
  const data = Array.isArray(res.data) ? res.data[0] : res.data;
  const errors = res.errors;

  if (errors?.length || !data) {
    throw new Error(errors?.[0]?.message || 'Failed to create category');
  }
  return mapCategory(data);
}

/**
 * Update category
 */
export async function updateCategory(
  id: string,
  input: Partial<Pick<Category, 'name' | 'slug' | 'description' | 'parentId' | 'imageUrl' | 'sortOrder' | 'isActive'>>
): Promise<Category> {
  const payload = { ...input };
  if (payload.slug !== undefined) {
    payload.slug = normalizeSlug(payload.slug) || payload.slug;
  }
  const { data, errors } = await client.models.Category.update({
    id,
    ...payload,
  });
  if (errors?.length || !data) {
    throw new Error(errors?.[0]?.message || 'Failed to update category');
  }
  return mapCategory(data);
}

/**
 * Delete category (fails if has children or products – check in UI first)
 */
export async function deleteCategory(id: string): Promise<void> {
  const { errors } = await client.models.Category.delete({ id });
  if (errors?.length) {
    throw new Error(errors[0].message || 'Failed to delete category');
  }
}

/**
 * Create product (Admin only)
 */
export async function createProduct(input: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
  const res = (await client.models.Product.create({
    ...input,
    images: input.images?.filter((img): img is string => img !== null),
    tags: input.tags?.filter((tag): tag is string => tag !== null),
  })) as { data?: unknown; errors?: { message?: string }[] };
  const data = Array.isArray(res.data) ? res.data[0] : res.data;
  const errors = res.errors;

  if (errors?.length || !data) {
    const msg = errors?.[0]?.message || 'Failed to create product';
    throw new Error(msg);
  }

  return mapProduct(data);
}

/**
 * Update product (Admin only)
 */
export async function updateProduct(
  id: string, 
  input: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Product> {
  const { data, errors } = await client.models.Product.update({
    id,
    ...input,
    images: input.images?.filter((img): img is string => img !== null),
    tags: input.tags?.filter((tag): tag is string => tag !== null),
  });

  if (errors || !data) {
    throw new Error('Failed to update product');
  }

  return mapProduct(data);
}

/**
 * Delete product (hard delete – Admin only). Use softDeleteProduct for soft delete.
 */
export async function deleteProduct(id: string): Promise<void> {
  const { errors } = await client.models.Product.delete({ id });
  if (errors) throw new Error('Failed to delete product');
}

/**
 * Soft delete product (set deletedAt, deletedBy, deleteReason). Any authenticated user.
 */
export async function softDeleteProduct(
  id: string,
  deletedBy: string,
  deleteReason?: string
): Promise<Product> {
  const updated = await updateProduct(id, {
    deletedAt: new Date().toISOString(),
    deletedBy,
    deleteReason: deleteReason ?? null,
  });
  return updated;
}

/**
 * Restore soft-deleted product (clear deletedAt, deletedBy, deleteReason). Admin only in UI.
 */
export async function restoreProduct(id: string): Promise<Product> {
  return updateProduct(id, {
    deletedAt: null,
    deletedBy: null,
    deleteReason: null,
  });
}

/**
 * Permanently delete product (DynamoDB delete). Admin only; use from Deleted tab only.
 */
export async function hardDeleteProduct(id: string): Promise<void> {
  return deleteProduct(id);
}

/**
 * Bulk soft delete
 */
export async function bulkSoftDelete(
  ids: string[],
  deletedBy: string,
  deleteReason?: string
): Promise<{ success: string[]; failed: { id: string; error: string }[] }> {
  const success: string[] = [];
  const failed: { id: string; error: string }[] = [];
  for (const id of ids) {
    try {
      await softDeleteProduct(id, deletedBy, deleteReason);
      success.push(id);
    } catch (e) {
      failed.push({ id, error: e instanceof Error ? e.message : String(e) });
    }
  }
  return { success, failed };
}

/**
 * Bulk restore
 */
export async function bulkRestore(ids: string[]): Promise<{ success: string[]; failed: { id: string; error: string }[] }> {
  const success: string[] = [];
  const failed: { id: string; error: string }[] = [];
  for (const id of ids) {
    try {
      await restoreProduct(id);
      success.push(id);
    } catch (e) {
      failed.push({ id, error: e instanceof Error ? e.message : String(e) });
    }
  }
  return { success, failed };
}

/**
 * Bulk hard delete (Admin only)
 */
export async function bulkHardDelete(ids: string[]): Promise<{ success: string[]; failed: { id: string; error: string }[] }> {
  const success: string[] = [];
  const failed: { id: string; error: string }[] = [];
  for (const id of ids) {
    try {
      await hardDeleteProduct(id);
      success.push(id);
    } catch (e) {
      failed.push({ id, error: e instanceof Error ? e.message : String(e) });
    }
  }
  return { success, failed };
}

/**
 * Map API response to Product type
 */
function mapProduct(data: unknown): Product {
  const p = data as Record<string, unknown>;
  return {
    id: p.id as string,
    title: p.title as string,
    description: p.description as string | null,
    price: p.price as number,
    compareAtPrice: p.compareAtPrice as number | null,
    currency: (p.currency as string) || 'ILS',
    images: p.images as (string | null)[] | null,
    categoryId: p.categoryId as string,
    brand: p.brand as string | null,
    sku: p.sku as string | null,
    attributes: p.attributes as Record<string, unknown> | null,
    stockQty: (p.stockQty as number) || 0,
    isActive: (p.isActive as boolean) ?? true,
    isFeatured: (p.isFeatured as boolean) ?? false,
    tags: p.tags as (string | null)[] | null,
    createdAt: p.createdAt as string | null,
    updatedAt: p.updatedAt as string | null,
    deletedAt: p.deletedAt as string | null,
    deletedBy: p.deletedBy as string | null,
    deleteReason: p.deleteReason as string | null,
  };
}
