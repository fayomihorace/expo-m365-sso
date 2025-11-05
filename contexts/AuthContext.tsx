import React, { createContext, useContext, useState, useCallback } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: any | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientId = process.env.EXPO_PUBLIC_MICROSOFT_CLIENT_ID;
  const tenantId = process.env.EXPO_PUBLIC_MICROSOFT_TENANT_ID;
  const redirectUri = process.env.EXPO_PUBLIC_MICROSOFT_REDIRECT_URI;

  const discovery = {
    authorizationEndpoint: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`,
    tokenEndpoint: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
  };

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: clientId || '',
      scopes: [
        'https://graph.microsoft.com/.default',
        'offline_access',
      ],
      redirectUri: AuthSession.makeRedirectUri({
        native: redirectUri,
      }),
    },
    discovery
  );

  const signIn = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await promptAsync();
      if (result?.type === 'success') {
        setUser(result);
      } else if (result?.type === 'dismiss') {
        setError('Login cancelled');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }, [promptAsync]);

  const signOut = useCallback(() => {
    setUser(null);
    setError(null);
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signOut,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
