import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth/AuthContext';
import { useCart } from '../../lib/cart/CartContext';

/**
 * Main Layout Component
 * 
 * Includes:
 * - Header with navigation
 * - Cart icon with item count
 * - User menu
 * - Footer
 */
export function MainLayout() {
  const { isAuthenticated, isAdmin, userAttributes, signOut } = useAuth();
  const { itemCount } = useCart();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold text-indigo-600">Store</span>
            </Link>

            {/* Search */}
            <div className="flex-1 max-w-lg mx-8">
              <form action="/search" method="GET" className="relative">
                <input
                  type="search"
                  name="q"
                  placeholder="Search products..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-indigo-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>
            </div>

            {/* Navigation */}
            <nav className="flex items-center space-x-6">
              {/* Cart */}
              <Link to="/cart" className="relative text-gray-600 hover:text-indigo-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </Link>

              {/* User Menu */}
              {isAuthenticated ? (
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-indigo-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="hidden sm:inline">{userAttributes?.given_name || 'Account'}</span>
                  </button>
                  
                  {/* Dropdown */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <Link to="/orders" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                      My Orders
                    </Link>
                    <Link to="/account" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                      Account Settings
                    </Link>
                    {isAdmin && (
                      <>
                        <hr className="my-2" />
                        <Link to="/admin" className="block px-4 py-2 text-indigo-600 hover:bg-gray-100">
                          Admin Dashboard
                        </Link>
                      </>
                    )}
                    <hr className="my-2" />
                    <button
                      onClick={() => signOut()}
                      className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  to="/auth"
                  className="text-gray-600 hover:text-indigo-600 font-medium"
                >
                  Sign In
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Shop</h3>
              <ul className="space-y-2 text-gray-600">
                <li><Link to="/category/electronics" className="hover:text-indigo-600">Electronics</Link></li>
                <li><Link to="/category/clothing" className="hover:text-indigo-600">Clothing</Link></li>
                <li><Link to="/category/home" className="hover:text-indigo-600">Home & Garden</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Account</h3>
              <ul className="space-y-2 text-gray-600">
                <li><Link to="/orders" className="hover:text-indigo-600">My Orders</Link></li>
                <li><Link to="/cart" className="hover:text-indigo-600">Cart</Link></li>
                <li><Link to="/account" className="hover:text-indigo-600">Settings</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Support</h3>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" className="hover:text-indigo-600">Contact Us</a></li>
                <li><a href="#" className="hover:text-indigo-600">FAQ</a></li>
                <li><a href="#" className="hover:text-indigo-600">Shipping Info</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Connect</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-600 hover:text-indigo-600">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-600 hover:text-indigo-600">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-gray-500">
            <p>&copy; 2026 Store. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
