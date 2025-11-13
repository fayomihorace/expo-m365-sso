import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { ActivityIndicator } from 'react-native';

export default function HomeScreen() {
  const { user, loading, signIn, signOut, error, statusMessages, tokens } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Microsoft 365 SSO</Text>
      <Text style={styles.subtitle}>PKCE Flow with Django Backend</Text>

      {/* Status Messages Box */}
      <ScrollView style={styles.statusBox} contentContainerStyle={styles.statusContent}>
        {statusMessages.length === 0 ? (
          <Text style={styles.statusPlaceholder}>Status messages will appear here...</Text>
        ) : (
          statusMessages.map((msg, index) => (
            <Text key={index} style={styles.statusMessage}>
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
