# Microsoft 365 SSO with Expo

A minimal Expo React Native app implementing Microsoft 365 Single Sign-On (SSO) using Expo AuthSession and expo-web-browser.

## Prerequisites

- Node.js 18+ and npm
- Expo CLI (optional, for development)
- Microsoft Azure app registration with OAuth 2.0 configured

## Setup

### 1. Microsoft Azure Configuration

1. Register your application in [Azure Portal](https://portal.azure.com)
2. Configure OAuth 2.0 redirect URIs
3. Get your:
   - **Client ID** (Application ID)
   - **Tenant ID** (Directory ID)
   - **Redirect URI** (e.g., `expo://localhost:19000/--/authorize`)

### 2. Environment Variables

Create or update `.env` file with your Microsoft credentials:

```env
EXPO_PUBLIC_MICROSOFT_CLIENT_ID=your_client_id_here
EXPO_PUBLIC_MICROSOFT_TENANT_ID=your_tenant_id_here
EXPO_PUBLIC_MICROSOFT_REDIRECT_URI=your_redirect_uri_here
```

## Installation

```bash
npm install
```

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

## Features

- Microsoft 365 OAuth 2.0 authentication
- Secure token handling with expo-web-browser
- Sign in and sign out functionality
- Error handling and loading states
- Type-safe with TypeScript

## Project Structure

```
app/
├── _layout.tsx          # Root layout with auth provider
├── index.tsx            # Home screen with sign in/out UI
└── +not-found.tsx       # 404 page

contexts/
├── AuthContext.tsx      # Authentication context and hooks

hooks/
├── useFrameworkReady.ts # Framework initialization

.env                     # Environment variables
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