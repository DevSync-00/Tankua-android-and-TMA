# Google authentication setup

The mobile app signs in through Supabase's Google provider and returns to
`tankua://auth/callback`. No Google client secret belongs in the Expo app.

## 1. Configure Google Cloud

1. Create or select a project in Google Cloud Console.
2. Configure the OAuth consent screen.
3. Create an **OAuth client ID** with application type **Web application**.
4. Copy the Supabase callback URL from **Authentication > Providers > Google**
   and add it as an authorized redirect URI in the Google OAuth client. It is
   normally `https://<project-ref>.supabase.co/auth/v1/callback`.

## 2. Configure Supabase

1. Open **Authentication > Providers > Google**.
2. Enable Google and enter the Google web client ID and client secret.
3. Open **Authentication > URL Configuration**.
4. Add `tankua://auth/callback` to **Redirect URLs**.

## 3. Build and test

Because the callback uses a custom native scheme, test Google login in an Expo
development build or a release build, not Expo Go. Rebuild the native app after
changing `app.config.js`.

```sh
npx expo run:android
```

The first successful login creates the matching row in `public.users`. Since the
current schema requires `phone_number`, Google-only accounts initially receive an
internal `google:<user-id>` value and the existing profile-completion flow asks
the user for their real details.
