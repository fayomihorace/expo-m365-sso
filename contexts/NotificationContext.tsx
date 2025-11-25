import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import {
  registerForPushNotificationsAsync,
  getDeviceInfo,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  getLastNotificationResponse,
} from '@/utils/notifications';
import ApiService from '@/services/api';
import { useAuth } from './AuthContext';
import { info as logInfo, warn as logWarn, error as logError, debug as logDebug } from '@/utils/logger';

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  isRegistered: boolean;
  error: string | null;
  registerDeviceToken: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, tokens } = useAuth();
  
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  /**
   * Register device token with backend
   */
  const registerDeviceToken = async () => {
    try {
      setError(null);
      
      // Check if running in Expo Go
      if (isExpoGo) {
        setError('Push notifications require a development build. Not available in Expo Go.');
        logWarn('⚠️ Skipping notification registration - running in Expo Go');
        return;
      }
      
      logInfo('📱 Starting notification registration...');
      
      // Get the push token
      const token = await registerForPushNotificationsAsync();
      
      if (!token) {
        logWarn('⚠️ Failed to get push token - notifications will not work');
        setError('Could not get notification token. Notifications disabled.');
        return; // Don't throw, just return
      }

      setExpoPushToken(token);
      logInfo('✅ Push token obtained: ' + (token ? token.substring(0, 50) + '...' : 'null'));

      // Get device info
      const deviceInfo = await getDeviceInfo();

      // Register with backend if user is authenticated
      if (tokens?.access) {
        logInfo('📤 Registering device with backend...');
        await ApiService.registerDevice(
          token,
          deviceInfo.device_id,
          deviceInfo.type as 'android' | 'ios'
        );
        setIsRegistered(true);
        logInfo('✅ Device token registered with backend successfully');
      } else {
        logWarn('⚠️ User not authenticated, skipping backend registration');
        setError('Not authenticated - skipping backend registration');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to register device token';
      setError(errorMessage);
      logError('❌ Error in registerDeviceToken: ' + errorMessage);
      // Don't throw - just log and continue
    }
  };

  /**
   * Initialize notification listeners
   */
  useEffect(() => {
    // Skip if running in Expo Go
    if (isExpoGo) {
      logWarn('⚠️ Notification listeners disabled - running in Expo Go');
      return;
    }

    // Listener for notifications received while app is foregrounded
    notificationListener.current = addNotificationReceivedListener((notification) => {
      logInfo('Notification received: ' + JSON.stringify(notification));
      setNotification(notification);
    });

    // Listener for when user taps on notification
    responseListener.current = addNotificationResponseReceivedListener((response) => {
      logInfo('Notification tapped: ' + JSON.stringify(response));
      // Handle navigation or other actions based on notification data
      // You can access the notification data via: response.notification.request.content.data
    });

    // Check if app was opened from a notification
    getLastNotificationResponse().then((response) => {
      if (response) {
        logInfo('App opened from notification: ' + JSON.stringify(response));
        // Handle the notification that opened the app
      }
    });

    // Cleanup listeners on unmount
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  /**
   * Register device token when user logs in
   * Non-blocking - errors won't prevent app from working
   */
  useEffect(() => {
    if (user && tokens?.access && !isRegistered && !isExpoGo) {
      logInfo('🔔 User logged in - attempting notification registration...');
      // Use setTimeout to make this completely non-blocking
      setTimeout(() => {
        registerDeviceToken().catch((err) => {
          logWarn('⚠️ Notification registration failed but app will continue: ' + String(err));
        });
      }, 1000); // Small delay to ensure UI is ready
    }
  }, [user, tokens]);

  const value: NotificationContextType = {
    expoPushToken,
    notification,
    isRegistered,
    error,
    registerDeviceToken,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
