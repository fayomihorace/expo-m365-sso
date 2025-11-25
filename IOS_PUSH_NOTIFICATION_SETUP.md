# iOS Push Notification Setup Guide

## Overview
iOS push notifications use **Apple Push Notification service (APNs)** instead of FCM. The setup is different but the Expo SDK handles both platforms automatically.

## Configuration Files Updated

### ✅ app.json
```json
{
  "ios": {
    "bundleIdentifier": "com.infraneo.agdt",
    "infoPlist": {
      "UIBackgroundModes": ["remote-notification"]
    }
  },
  "plugins": [
    [
      "expo-notifications",
      {
        "ios": {
          "iosDisplayInForeground": true
        }
      }
    ]
  ]
}
```

## iOS Setup Requirements

### 1. **Apple Developer Account** (Required)
- You need a **paid** Apple Developer account ($99/year)
- Free accounts cannot use push notifications
- Sign up at: https://developer.apple.com/

### 2. **APNs Key** (Authentication for Push Notifications)

#### Create APNs Key:
1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Navigate to: **Certificates, Identifiers & Profiles** → **Keys**
3. Click **"+"** to create a new key
4. Name it (e.g., "Infraneo Push Notifications")
5. Check **"Apple Push Notifications service (APNs)"**
6. Click **"Continue"** → **"Register"**
7. **Download the .p8 file** (you can only download it once!)
8. Note the **Key ID** and **Team ID**

#### Save These Values:
- **Key ID**: e.g., `A1B2C3D4E5`
- **Team ID**: e.g., `XYZ1234ABC`
- **APNs Key file**: `AuthKey_A1B2C3D4E5.p8`

### 3. **App Identifier**

#### Register App ID:
1. In Apple Developer Portal: **Certificates, Identifiers & Profiles** → **Identifiers**
2. Click **"+"** to create a new identifier
3. Select **"App IDs"** → **"Continue"**
4. Select **"App"** → **"Continue"**
5. Fill in:
   - **Description**: Infraneo AGDT
   - **Bundle ID**: `com.infraneo.agdt` (must match app.json)
6. Under **Capabilities**, check:
   - ✅ **Push Notifications**
7. Click **"Continue"** → **"Register"**

### 4. **Provisioning Profile**

#### Create Development Profile:
1. Go to **Certificates, Identifiers & Profiles** → **Profiles**
2. Click **"+"**
3. Select **"iOS App Development"** → **"Continue"**
4. Select your App ID (`com.infraneo.agdt`)
5. Select your development certificate
6. Select your test devices
7. Name it (e.g., "Infraneo Development")
8. Download and install the profile

## Platform-Specific Code (Already Done ✅)

Your notification code in `utils/notifications.ts` already handles both platforms:

```typescript
// iOS-specific permission request
const permissionResponse = await Notifications.requestPermissionsAsync({
  ios: {
    allowAlert: true,
    allowBadge: true,
    allowSound: true,
  },
  android: {},
});

// Platform-specific channel setup (Android only)
if (Platform.OS === 'android') {
  await Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
  });
}
```

## Building for iOS

### Option 1: EAS Build (Recommended - Handles Everything)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure
eas build:configure

# Build for iOS (development)
eas build --platform ios --profile development

# For production
eas build --platform ios --profile production
```

EAS will:
- ✅ Automatically configure APNs
- ✅ Handle code signing
- ✅ Generate provisioning profiles
- ✅ Upload APNs key to Expo servers

During the build, EAS will prompt you to:
1. Upload your APNs key (.p8 file)
2. Provide Key ID and Team ID
3. Expo stores these securely and uses them for push notifications

### Option 2: Manual Build (Local)

```bash
# Prebuild for iOS
npx expo prebuild --platform ios

# Open in Xcode
cd ios
open InfraneoAGDT.xcworkspace

