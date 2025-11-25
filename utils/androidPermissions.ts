import { Platform, PermissionsAndroid, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';

/**
 * Request Android 13+ POST_NOTIFICATIONS permission using native Android API
 * This is needed because expo-notifications doesn't always trigger the system dialog
 */
export async function requestAndroidNotificationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true; // Not Android, assume granted
  }

  // Check Android version
  const androidVersion = Platform.Version;
  console.log('📱 Android API Level:', androidVersion);

  // Android 13+ (API 33+) requires runtime permission for POST_NOTIFICATIONS
  if (typeof androidVersion === 'number' && androidVersion >= 33) {
    console.log('🔔 Android 13+ detected - requesting POST_NOTIFICATIONS permission...');
    
    try {
      // First check if already granted
      const checkResult = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      
      console.log('📋 POST_NOTIFICATIONS already granted:', checkResult);
      
      if (checkResult) {
        return true;
      }

      // Request the permission - this will show the system dialog
      console.log('🔔 Showing Android permission dialog...');
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        {
          title: 'Enable Notifications',
          message: 'This app needs permission to send you notifications',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      console.log('📋 Permission result:', granted);
      const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
      
      if (!isGranted) {
        console.warn('❌ User denied notification permission');
        Alert.alert(
          'Notifications Disabled',
          'You can enable notifications later in Settings > Apps > Infraneo AGDT > Notifications',
          [{ text: 'OK' }]
        );
      }
      
      return isGranted;
    } catch (err) {
      console.error('❌ Error requesting Android permission:', err);
      return false;
    }
  } else {
    console.log('📱 Android < 13 - permissions should be auto-granted from manifest');
    return true;
  }
}

/**
 * Check if notification permission is granted
 */
export async function checkNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const androidVersion = Platform.Version;
    
    if (typeof androidVersion === 'number' && androidVersion >= 33) {
      const hasPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      console.log('📋 Has POST_NOTIFICATIONS permission:', hasPermission);
      return hasPermission;
    }
  }
  
  // For iOS or older Android, check via expo-notifications
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

/**
 * Open app settings so user can manually enable notifications
 */
export function openAppSettings() {
  if (Platform.OS === 'android') {
    try {
      const { Linking } = require('react-native');
      Linking.openSettings();
    } catch (error) {
      console.error('Failed to open settings:', error);
    }
  }
}
