import { useNavigate, useLocation } from 'react-router-dom';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

/**
 * Auth Page - Sign In / Sign Up
 */
export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || '/';

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome</h1>
          <p className="text-gray-600 mt-2">Sign in to your account or create a new one</p>
        </div>

        <Authenticator
          signUpAttributes={['email', 'given_name', 'family_name']}
          components={{
            Header() {
              return null; // Hide default header
            },
          }}
        >
          {({ user }) => {
            // User is authenticated, redirect
            if (user) {
              navigate(from, { replace: true });
            }
            return <div />;
          }}
        </Authenticator>

        <p className="text-center text-sm text-gray-500 mt-6">
          By signing in, you agree to our{' '}
          <a href="#" className="text-indigo-600 hover:text-indigo-700">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-indigo-600 hover:text-indigo-700">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
