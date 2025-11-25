import AsyncStorage from '@react-native-async-storage/async-storage';
import { info, warn, error as logError } from '@/utils/logger';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

/**
 * API service for device registration and other backend calls
 */
class ApiService {
  /**
   * Get authentication headers with JWT token
   */
  private async getAuthHeaders(): Promise<HeadersInit> {
    const accessToken = await AsyncStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(accessToken ? { Authorization: `JWT ${accessToken}` } : {}),
    };
  }

  /**
   * Register or update FCM device token with the backend
   * @param registrationId - FCM device token
   * @param deviceId - Unique device identifier
   * @param type - Device type ('android' or 'ios')
   * @returns Promise with registration response
   */
  async registerDevice(
    registrationId: string,
    deviceId: string,
    type: 'android' | 'ios'
  ): Promise<any> {
    try {
      const headers = await this.getAuthHeaders();
      info('*********Headers: ' + JSON.stringify(headers));

      const response = await fetch(`${BACKEND_URL}/api/v1/devices/register/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          registration_id: registrationId,
          device_id: deviceId,
          type,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Device registration failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      info('Device registered successfully: ' + JSON.stringify(data));
      return data;
    } catch (error) {
      logError('Error registering device: ' + String(error));
      throw error;
    }
  }

  /**
   * Unregister device token (useful when user logs out)
   * @param deviceId - Unique device identifier
   */
  async unregisterDevice(deviceId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${BACKEND_URL}/api/devices/unregister/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ device_id: deviceId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        warn(`Device unregister warning: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      logError('Error unregistering device: ' + String(error));
      // Don't throw, as this is not critical
    }
  }

  /**
   * Refresh the access token using the refresh token
   * @returns Promise with new access token
   */
  async refreshAccessToken(): Promise<string | null> {
    try {
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${BACKEND_URL}/api/v1/oauth/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      await AsyncStorage.setItem('access_token', data.access);
      
      return data.access;
    } catch (error) {
      logError('Error refreshing token: ' + String(error));
      return null;
    }
  }
}

export default new ApiService();
