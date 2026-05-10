import { lazy, Suspense } from 'react';

// Public pages
export const HomePage = lazy(() => import('@/pages/HomePage').then((m) => ({ default: m.HomePage })));
export const InventoryPage = lazy(() => import('@/pages/InventoryPage').then((m) => ({ default: m.InventoryPage })));
export const VehiclePage = lazy(() => import('@/pages/VehiclePage').then((m) => ({ default: m.VehiclePage })));
export const SearchPage = lazy(() => import('@/pages/SearchPage').then((m) => ({ default: m.SearchPage })));
export const ContactPage = lazy(() => import('@/pages/ContactPage').then((m) => ({ default: m.ContactPage })));
export const FinanceCalculatorPage = lazy(() =>
  import('@/pages/FinanceCalculatorPage').then((m) => ({ default: m.FinanceCalculatorPage })),
);
export const ComparePage = lazy(() => import('@/pages/ComparePage').then((m) => ({ default: m.ComparePage })));
export const FavoritesPage = lazy(() => import('@/pages/FavoritesPage').then((m) => ({ default: m.FavoritesPage })));
export const AuthPage = lazy(() => import('@/pages/AuthPage').then((m) => ({ default: m.AuthPage })));

// Protected customer
export const AccountPage = lazy(() => import('@/pages/AccountPage').then((m) => ({ default: m.AccountPage })));
export const MyInquiriesPage = lazy(() =>
  import('@/pages/MyInquiriesPage').then((m) => ({ default: m.MyInquiriesPage })),
);

// Admin
export const AdminDashboard = lazy(() =>
  import('@/pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })),
);
export const AdminVehicles = lazy(() =>
  import('@/pages/admin/AdminVehicles').then((m) => ({ default: m.AdminVehicles })),
);
export const AdminVehicleForm = lazy(() =>
  import('@/pages/admin/AdminVehicleForm').then((m) => ({ default: m.AdminVehicleForm })),
);
export const AdminMakes = lazy(() => import('@/pages/admin/AdminMakes').then((m) => ({ default: m.AdminMakes })));
export const AdminBodyTypes = lazy(() =>
  import('@/pages/admin/AdminBodyTypes').then((m) => ({ default: m.AdminBodyTypes })),
);
export const AdminInquiries = lazy(() =>
  import('@/pages/admin/AdminInquiries').then((m) => ({ default: m.AdminInquiries })),
);
export const AdminInquiryDetail = lazy(() =>
  import('@/pages/admin/AdminInquiryDetail').then((m) => ({ default: m.AdminInquiryDetail })),
);
export const AdminImportCSV = lazy(() =>
  import('@/pages/admin/AdminImportCSV').then((m) => ({ default: m.AdminImportCSV })),
);
export const AdminHeroPage = lazy(() =>
  import('@/pages/admin/AdminHeroPage').then((m) => ({ default: m.AdminHeroPage })),
);

export function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-brand-700 border-t-transparent" />
    </div>
  );
}

export function LazySuspense({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageFallback />}>{children}</Suspense>;
}
