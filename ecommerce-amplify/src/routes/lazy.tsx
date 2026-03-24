import { lazy, Suspense } from 'react';

/**
 * Lazy-loaded page components for code splitting.
 * Admin and protected routes are in separate chunks and not loaded until visited.
 */

// Public
export const HomePage = lazy(() => import('@/pages/HomePage').then(m => ({ default: m.HomePage })));
export const CategoryPage = lazy(() => import('@/pages/CategoryPage').then(m => ({ default: m.CategoryPage })));
export const ProductPage = lazy(() => import('@/pages/ProductPage').then(m => ({ default: m.ProductPage })));
export const SearchPage = lazy(() => import('@/pages/SearchPage').then(m => ({ default: m.SearchPage })));
export const CartPage = lazy(() => import('@/pages/CartPage').then(m => ({ default: m.CartPage })));
export const AuthPage = lazy(() => import('@/pages/AuthPage').then(m => ({ default: m.AuthPage })));

// Protected customer
export const CheckoutPage = lazy(() => import('@/pages/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
export const OrdersPage = lazy(() => import('@/pages/OrdersPage').then(m => ({ default: m.OrdersPage })));
export const AccountPage = lazy(() => import('@/pages/AccountPage').then(m => ({ default: m.AccountPage })));

// Admin (largest chunks)
export const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
export const UnifiedAdminProducts = lazy(() => import('@/pages/admin/UnifiedAdminProducts').then(m => ({ default: m.UnifiedAdminProducts })));
export const AdminProductForm = lazy(() => import('@/pages/admin/AdminProductForm').then(m => ({ default: m.AdminProductForm })));
export const AdminCategories = lazy(() => import('@/pages/admin/AdminCategories').then(m => ({ default: m.AdminCategories })));
export const AdminOrders = lazy(() => import('@/pages/admin/AdminOrders').then(m => ({ default: m.AdminOrders })));
export const AdminOrderDetail = lazy(() => import('@/pages/admin/AdminOrderDetail').then(m => ({ default: m.AdminOrderDetail })));
export const AdminImportCSV = lazy(() => import('@/pages/admin/AdminImportCSV').then(m => ({ default: m.AdminImportCSV })));
export const AdminHeroPage = lazy(() => import('@/pages/admin/AdminHeroPage').then(m => ({ default: m.AdminHeroPage })));

/** Fallback for lazy routes */
export function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent" />
    </div>
  );
}

export function LazySuspense({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageFallback />}>{children}</Suspense>;
}
