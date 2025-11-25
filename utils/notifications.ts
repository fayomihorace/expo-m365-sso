import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { requestAndroidNotificationPermission, checkNotificationPermission } from './androidPermissions';
import { info, warn, error, debug } from './logger';

// Check if we're in Expo Go (which doesn't support notifications)
const isExpoGo = Constants.appOwnership === 'expo';

// Configure how notifications are handled when the app is in the foreground
// Only configure if not in Expo Go
if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Get the Expo push token (FCM token on Android, APNs on iOS)
 * @returns Promise<string | null> - The FCM/APNs device token
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  // Check if running in Expo Go
  if (isExpoGo) {
    warn('⚠️ Push notifications are not supported in Expo Go. Please use a development build.');
    return null;
  }

  if (!Device.isDevice) {
    warn('⚠️ Push notifications only work on physical devices');
    return null;
  }

  try {
    // For Android 13+, request permission using native Android API first
    if (Platform.OS === 'android') {
      info('🤖 Requesting Android notification permission via native API...');
      const androidGranted = await requestAndroidNotificationPermission();
      
      if (!androidGranted) {
        warn('❌ Android POST_NOTIFICATIONS permission denied');
        return null;
      }
      info('✅ Android POST_NOTIFICATIONS permission granted');
    }
    
    // Now use expo-notifications API
    // Check existing permissions
    info('📋 Checking existing notification permissions via Expo...');
    const { status: existingStatus, canAskAgain } = await Notifications.getPermissionsAsync();
    debug(`Current permission status: ${existingStatus}, canAskAgain=${String(canAskAgain)}`);
    let finalStatus = existingStatus;

    // Request permissions if not already granted
    if (existingStatus !== 'granted') {
      if (!canAskAgain) {
        warn('❌ Cannot request permissions - user has previously denied. Please enable in Settings.');
        return null;
      }
      
      info('🔔 Requesting notification permissions from user...');
      info('   (A system popup should appear now)');
      
      const permissionResponse = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
        android: {},
      });
      
      finalStatus = permissionResponse.status;
      debug('Permission request result: ' + finalStatus);
      debug('Full response: ' + JSON.stringify(permissionResponse, null, 2));
    }

    if (finalStatus !== 'granted') {
      warn('❌ User denied notification permissions or permissions unavailable');
      warn('   To enable: Go to Settings > Apps > Infraneo AGDT > Notifications > Allow');
      return null;
    }

    info('✅ Notification permissions granted');
    info(`🔑 Getting device push token... [${Platform.OS}], [${Platform.OS === 'android'}]`);
    
    // For Android, we get the FCM token directly (no Expo account needed!)
    if (Platform.OS === 'android') {
      // On Android with Firebase configured, Expo will get the FCM token directly
      // This works without needing an Expo project ID
      const pushTokenData = await Notifications.getDevicePushTokenAsync();
      token = pushTokenData.data;
      info('✅ FCM token received: ' + (token ? token.substring(0, 50) + '...' : 'null'));
    } else {
      // For iOS, we still need Expo's service (requires project ID)
      const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
      if (!projectId) {
        error('❌ EXPO_PUBLIC_PROJECT_ID required for iOS. Set it in .env or use Android only.');
        return null;
      }
      debug('Using Expo project ID for iOS: ' + projectId);
      
      const pushTokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });
      token = pushTokenData.data;
      info('✅ APNs token received: ' + (token ? token.substring(0, 50) + '...' : 'null'));
    }

    // Android-specific channel setup
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  } catch (err) {
    error('Error getting push token: ' + String(err));
    return null;
  }
}

/**
 * Get device information for registration
 * @returns Object containing device type and unique device ID
 */
export async function getDeviceInfo() {
  const deviceType = Platform.OS === 'ios' ? 'ios' : 'android';
  
  // Generate a unique device ID (you may want to use a library like expo-application for this)
  const deviceId = Device.modelId || Device.osInternalBuildId || 'unknown';

  return {
    type: deviceType,
    device_id: deviceId,
  };
}

/**
 * Add a notification received listener
 * @param callback - Function to call when notification is received
 * @returns Subscription object that can be used to remove the listener
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add a notification response received listener (when user taps on notification)
 * @param callback - Function to call when notification is tapped
 * @returns Subscription object that can be used to remove the listener
 */
export function addNotificationResponseReceivedListener(
  callback: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Get the notification that opened the app (if any)
 * @returns Promise<Notifications.NotificationResponse | null>
 */
export async function getLastNotificationResponse() {
  return await Notifications.getLastNotificationResponseAsync();
}
