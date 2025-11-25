import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import Constants from 'expo-constants';
import { subscribeLogger, getHistory } from '@/utils/logger';

export default function HomeScreen() {
  const { user, loading, signIn, signOut, error, statusMessages, tokens } = useAuth();
  const { 
    expoPushToken, 
    notification, 
    isRegistered, 
    error: notificationError,
    registerDeviceToken  // Add this
  } = useNotifications();
  
  const [allMessages, setAllMessages] = useState<string[]>([]);
  const [loggerMessages, setLoggerMessages] = useState<string[]>([]);
  const isExpoGo = Constants.appOwnership === 'expo';

  // Subscribe to in-app logger so messages appear in the status box
  useEffect(() => {
    // seed with history
    const initial = getHistory().map(h => `[${h.timestamp}] ${h.level.toUpperCase()} ${h.text}`);
    setLoggerMessages(initial);
    const unsub = subscribeLogger((m) => {
      setLoggerMessages(prev => [...prev, `[${m.timestamp}] ${m.level.toUpperCase()} ${m.text}`].slice(-200));
    });
    return () => unsub();
  }, []);

  // Combine auth status messages with notification status messages
  useEffect(() => {
    const messages = [...statusMessages];

    // Append logger messages (recent) for easier debugging on-device
    if (loggerMessages.length > 0) {
      messages.push('');
      messages.push('📝 App Logs:');
      // include only last 20 logger messages to keep the UI readable
      const recent = loggerMessages.slice(-20);
      recent.forEach(m => messages.push(`   ${m}`));
    }
    
    if (user) {
      messages.push('');
      messages.push('🔔 === NOTIFICATION STATUS ===');
      
      if (isExpoGo) {
        messages.push('⚠️  Running in Expo Go - Notifications NOT supported');
        messages.push('📱 Build a development build to enable notifications');
        messages.push('   Run: npx expo run:android');
      } else if (expoPushToken) {
        messages.push(`📱 Device Token: ${expoPushToken.substring(0, 50)}...`);
        messages.push(`✅ Registration Status: ${isRegistered ? 'Registered with backend' : 'Not registered yet'}`);
        
        if (notificationError) {
          messages.push(`❌ Notification Error: ${notificationError}`);
        }
      } else {
        messages.push('⏳ Requesting notification permissions...');
      }
    }
    
    if (notification) {
      messages.push('');
      messages.push('📨 Last Notification Received:');
      messages.push(`   Title: ${notification.request.content.title || 'No title'}`);
      messages.push(`   Body: ${notification.request.content.body || 'No body'}`);
      const timestamp = new Date(notification.date).toLocaleTimeString();
      messages.push(`   Time: ${timestamp}`);
    }
    
    setAllMessages(messages);
  }, [statusMessages, expoPushToken, isRegistered, notificationError, notification, user, isExpoGo]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Microsoft 365 SSO</Text>
      <Text style={styles.subtitle}>PKCE Flow with Django Backend</Text>

      {/* Status Messages Box */}
      <ScrollView style={styles.statusBox} contentContainerStyle={styles.statusContent}>
        {allMessages.length === 0 ? (
          <Text style={styles.statusPlaceholder}>Status messages will appear here...</Text>
        ) : (
          allMessages.map((msg, index) => (
            <Text 
              key={index} 
              style={[
                styles.statusMessage,
                msg.includes('🔔 ===') && styles.notificationHeader,
                msg.includes('❌') && styles.errorMessage,
                msg.includes('✅') && styles.successMessage,
                msg.includes('📱') && styles.tokenMessage,
                msg.includes('📨') && styles.notificationReceived,
              ]}
            >
              {msg}
            </Text>
          ))
        )}
      </ScrollView>

      {/* Error Display */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>❌ Error</Text>
          <Text style={styles.error}>{error}</Text>
        </View>
      )}

      {/* Success State */}
      {user && tokens && (
        <View style={styles.successBox}>
          <Text style={styles.successTitle}>✅ Authenticated</Text>
          <Text style={styles.tokenLabel}>Access Token:</Text>
          <Text style={styles.tokenText} numberOfLines={2} ellipsizeMode="middle">
            {tokens.access}
          </Text>
          <Text style={styles.tokenLabel}>Refresh Token:</Text>
          <Text style={styles.tokenText} numberOfLines={2} ellipsizeMode="middle">
            {tokens.refresh}
          </Text>
        </View>
      )}

      {/* Notification Status Box */}
      {user && (
        <View style={[
          styles.notificationBox, 
          isExpoGo ? styles.notificationWarning : (isRegistered ? styles.notificationActive : styles.notificationInactive)
        ]}>
          {isExpoGo ? (
            <>
              <Text style={styles.notificationBoxTitle}>
                ⚠️ Push Notifications (Unavailable)
              </Text>
              <Text style={styles.notificationLabel}>
                Expo Go doesn't support push notifications.
              </Text>
              <Text style={styles.notificationLabel}>
                To enable notifications, create a development build:
              </Text>
              <Text style={styles.codeText}>
                npx expo run:android
              </Text>
              <Text style={[styles.notificationLabel, { marginTop: 8 }]}>
                Or see README.md for full build instructions.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.notificationBoxTitle}>
                🔔 Push Notifications {isRegistered ? '(Active)' : '(Pending)'}
              </Text>
              {expoPushToken ? (
                <>
                  <Text style={styles.notificationLabel}>Device Token:</Text>
                  <Text style={styles.notificationTokenText} numberOfLines={1} ellipsizeMode="middle">
                    {expoPushToken}
                  </Text>
                  <Text style={[styles.notificationStatus, isRegistered ? styles.registered : styles.notRegistered]}>
                    {isRegistered ? '✓ Registered with backend' : '⏳ Waiting for registration...'}
                  </Text>
                </>
              ) : (
                <Text style={styles.notificationLabel}>⏳ Requesting permissions...</Text>
              )}
              {notificationError && (
                <>
                  <Text style={styles.notificationErrorText}>❌ {notificationError}</Text>
                  {!expoPushToken && (
                    <TouchableOpacity 
                      style={styles.retryButton}
                      onPress={registerDeviceToken}
                    >
                      <Text style={styles.retryButtonText}>🔄 Retry Permission Request</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </>
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        {!user ? (
          <TouchableOpacity
            style={[styles.button, styles.signInButton]}
            onPress={signIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign in with Microsoft</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.signOutButton]}
            onPress={signOut}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Sign Out</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
    color: '#000',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusBox: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 12,
    maxHeight: 600,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  statusContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  statusPlaceholder: {
    color: '#666',
    fontSize: 13,
    fontStyle: 'italic',
  },
  statusMessage: {
    color: '#00ff00',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
    lineHeight: 18,
  },
  notificationHeader: {
    color: '#00d4ff',
    fontWeight: '700',
    fontSize: 13,
  },
  errorMessage: {
    color: '#ff6b6b',
  },
  successMessage: {
    color: '#51cf66',
  },
  tokenMessage: {
    color: '#ffd43b',
  },
  notificationReceived: {
    color: '#ff8787',
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#ffebee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ef5350',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#c62828',
    marginBottom: 4,
  },
  error: {
    fontSize: 13,
    color: '#d32f2f',
  },
  successBox: {
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#66bb6a',
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 8,
  },
  tokenLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555',
    marginTop: 4,
    marginBottom: 2,
  },
  tokenText: {
    fontSize: 10,
    color: '#333',
    fontFamily: 'monospace',
    backgroundColor: '#fff',
    padding: 6,
    borderRadius: 4,
    marginBottom: 4,
  },
  notificationBox: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  notificationActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#42a5f5',
  },
  notificationInactive: {
    backgroundColor: '#fff3e0',
    borderColor: '#ffa726',
  },
  notificationWarning: {
    backgroundColor: '#fff3e0',
    borderColor: '#ff6f00',
  },
  notificationBoxTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 8,
  },
  notificationLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555',
    marginTop: 4,
    marginBottom: 2,
  },
  notificationTokenText: {
    fontSize: 10,
    color: '#333',
    fontFamily: 'monospace',
    backgroundColor: '#fff',
    padding: 6,
    borderRadius: 4,
    marginBottom: 6,
  },
  notificationStatus: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  registered: {
    color: '#2e7d32',
  },
  notRegistered: {
    color: '#f57c00',
  },
  notificationErrorText: {
    fontSize: 11,
    color: '#d32f2f',
    marginTop: 4,
  },
  retryButton: {
    backgroundColor: '#1976d2',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  codeText: {
    fontSize: 12,
    fontFamily: 'monospace',
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 4,
    marginTop: 6,
    color: '#333',
  },
  buttonContainer: {
    marginTop: 'auto',
    marginBottom: 40,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 48,
  },
  signInButton: {
    backgroundColor: '#0078d4',
  },
  signOutButton: {
    backgroundColor: '#d32f2f',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
