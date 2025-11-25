# Microsoft 365 SSO with Expo + Push Notifications

A minimal Expo React Native app implementing Microsoft 365 Single Sign-On (SSO) using Expo AuthSession and Firebase Cloud Messaging (FCM) push notifications.

## Features

- ✅ Microsoft 365 OAuth 2.0 authentication
- ✅ Firebase Cloud Messaging (FCM) push notifications
- ✅ Automatic device token registration with Django backend
- ✅ Secure token handling with expo-web-browser
- ✅ Sign in and sign out functionality
- ✅ Error handling and loading states
- ✅ Type-safe with TypeScript

## Prerequisites

- Node.js 18+ and npm
- Expo CLI (optional, for development)
- Microsoft Azure app registration with OAuth 2.0 configured
- Firebase project with Cloud Messaging enabled (for push notifications)
- Django backend with device registration endpoint

## Quick Start

### 1. Clone and Install

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```env
# Microsoft OAuth
EXPO_PUBLIC_MICROSOFT_CLIENT_ID=your_client_id_here
EXPO_PUBLIC_MICROSOFT_TENANT_ID=your_tenant_id_here
EXPO_PUBLIC_MICROSOFT_REDIRECT_URI=your_redirect_uri_here

# Backend API
EXPO_PUBLIC_BACKEND_URL=https://your-backend.com

# Expo Project (for notifications)
EXPO_PUBLIC_PROJECT_ID=your_expo_project_id
```

### 3. Firebase Setup (for Notifications)

1. Create Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Add Android app with package name: `com.infraneo.agdt`
3. Download `google-services.json` and place in project root
4. See `QUICKSTART_NOTIFICATIONS.md` for detailed steps

## Setup

### Microsoft Azure Configuration

1. Register your application in [Azure Portal](https://portal.azure.com)
2. Configure OAuth 2.0 redirect URIs
3. Get your Client ID, Tenant ID, and Redirect URI

## Running Locally

### Web (Development)

```bash
npm run dev
```

The app will open at `http://localhost:8081` in your browser.

### iOS/Android

To run on a physical device or emulator, you need to export the project:

```bash
expo export --platform ios
```

or

```bash
expo export --platform android
```

Then follow Expo's documentation for building and running native apps.

## 📱 Push Notifications

This app integrates Firebase Cloud Messaging (FCM) for push notifications with automatic device token registration to your Django backend.

### Backend Integration

The app automatically registers device tokens with your Django backend at:
```
POST /api/devices/register/
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "registration_id": "ExponentPushToken[xxx]",
  "device_id": "device-identifier",
  "type": "android"
}
```

### Quick Setup

1. **Get Firebase configuration**:
   - Create Firebase project
   - Download `google-services.json`
   - Place in project root

2. **Build with FCM**:
   ```bash
   npx expo prebuild --platform android --clean
   cd android && ./gradlew assembleRelease
   ```

3. **Test notifications**:
   - Sign in to the app
   - Device token automatically registers
   - Send test from Firebase Console

📚 **Full Documentation**:
- Quick Start: `QUICKSTART_NOTIFICATIONS.md`
- Detailed Setup: `NOTIFICATION_SETUP.md`
- Integration Summary: `FCM_INTEGRATION_SUMMARY.md`

## Features

## Project Structure

```
app/
├── _layout.tsx          # Root layout with auth & notification providers
├── index.tsx            # Home screen with sign in/out UI
└── +not-found.tsx       # 404 page

contexts/
├── AuthContext.tsx      # Authentication context and hooks
└── NotificationContext.tsx  # Notification management & device registration

services/
└── api.ts              # API service for backend integration

utils/
└── notifications.ts    # FCM token & permission handling

components/
└── NotificationStatusExample.tsx  # Example notification UI

hooks/
├── useFrameworkReady.ts # Framework initialization

.env                     # Environment variables (create from .env.example)
google-services.json     # Firebase configuration (download from Firebase Console)
```

## How It Works

1. User taps "Sign in with Microsoft"
2. App opens Microsoft's OAuth login page in system browser
3. User authenticates and authorizes app access
4. Microsoft redirects back to app with authorization code
5. App exchanges code for access token
6. User is logged in and can sign out

## Troubleshooting

### Redirect URI Mismatch
Ensure the redirect URI in `.env` matches exactly with the one configured in Azure Portal.

### Authentication Fails
- Check that all environment variables are correctly set
- Verify your Azure app registration is active
- Ensure the app has the required permissions

### Web Platform Issues
Some native features may not work on web. The app is optimized for mobile platforms (iOS/Android).


## Run dev
- With avd
```bash
npx expo start --localhost --android
```

-With expo

```bash
npx expo start 
```

or

```bash
EXPO_OFFLINE=1 npx expo start
```

# Build apk
1- Prebuild
```bash
npx expo prebuild --platform android
```

2. Generate apk
```bash
cd android && ./gradlew assembleRelease
```
The apk will be in android/app/build/outputs/apk/release/app-release.apk.

3. Refresh  apk (if you change code or env)

```bash
npx expo prebuild --platform android --clean && cd android && ./gradlew assembleRelease
```

# Setup firebase android
- Put `google-services.json` in `android/app/`
- Add this line to `android/app/build.gradle`
```
...
apply plugin: "com.facebook.react"
apply plugin: "com.google.gms.google-services"  // Add this line for Firebase
```

- Add this line to `android/build.gradle`

```
buildscript {
  repositories {
    google()
    mavenCentral()
  }
  dependencies {
     ...
    classpath('com.google.gms:google-services:4.4.0')  // Add Google Services plugin
  }
}
```
