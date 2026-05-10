import { Outlet, Link, NavLink } from 'react-router-dom';
import { Heart, Search, User, LogOut, Phone, Calculator, GitCompare, Car } from 'lucide-react';
import { useAuth } from '../../lib/auth/AuthContext';
import { useCompare } from '../../lib/compare/CompareContext';

export function MainLayout() {
  const { isAuthenticated, isAdmin, userAttributes, signOut } = useAuth();
  const { vehicleIds } = useCompare();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
      isActive ? 'text-accent-500' : 'text-white/90 hover:text-accent-300'
    }`;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-brand-800 text-white shadow-md">
        <div className="container-wide">
          <div className="flex items-center justify-between h-16 gap-4">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <Car className="w-7 h-7 text-accent-500" />
              <div className="flex flex-col leading-none">
                <span className="text-xl font-bold">ערבל</span>
                <span className="text-[10px] text-accent-300 tracking-widest">סוכנויות רכב</span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <NavLink to="/" end className={navLinkClass}>בית</NavLink>
              <NavLink to="/inventory" className={navLinkClass}>
                <Car className="w-4 h-4" />
                מלאי רכבים
              </NavLink>
              <NavLink to="/finance" className={navLinkClass}>
                <Calculator className="w-4 h-4" />
                מימון
              </NavLink>
              <NavLink to="/compare" className={navLinkClass}>
                <GitCompare className="w-4 h-4" />
                השוואה
                {vehicleIds.length > 0 && (
                  <span className="bg-accent-500 text-brand-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {vehicleIds.length}
                  </span>
                )}
              </NavLink>
              <NavLink to="/contact" className={navLinkClass}>
                <Phone className="w-4 h-4" />
                צור קשר
              </NavLink>
            </nav>

            <div className="flex items-center gap-2">
              <Link
                to="/search"
                className="p-2 text-white/90 hover:text-accent-300 transition-colors"
                title="חיפוש"
              >
                <Search className="w-5 h-5" />
              </Link>

              {isAuthenticated ? (
                <div className="relative group">
                  <button className="flex items-center gap-2 p-2 text-white/90 hover:text-accent-300 transition-colors">
                    <User className="w-5 h-5" />
                    <span className="hidden sm:inline text-sm">
                      {userAttributes?.given_name || 'החשבון שלי'}
                    </span>
                  </button>

                  <div className="absolute end-0 mt-2 w-56 bg-white rounded-lg shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 text-gray-800">
                    <Link to="/account" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100">
                      <User className="w-4 h-4" />
                      החשבון שלי
                    </Link>
                    <Link to="/my-inquiries" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100">
                      <Phone className="w-4 h-4" />
                      הפניות שלי
                    </Link>
                    <Link to="/favorites" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100">
                      <Heart className="w-4 h-4" />
                      רכבים מועדפים
                    </Link>
                    {isAdmin && (
                      <>
                        <hr className="my-2" />
                        <Link to="/admin" className="block px-4 py-2 text-brand-800 font-medium hover:bg-gray-100">
                          לוח בקרה - ניהול
                        </Link>
                      </>
                    )}
                    <hr className="my-2" />
                    <button
                      onClick={() => signOut()}
                      className="flex items-center gap-2 w-full text-right px-4 py-2 text-red-600 hover:bg-gray-100"
                    >
                      <LogOut className="w-4 h-4" />
                      התנתק
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  to="/auth"
                  className="flex items-center gap-2 px-4 py-2 bg-accent-500 text-brand-900 hover:bg-accent-400 rounded-lg font-medium text-sm transition-colors"
                >
                  התחברות
                </Link>
              )}
            </div>
          </div>

          <nav className="md:hidden flex items-center gap-1 pb-3 overflow-x-auto scrollbar-hide">
            <NavLink to="/" end className={navLinkClass}>בית</NavLink>
            <NavLink to="/inventory" className={navLinkClass}>מלאי</NavLink>
            <NavLink to="/finance" className={navLinkClass}>מימון</NavLink>
            <NavLink to="/compare" className={navLinkClass}>
              השוואה
              {vehicleIds.length > 0 && (
                <span className="bg-accent-500 text-brand-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {vehicleIds.length}
                </span>
              )}
            </NavLink>
            <NavLink to="/contact" className={navLinkClass}>צור קשר</NavLink>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-brand-900 text-white/80 mt-auto">
        <div className="container-wide py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Car className="w-6 h-6 text-accent-500" />
                <span className="text-lg font-bold text-white">ערבל סוכנויות</span>
              </div>
              <p className="text-sm leading-relaxed">
                סוכנות רכב מובילה — מאות רכבים יד שנייה ורכבים חדשים, ליווי אישי, מימון והעברת בעלות.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">ניווט</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/inventory" className="hover:text-accent-300">מלאי רכבים</Link></li>
                <li><Link to="/finance" className="hover:text-accent-300">מחשבון מימון</Link></li>
                <li><Link to="/compare" className="hover:text-accent-300">השוואת רכבים</Link></li>
                <li><Link to="/contact" className="hover:text-accent-300">צור קשר</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">שעות פתיחה</h3>
              <ul className="space-y-2 text-sm">
                <li>א'-ה': 09:00-19:00</li>
                <li>ו': 09:00-13:00</li>
                <li>שבת: סגור</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">צור קשר</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <a href="tel:+972-3-1234567" className="hover:text-accent-300">03-1234567</a>
                </li>
                <li>contact@arbel-cars.co.il</li>
                <li>רחוב התעשייה 12, ראשון לציון</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-8 pt-6 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} ערבל סוכנויות. כל הזכויות שמורות.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