# In Xcode:
# 1. Select your team in "Signing & Capabilities"
# 2. Enable "Push Notifications" capability
# 3. Build and run on device
```

**Note**: You cannot test push notifications in the iOS Simulator. You need a physical device.

## Configuration Summary

### Android (FCM)
| Requirement | File/Config | Status |
|------------|-------------|--------|
| Firebase Project | Firebase Console | ✅ Done |
| google-services.json | `android/app/google-services.json` | ✅ Added |
| Package Name | `com.infraneo.agdt` | ✅ Configured |
| Project ID | `EXPO_PUBLIC_PROJECT_ID="afriservices-ac7f3"` | ✅ Set |

### iOS (APNs)
| Requirement | File/Config | Status |
|------------|-------------|--------|
| Apple Developer Account | developer.apple.com | ⚠️ Required |
| APNs Key (.p8) | Upload to EAS or configure manually | ⚠️ Needed |
| Bundle ID | `com.infraneo.agdt` | ✅ Configured |
| App ID Registration | Apple Developer Portal | ⚠️ Needed |
| Push Notifications Capability | Xcode or EAS | ⚠️ Needed |

## Testing on Both Platforms

### After Setup:
1. **Android**: Install APK on device
2. **iOS**: Install IPA on device (requires TestFlight or Xcode)
3. Launch app and sign in
4. Grant notification permissions when prompted
5. Check in-app logs for token acquisition

### Expected Logs (Both Platforms):
```
📝 App Logs:
   [14:23:02] INFO 📱 Starting notification registration...
   [14:23:03] INFO ✅ Notification permissions granted
   [14:23:03] INFO 🔑 Getting Expo push token...
   [14:23:04] DEBUG Using project ID: afriservices-ac7f3
   [14:23:05] INFO ✅ Push token received: ExponentPushToken[xxxxxx]...
   [14:23:06] INFO 📤 Registering device with backend...
   [14:23:07] INFO ✅ Device token registered with backend successfully
```

### Token Format Differences:
- **Android**: `ExponentPushToken[xxxxxxxxxxxxxx]`
- **iOS**: `ExponentPushToken[xxxxxxxxxxxxxx]` (same format, different internal routing)

Both tokens work with the same Expo Push API endpoint!

## Sending Notifications

### From Django Backend:
```python
from fcm_django.models import FCMDevice

# Register device (works for both iOS and Android)
device = FCMDevice.objects.create(
    registration_id="ExponentPushToken[xxxxxx]",  # From either platform
    device_id="unique_device_id",
    type="ios",  # or "android"
    user=request.user
)

# Send notification (works for both)
device.send_message(
    title="Hello!",
    body="This works on both iOS and Android",
    data={"custom": "data"}
)
```

### Via Expo Push API Directly:
```python
import requests

def send_expo_push_notification(expo_token, title, body):
    response = requests.post(
        'https://exp.host/--/api/v2/push/send',
        json={
            'to': expo_token,
            'title': title,
            'body': body,
            'sound': 'default',
            'priority': 'high',
        },
        headers={
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }
    )
    return response.json()
```

## Quick Start Checklist

### Android Setup (Already Done ✅):
- [x] Created Firebase project
- [x] Added `google-services.json`
- [x] Set `EXPO_PUBLIC_PROJECT_ID`
- [x] Configured `app.json`
- [x] Built and tested

### iOS Setup (To Do):
- [ ] Get Apple Developer account
- [ ] Create APNs Key (.p8 file)
- [ ] Register App ID with Push Notifications capability
- [ ] Use EAS Build or manual Xcode setup
- [ ] Build and test on physical iOS device

## Troubleshooting

### iOS: "You do not have permission to use push notifications"
- **Cause**: Missing Apple Developer account or APNs key
- **Fix**: Complete Apple Developer setup and add APNs key

### iOS: Token acquisition fails
- **Cause**: App not properly code-signed or missing Push Notifications capability
- **Fix**: Use EAS Build or enable Push Notifications in Xcode

### Android: Token works but iOS doesn't
- **Cause**: APNs configuration missing
- **Fix**: Follow iOS setup steps above

### Both Platforms: Backend registration fails
- **Cause**: Django backend endpoint not working
- **Fix**: Check backend logs and ensure `/api/devices/register/` accepts both `"ios"` and `"android"` types

## Next Steps

1. **Continue with Android** (already working) ✅
2. **Get Apple Developer account** for iOS support
3. **Use EAS Build** for easiest iOS setup
4. **Test on both platforms**
5. **Send test notifications** from Django backend

---

**Note**: The beauty of Expo is that your notification code is already cross-platform! Once you complete the iOS setup (APNs key + provisioning), the same code will work on both platforms without any changes. 🎉
