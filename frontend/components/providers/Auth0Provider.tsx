'use client';

import { Auth0Provider as Auth0ProviderBase } from '@auth0/auth0-react';
import { ReactNode } from 'react';
import { MockAuthContext } from '@/lib/hooks/useAuth';

interface Auth0ProviderProps {
  children: ReactNode;
}

function MockAuth0Provider({ children }: { children: ReactNode }) {
  // In dev mode without Auth0, always consider user as authenticated
  const mockValue = {
    isAuthenticated: true,
    isLoading: false,
    user: {
      name: 'Dev User',
      email: 'dev@example.com',
      sub: 'dev-user-123',
    },
    loginWithRedirect: () => {
      console.log('Mock login - Auth0 not configured');
      // In dev mode, redirect to dashboard
      window.location.href = '/dashboard';
    },
    logout: () => {
      console.log('Mock logout - Auth0 not configured');
      window.location.href = '/';
    },
    getAccessTokenSilently: async () => {
      console.log('Mock getAccessTokenSilently - Auth0 not configured');
      return 'mock-dev-token';
    },
  };

  return (
    <MockAuthContext.Provider value={mockValue}>
      {children}
    </MockAuthContext.Provider>
  );
}

export default function Auth0Provider({ children }: Auth0ProviderProps) {
  const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN;
  const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID;
  const audience = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE;

  // If Auth0 is not configured, use mock provider for development
  if (!domain || !clientId) {
    console.warn('Auth0 not configured. Running in development mode with mock authentication.');
    return <MockAuth0Provider>{children}</MockAuth0Provider>;
  }

  return (
    <Auth0ProviderBase
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: typeof window !== 'undefined' ? window.location.origin : '',
        audience: audience,
      }}
      cacheLocation="localstorage"
    >
      {children}
    </Auth0ProviderBase>
  );
}
