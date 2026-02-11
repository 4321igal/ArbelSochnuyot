import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  getCurrentUser, 
  signIn, 
  signOut, 
  signUp, 
  confirmSignUp,
  fetchAuthSession,
  fetchUserAttributes,
  AuthUser,
} from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

/**
 * Authentication Context
 * 
 * Provides:
 * - Current user state
 * - User groups (Admin, Customer)
 * - Sign in/out/up methods
 * - Loading states
 */

// Types
interface UserAttributes {
  sub: string;
  email: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
  phone_number?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  userId: string | null;
  userAttributes: UserAttributes | null;
  groups: string[];
  isAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, attributes?: Record<string, string>) => Promise<void>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userAttributes, setUserAttributes] = useState<UserAttributes | null>(null);
  const [groups, setGroups] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check current auth state on mount
  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setUserId(currentUser.userId);

      // Fetch user attributes
      const attributes = await fetchUserAttributes();
      setUserAttributes({
        sub: currentUser.userId,
        email: attributes.email || '',
        email_verified: attributes.email_verified === 'true',
        given_name: attributes.given_name,
        family_name: attributes.family_name,
        phone_number: attributes.phone_number,
      });

      // Fetch groups from session
      const session = await fetchAuthSession();
      const tokens = session.tokens;
      const cognitoGroups = (tokens?.accessToken?.payload?.['cognito:groups'] as string[]) || [];
      setGroups(cognitoGroups);

    } catch {
      // Not authenticated
      setUser(null);
      setUserId(null);
      setUserAttributes(null);
      setGroups([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    // Listen for auth events
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signedIn':
          checkAuth();
          break;
        case 'signedOut':
          setUser(null);
          setUserId(null);
          setUserAttributes(null);
          setGroups([]);
          break;
      }
    });

    return () => unsubscribe();
  }, [checkAuth]);

  // Sign in
  const handleSignIn = async (email: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);
      await signIn({ username: email, password });
      await checkAuth();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up
  const handleSignUp = async (
    email: string, 
    password: string, 
    attributes?: Record<string, string>
  ) => {
    try {
      setError(null);
      setIsLoading(true);
      await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            ...attributes,
          },
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign up failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm sign up
  const handleConfirmSignUp = async (email: string, code: string) => {
    try {
      setError(null);
      setIsLoading(true);
      await confirmSignUp({ username: email, confirmationCode: code });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Confirmation failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      setError(null);
      await signOut();
      setUser(null);
      setUserId(null);
      setUserAttributes(null);
      setGroups([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign out failed';
      setError(message);
      throw err;
    }
  };

  const clearError = () => setError(null);

  const value: AuthContextType = {
    user,
    userId,
    userAttributes,
    groups,
    isAdmin: groups.includes('Admin'),
    isAuthenticated: !!user,
    isLoading,
    error,
    signIn: handleSignIn,
    signUp: handleSignUp,
    confirmSignUp: handleConfirmSignUp,
    signOut: handleSignOut,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
