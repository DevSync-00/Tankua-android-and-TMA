# Google authentication setup

The Android app uses native Google Sign-In and exchanges Google's ID token for
a Supabase session. No Google client secret belongs in the Expo app.

## 1. Configure Google Cloud

1. Create or select a project in Google Cloud Console.
2. Configure the OAuth consent screen.
3. Register the Web OAuth client used by Supabase.
4. Register an Android OAuth client for package `com.tankua.co` and every
   signing certificate SHA-1 used to distribute the app.

## 2. Configure Supabase

1. Open **Authentication > Providers > Google**.
2. Enable Google and enter the Google web client ID and client secret.
3. Add the Android OAuth client ID to **Authorized Client IDs**.

## 3. Build and test

The Google Sign-In package contains native code, so test in an Expo development
build or release build, not Expo Go. Rebuild after installing or changing its
native configuration.

```sh
npx expo run:android
```

The first successful login upserts the matching `public.users` row using the
Supabase user ID. Google-only accounts leave `phone_number` and
`phone_number_verified` null in this phase.
