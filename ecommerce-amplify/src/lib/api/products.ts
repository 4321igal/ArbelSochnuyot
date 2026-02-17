import { client, type PaginationOptions, type PaginatedResult } from '../amplify/client';

/**
 * Product API
 * 
 * Provides typed methods for product operations
 */

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
 * List products with pagination
 */
export async function listProducts(
  options?: PaginationOptions & {
    categoryId?: string;
    brand?: string;
    isActive?: boolean;
    isFeatured?: boolean;
  }
): Promise<PaginatedResult<Product>> {
  const filter: Record<string, unknown> = {};
  
  if (options?.categoryId) {
    filter.categoryId = { eq: options.categoryId };
  }
  if (options?.brand) {
    filter.brand = { eq: options.brand };
  }
  if (options?.isActive !== undefined) {
    filter.isActive = { eq: options.isActive };
  }
  if (options?.isFeatured !== undefined) {
    filter.isFeatured = { eq: options.isFeatured };
  }

  const { data, nextToken } = await client.models.Product.list({
    filter: Object.keys(filter).length > 0 ? filter : undefined,
    limit: options?.limit || 20,
    nextToken: options?.nextToken,
  });

  return {
    items: (data || []).map(mapProduct),
    nextToken,
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

  return (data || []).map(mapProduct);
}

/**
 * List products by category
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

  return {
    items: (data || []).map(mapProduct),
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
 * Get category by slug (returns category even if inactive – UI can show "unavailable").
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const { data } = await client.models.Category.list({
    filter: { slug: { eq: slug } },
    limit: 1,
  });

  if (!data || data.length === 0) {
    return null;
  }

  return mapCategory(data[0]);
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
    input.slug?.trim() ||
    input.name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-\u0590-\u05FF]/g, '');
  const res = (await client.models.Category.create({
    name: input.name.trim(),
    slug: slug || `cat-${Date.now()}`,
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
  const { data, errors } = await client.models.Category.update({
    id,
    ...input,
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
 * Delete product (Admin only)
 */
export async function deleteProduct(id: string): Promise<void> {
  const { errors } = await client.models.Product.delete({ id });
  
  if (errors) {
    throw new Error('Failed to delete product');
  }
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
  };
}
