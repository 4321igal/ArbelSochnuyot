import { Link } from 'react-router-dom';
import { User, Heart, Phone, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useFavorites } from '@/lib/favorites/FavoritesContext';

export function AccountPage() {
  const { userAttributes, signOut } = useAuth();
  const { favoriteIds } = useFavorites();

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container-narrow">
        <h1 className="text-3xl font-bold text-brand-900 mb-8">החשבון שלי</h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-accent-500 text-brand-900 font-bold rounded-full flex items-center justify-center text-xl">
              {userAttributes?.given_name?.[0] || userAttributes?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div className="font-bold text-brand-900 text-lg">
                {userAttributes?.given_name && userAttributes?.family_name
                  ? `${userAttributes.given_name} ${userAttributes.family_name}`
                  : userAttributes?.given_name || 'משתמש רשום'}
              </div>
              <div className="text-sm text-gray-500">{userAttributes?.email}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <Link
            to="/my-inquiries"
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
          >
            <Phone className="w-7 h-7 text-accent-500 mb-2" />
            <h2 className="font-bold text-brand-900">הפניות שלי</h2>
            <p className="text-sm text-gray-600 mt-1">צפה בכל הפניות שיצרת</p>
          </Link>

          <Link
            to="/favorites"
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
          >
            <Heart className="w-7 h-7 text-red-500 mb-2" />
            <h2 className="font-bold text-brand-900">רכבים מועדפים</h2>
            <p className="text-sm text-gray-600 mt-1">{favoriteIds.length} רכבים שמורים</p>
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="font-bold text-brand-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            פרטים אישיים
          </h2>
          <dl className="space-y-3 text-sm">
            <Row label="שם פרטי" value={userAttributes?.given_name} />
            <Row label="שם משפחה" value={userAttributes?.family_name} />
            <Row label="אימייל" value={userAttributes?.email} />
            <Row label="טלפון" value={userAttributes?.phone_number} />
          </dl>
          <p className="text-xs text-gray-500 mt-4">
            לעדכון פרטים, פנה לתמיכה.
          </p>
        </div>

        <button
          onClick={() => signOut()}
          className="mt-6 btn-ghost w-full text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4" />
          התנתק
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <dt className="text-gray-600">{label}</dt>
      <dd className="font-medium text-brand-900">{value || '—'}</dd>
    </div>
  );
}
