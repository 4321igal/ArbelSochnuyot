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
 * List all categories
 */
export async function listCategories(): Promise<Category[]> {
  const { data } = await client.models.Category.list({
    filter: { isActive: { eq: true } },
  });

  return (data || []).map((cat: any) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    parentId: cat.parentId,
    imageUrl: cat.imageUrl,
    sortOrder: cat.sortOrder || 0,
    isActive: cat.isActive ?? true,
  }));
}

/**
 * Get category by slug
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const { data } = await client.models.Category.list({
    filter: { slug: { eq: slug } },
    limit: 1,
  });

  if (!data || data.length === 0) {
    return null;
  }

  const cat = data[0];
  return {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    parentId: cat.parentId,
    imageUrl: cat.imageUrl,
    sortOrder: cat.sortOrder || 0,
    isActive: cat.isActive ?? true,
  };
}

/**
 * Create product (Admin only)
 */
export async function createProduct(input: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
  const { data, errors } = await client.models.Product.create({
    ...input,
    images: input.images?.filter((img): img is string => img !== null),
    tags: input.tags?.filter((tag): tag is string => tag !== null),
  });

  if (errors || !data) {
    throw new Error('Failed to create product');
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
