import Constants from 'expo-constants';
import {
  GoogleSignin,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { supabase } from '../config/supabase';

const webClientId = Constants.expoConfig?.extra?.googleWebClientId;

export function configureGoogleSignIn() {
  if (!webClientId) {
    throw new Error('Google Sign-In is not configured for this build.');
  }

  // The Android OAuth client is selected by Google from the package name and
  // signing certificate. The web client ID requests an ID token for Supabase.
  GoogleSignin.configure({ webClientId });
}

export async function signInWithGoogle() {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    if (!isSuccessResponse(response)) return null;

    const idToken = response.data?.idToken;
    if (!idToken) {
      throw new Error('No ID token returned from Google Sign-In.');
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error) {
      if (error.message?.toLowerCase().includes('unacceptable audience')) {
        throw new Error(
          'Google Sign-In is not enabled for this app in Supabase yet. Please contact support.',
        );
      }
      throw error;
    }
    return data;
  } catch (error) {
    if (
      error?.code === statusCodes.SIGN_IN_CANCELLED ||
      error?.code === statusCodes.IN_PROGRESS
    ) {
      return null;
    }

    if (error?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Google Play Services is unavailable or out of date on this device.');
    }

    if (
      error?.code === '8' ||
      error?.code === '10' ||
      error?.message?.includes('INTERNAL_ERROR') ||
      error?.message?.includes('DEVELOPER_ERROR')
    ) {
      throw new Error(
        'This app build is not registered for Google Sign-In. Add this APK signing certificate SHA-1 to the com.tankua.co Android OAuth client in Google Cloud, then try again.',
      );
    }

    throw error;
  }
}
