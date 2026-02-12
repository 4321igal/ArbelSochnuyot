export { default as ManagerProduct } from './ManagerProduct';
export { default as SearchBar } from './SearchBar';
export { default as ProductGrid } from './ProductGrid';
export { default as ProductTable } from './ProductTable';
export { default as AddProductModal } from './AddProductModal';
export { default as AddCategoryModal } from './AddCategoryModal';
export { default as EditProductModal } from './EditProductModal';
export { default as ImportCSVModal } from './ImportCSVModal';
export { default as ProductHeader } from './ProductHeader';
export { default as StatsSection } from './StatsSection';
export { default as ErrorBoundary } from './ErrorBoundary';

export type { Product, CreateProductDTO, Stats, CSVPreviewItem } from './types';
export { PRODUCT_CATEGORIES } from './constants';
export { useCSVImport } from './hooks/useCSVImport';
