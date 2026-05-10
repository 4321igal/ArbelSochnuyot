import { Routes, Route, Navigate } from 'react-router-dom';

import { MainLayout } from './components/layout/MainLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AdminRoute } from './components/auth/AdminRoute';
import {
  HomePage,
  InventoryPage,
  VehiclePage,
  SearchPage,
  ContactPage,
  FinanceCalculatorPage,
  ComparePage,
  FavoritesPage,
  AuthPage,
  AccountPage,
  MyInquiriesPage,
  AdminDashboard,
  AdminVehicles,
  AdminVehicleForm,
  AdminMakes,
  AdminBodyTypes,
  AdminInquiries,
  AdminInquiryDetail,
  AdminImportCSV,
  AdminHeroPage,
  LazySuspense,
} from './routes/lazy';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<LazySuspense><HomePage /></LazySuspense>} />
        <Route path="inventory" element={<LazySuspense><InventoryPage /></LazySuspense>} />
        <Route path="inventory/:makeSlug" element={<LazySuspense><InventoryPage /></LazySuspense>} />
        <Route path="vehicle/:id" element={<LazySuspense><VehiclePage /></LazySuspense>} />
        <Route path="search" element={<LazySuspense><SearchPage /></LazySuspense>} />
        <Route path="contact" element={<LazySuspense><ContactPage /></LazySuspense>} />
        <Route path="finance" element={<LazySuspense><FinanceCalculatorPage /></LazySuspense>} />
        <Route path="compare" element={<LazySuspense><ComparePage /></LazySuspense>} />
        <Route path="favorites" element={<LazySuspense><FavoritesPage /></LazySuspense>} />
        <Route path="auth" element={<LazySuspense><AuthPage /></LazySuspense>} />

        <Route element={<ProtectedRoute />}>
          <Route path="account" element={<LazySuspense><AccountPage /></LazySuspense>} />
          <Route path="my-inquiries" element={<LazySuspense><MyInquiriesPage /></LazySuspense>} />
        </Route>

        {/* Legacy redirects */}
        <Route path="category/:slug" element={<Navigate to="/inventory" replace />} />
        <Route path="product/:id" element={<Navigate to="/inventory" replace />} />
        <Route path="cart" element={<Navigate to="/inventory" replace />} />
        <Route path="checkout" element={<Navigate to="/inventory" replace />} />
        <Route path="orders" element={<Navigate to="/my-inquiries" replace />} />
      </Route>

      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<LazySuspense><AdminDashboard /></LazySuspense>} />
          <Route path="vehicles" element={<LazySuspense><AdminVehicles /></LazySuspense>} />
          <Route path="vehicles/new" element={<LazySuspense><AdminVehicleForm /></LazySuspense>} />
          <Route path="vehicles/:id/edit" element={<LazySuspense><AdminVehicleForm /></LazySuspense>} />
          <Route path="makes" element={<LazySuspense><AdminMakes /></LazySuspense>} />
          <Route path="body-types" element={<LazySuspense><AdminBodyTypes /></LazySuspense>} />
          <Route path="inquiries" element={<LazySuspense><AdminInquiries /></LazySuspense>} />
          <Route path="inquiries/:id" element={<LazySuspense><AdminInquiryDetail /></LazySuspense>} />
          <Route path="import-csv" element={<LazySuspense><AdminImportCSV /></LazySuspense>} />
          <Route path="hero" element={<LazySuspense><AdminHeroPage /></LazySuspense>} />

          {/* Legacy redirects */}
          <Route path="products" element={<Navigate to="/admin/vehicles" replace />} />
          <Route path="products/new" element={<Navigate to="/admin/vehicles/new" replace />} />
          <Route path="products/:id/edit" element={<Navigate to="/admin/vehicles" replace />} />
          <Route path="categories" element={<Navigate to="/admin/makes" replace />} />
          <Route path="orders" element={<Navigate to="/admin/inquiries" replace />} />
          <Route path="orders/:id" element={<Navigate to="/admin/inquiries" replace />} />
          <Route path="manager-product" element={<Navigate to="/admin/vehicles" replace />} />
          <Route path="homepage" element={<Navigate to="/admin" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
