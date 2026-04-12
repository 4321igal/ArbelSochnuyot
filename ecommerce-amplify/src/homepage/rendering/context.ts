import type { Category, Product } from '@/lib/api/products';

/** Data the storefront injects into dynamic sections (categories carousel, featured grid, etc.) */
export interface HomepageRenderContext {
  categories: Category[];
  featuredProducts: Product[];
  isLoading: boolean;
}
