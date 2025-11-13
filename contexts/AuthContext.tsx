import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: any | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => void;
  error: string | null;
  statusMessages: string[];
  tokens: { access: string; refresh: string } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessages, setStatusMessages] = useState<string[]>([]);
  const [tokens, setTokens] = useState<{ access: string; refresh: string } | null>(null);

  const clientId = process.env.EXPO_PUBLIC_MICROSOFT_CLIENT_ID;
  const tenantId = process.env.EXPO_PUBLIC_MICROSOFT_TENANT_ID;
  const redirectUri = process.env.EXPO_PUBLIC_MICROSOFT_REDIRECT_URI;
  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;

  const addStatusMessage = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setStatusMessages(prev => [...prev, `[${timestamp}] ${message}`]);
  };

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

  // Handle OAuth response
  useEffect(() => {
    if (response?.type === 'success') {
      // Get the actual redirect URI that was used in the OAuth request
      const actualRedirectUri = request?.redirectUri || redirectUri || '';
      // Get the code_verifier used for PKCE
      const codeVerifier = request?.codeVerifier || '';
      addStatusMessage(`=============================== RedirectUri: [${redirectUri}] [${actualRedirectUri}]`);
      addStatusMessage(`🔐 Code Verifier: ${codeVerifier.substring(0, 20)}...`);
      handleAuthCode(response.params.code, actualRedirectUri, codeVerifier);
    } else if (response?.type === 'error') {
      addStatusMessage(`❌ OAuth Error: ${response.error?.message || 'Unknown error'}`);
      setError(response.error?.message || 'Authentication failed');
      setLoading(false);
    } else if (response?.type === 'dismiss') {
      addStatusMessage('⚠️ Login cancelled by user');
      setError('Login cancelled');
      setLoading(false);
    }
  }, [response]);

  const callApi = async (authCode: string, url: string) => {
    // Test network connectivity first
    addStatusMessage(`🔍 +++++ API call with URL: ${url}`);
    try {
      const testResponse = await fetch(url, {
        method: 'GET',
        headers: {'Accept': '*/*'}
      });
      addStatusMessage(`✅ Network test: Server reachable (${testResponse.status})`);
    } catch (testError: any) {
      addStatusMessage(`+++[❌] Network test failed!`);
      addStatusMessage(`   ++Error name: ${testError.name}`);
      addStatusMessage(`   ++Error message: ${testError.message}`);
      addStatusMessage(`   ++Error type: ${typeof testError}`);
      if (testError.cause) {
        addStatusMessage(`   Error cause: ${JSON.stringify(testError.cause)}`);
      }
    }
  }

  const handleAuthCode = async (authCode: string, actualRedirectUri: string, codeVerifier: string) => {
    addStatusMessage('✅ Authorization code received from Microsoft');
    addStatusMessage(`📤 Backend URL: ${backendUrl}`);
    addStatusMessage(`📝 Auth code: ${authCode.substring(0, 20)}...`);
    addStatusMessage(`📍 Redirect URI from .env: ${redirectUri}`);
    addStatusMessage(`📍 ACTUAL Redirect URI used: ${actualRedirectUri}`);
    addStatusMessage(`🔐 Code Verifier (PKCE): ${codeVerifier.substring(0, 20)}...`);

    // await callApi(authCode, `http://localhost:8000/admin`);
    // await callApi(authCode, `https://beta-infraneo.fasfox.net`);
    // await callApi(authCode, `https://beta-infraneo.fasfox.net/admin`);
    // await callApi(authCode, `${backendUrl}/admin`);

    
    try {
      // Add timeout to fetch
      const controller = new AbortController();
      // const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        addStatusMessage('📡 Sending POST request...');
        const requestBody = {
          auth_code: authCode,
          redirectUri: actualRedirectUri, // Use the actual redirect URI that was sent to Microsoft
          code_verifier: codeVerifier, // Include the PKCE code_verifier
        };
        addStatusMessage(`📦 Request body: ${JSON.stringify(requestBody).substring(0, 150)}...`);        const response = await fetch(`${backendUrl}/api/v1/oauth/callback/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        // clearTimeout(timeoutId);
        addStatusMessage(`📥 Backend response status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          addStatusMessage(`❌ Backend error: ${errorText}`);
          throw new Error(`Backend returned ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        addStatusMessage('✅ JWT tokens received from backend');

        // Store tokens
        await AsyncStorage.setItem('access_token', data.access);
        await AsyncStorage.setItem('refresh_token', data.refresh);
        addStatusMessage('💾 Tokens saved to storage');

        setTokens({ access: data.access, refresh: data.refresh });
        setUser({ authenticated: true });
        setError(null);
        addStatusMessage('🎉 Login successful!');
      } catch (fetchError: any) {
        // clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          addStatusMessage('❌ Network timeout - Backend took too long to respond');
          throw new Error('Network timeout - Check if backend is reachable');
        }
        throw fetchError;
      }
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to exchange code for tokens';
      addStatusMessage(`❌ Error: ${errorMessage}`);
      if (err.message?.includes('Network request failed')) {
        addStatusMessage('🔍 Network issue - Check:');
        addStatusMessage(`   • Backend running at ${backendUrl}?`);
        addStatusMessage('   • Phone on same network as backend?');
        addStatusMessage('   • Firewall blocking connection?');
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signIn = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setStatusMessages([]);
      addStatusMessage('🚀 Starting Microsoft OAuth login...');
      addStatusMessage(`📱 Redirect URI: ${redirectUri}`);
      
      const result = await promptAsync();
      
      if (result?.type === 'success') {
        addStatusMessage('✅ OAuth prompt completed successfully');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      addStatusMessage(`❌ Error2: ${errorMessage} | ${JSON.stringify(err)}`);
      setError(errorMessage);
      setLoading(false);
    }
  }, [promptAsync, redirectUri]);

  const signOut = useCallback(async () => {
    addStatusMessage('👋 Signing out...');
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('refresh_token');
    setUser(null);
    setTokens(null);
    setError(null);
    setStatusMessages([]);
    addStatusMessage('✅ Signed out successfully');
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signOut,
    error,
    statusMessages,
    tokens,
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
