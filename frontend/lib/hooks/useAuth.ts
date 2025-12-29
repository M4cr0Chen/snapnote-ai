'use client';

import { useAuth0 } from '@auth0/auth0-react';
import { useContext, createContext } from 'react';

// Logout options type
interface LogoutOptions {
  logoutParams?: {
    returnTo?: string;
  };
}

// Mock auth context type
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    name?: string;
    email?: string;
    picture?: string;
    sub?: string;
  } | undefined;
  loginWithRedirect: () => void;
  logout: (options?: LogoutOptions) => void;
  getAccessTokenSilently: () => Promise<string>;
}

// Create context for mock auth
export const MockAuthContext = createContext<AuthContextType | null>(null);

/**
 * Custom auth hook that works with both real Auth0 and mock auth
 * When Auth0 is not configured, it uses a mock context
 */
export function useAuth(): AuthContextType {
  // Try to get mock context first
  const mockContext = useContext(MockAuthContext);

  // If mock context exists, use it
  if (mockContext) {
    return mockContext;
  }

  // Otherwise, try to use Auth0
  // This will work when Auth0 is configured
  try {
    const auth0 = useAuth0();
    return {
      isAuthenticated: auth0.isAuthenticated,
      isLoading: auth0.isLoading,
      user: auth0.user,
      loginWithRedirect: auth0.loginWithRedirect,
      logout: auth0.logout,
      getAccessTokenSilently: auth0.getAccessTokenSilently,
    };
  } catch {
    // If Auth0 is not available, return default unauthenticated state
    return {
      isAuthenticated: false,
      isLoading: false,
      user: undefined,
      loginWithRedirect: () => console.warn('Auth not configured'),
      logout: () => console.warn('Auth not configured'),
      getAccessTokenSilently: async () => '',
    };
  }
}
