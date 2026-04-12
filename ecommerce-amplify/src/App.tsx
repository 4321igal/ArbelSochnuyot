import { Routes, Route, Navigate } from 'react-router-dom';

import { MainLayout } from './components/layout/MainLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AdminRoute } from './components/auth/AdminRoute';
import {
  HomePage,
  CategoryPage,
  ProductPage,
  SearchPage,
  CartPage,
  AuthPage,
  CheckoutPage,
  OrdersPage,
  AccountPage,
  AdminDashboard,
  UnifiedAdminProducts,
  AdminProductForm,
  AdminCategories,
  AdminOrders,
  AdminOrderDetail,
  AdminImportCSV,
  AdminHeroPage,
  AdminHomePageManagement,
  LazySuspense,
} from './routes/lazy';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<LazySuspense><HomePage /></LazySuspense>} />
        <Route path="category/:slug" element={<LazySuspense><CategoryPage /></LazySuspense>} />
        <Route path="product/:id" element={<LazySuspense><ProductPage /></LazySuspense>} />
        <Route path="search" element={<LazySuspense><SearchPage /></LazySuspense>} />
        <Route path="cart" element={<LazySuspense><CartPage /></LazySuspense>} />
        <Route path="auth" element={<LazySuspense><AuthPage /></LazySuspense>} />

        <Route element={<ProtectedRoute />}>
          <Route path="checkout" element={<LazySuspense><CheckoutPage /></LazySuspense>} />
          <Route path="orders" element={<LazySuspense><OrdersPage /></LazySuspense>} />
          <Route path="account" element={<LazySuspense><AccountPage /></LazySuspense>} />
        </Route>
      </Route>

      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<LazySuspense><AdminDashboard /></LazySuspense>} />
          <Route path="products" element={<LazySuspense><UnifiedAdminProducts /></LazySuspense>} />
          <Route path="products/new" element={<LazySuspense><AdminProductForm /></LazySuspense>} />
          <Route path="products/:id/edit" element={<LazySuspense><AdminProductForm /></LazySuspense>} />
          <Route path="categories" element={<LazySuspense><AdminCategories /></LazySuspense>} />
          <Route path="orders" element={<LazySuspense><AdminOrders /></LazySuspense>} />
          <Route path="orders/:id" element={<LazySuspense><AdminOrderDetail /></LazySuspense>} />
          <Route path="import-csv" element={<LazySuspense><AdminImportCSV /></LazySuspense>} />
          <Route path="hero" element={<LazySuspense><AdminHeroPage /></LazySuspense>} />
          <Route path="homepage" element={<LazySuspense><AdminHomePageManagement /></LazySuspense>} />
          <Route path="manager-product" element={<Navigate to="/admin/products" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
