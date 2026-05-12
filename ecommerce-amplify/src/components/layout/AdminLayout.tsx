import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Car,
  Tag,
  Layers,
  Phone,
  Upload,
  Image as ImageIcon,
  ExternalLink,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../lib/auth/AuthContext';

export function AdminLayout() {
  const { userAttributes, signOut } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/admin', label: 'דשבורד', icon: LayoutDashboard },
    { path: '/admin/vehicles', label: 'רכבים', icon: Car },
    { path: '/admin/makes', label: 'יצרנים', icon: Tag },
    { path: '/admin/body-types', label: 'סוגי רכב', icon: Layers },
    { path: '/admin/inquiries', label: 'פניות', icon: Phone },
    { path: '/admin/import-csv', label: 'ייבוא CSV', icon: Upload },
    { path: '/admin/hero', label: 'תמונת Hero', icon: ImageIcon },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      <aside className="w-64 bg-brand-900 text-white flex flex-col">
        <div className="p-4 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2">
            <Car className="w-6 h-6 text-accent-500" />
            <div className="leading-none">
              <div className="text-base font-bold">ארבל סוכנויות</div>
              <div className="text-[10px] text-accent-300 mt-1">לוח בקרה</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                  isActive(item.path)
                    ? 'bg-accent-500 text-brand-900 font-semibold'
                    : 'text-white/85 hover:bg-white/5'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-9 h-9 bg-accent-500 text-brand-900 font-bold rounded-full flex items-center justify-center shrink-0">
                {userAttributes?.given_name?.[0] || 'A'}
              </div>
              <div className="text-sm leading-tight min-w-0">
                <div className="font-medium truncate">
                  {userAttributes?.given_name || 'מנהל'}
                </div>
                <div className="text-xs text-white/60 truncate">{userAttributes?.email}</div>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="text-white/60 hover:text-white p-1"
              title="התנתק"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm h-16 flex items-center px-6 border-b">
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-brand-800">
              {navItems.find((item) => isActive(item.path))?.label || 'ניהול'}
            </h1>
          </div>
          <Link
            to="/"
            className="text-gray-600 hover:text-brand-800 flex items-center gap-2 text-sm"
          >
            <ExternalLink className="w-4 h-4" />
            <span>צפה באתר</span>
          </Link>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
