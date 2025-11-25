import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Example component showing how to use notifications in your app
 * You can add this to your main screen or settings screen
 */
export default function NotificationStatusExample() {
  const { expoPushToken, notification, isRegistered, error, registerDeviceToken } = useNotifications();
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Notification Status</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>User Authenticated:</Text>
          <Text style={[styles.value, user ? styles.success : styles.warning]}>
            {user ? '✅ Yes' : '❌ No'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Device Registered:</Text>
          <Text style={[styles.value, isRegistered ? styles.success : styles.warning]}>
            {isRegistered ? '✅ Yes' : '❌ No'}
          </Text>
        </View>

        {expoPushToken && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Push Token:</Text>
            <Text style={styles.valueSmall} numberOfLines={2}>
              {expoPushToken}
            </Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>❌ Error: {error}</Text>
          </View>
        )}

        {notification && (
          <View style={styles.notificationContainer}>
            <Text style={styles.notificationTitle}>Last Notification:</Text>
            <Text style={styles.notificationBody}>
              {notification.request.content.title}
            </Text>
            <Text style={styles.notificationBodySmall}>
              {notification.request.content.body}
            </Text>
          </View>
        )}

        {!isRegistered && user && (
          <TouchableOpacity 
            style={styles.button} 
            onPress={registerDeviceToken}
          >
            <Text style={styles.buttonText}>Register for Notifications</Text>
          </TouchableOpacity>
        )}

        {!user && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Please sign in to enable push notifications
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    padding: 20,
    backgroundColor: 'white',
    margin: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  valueSmall: {
    fontSize: 12,
    color: '#666',
    flex: 2,
    textAlign: 'right',
  },
  success: {
    color: '#4CAF50',
  },
  warning: {
    color: '#FF9800',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
  },
  notificationContainer: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 5,
    marginTop: 15,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 5,
  },
  notificationBody: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  notificationBodySmall: {
    fontSize: 14,
    color: '#666',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 5,
    marginTop: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 5,
    marginTop: 15,
  },
  infoText: {
    color: '#E65100',
    fontSize: 14,
    textAlign: 'center',
  },
});
