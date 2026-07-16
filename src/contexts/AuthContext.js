import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import {
  cancelAllNotifications,
  dismissAllNotifications,
  registerForPushNotifications,
  savePushToken,
  setBadgeCount,
} from '../services/notifications';

const AuthContext = createContext();

const IS_SANDBOX_BUILD = process.env.EXPO_PUBLIC_APP_ENV !== 'production';
const GOOGLE_REVIEW_PHONE = process.env.EXPO_PUBLIC_REVIEW_PHONE;
const GOOGLE_REVIEW_BYPASS = process.env.EXPO_PUBLIC_REVIEW_BYPASS_TOKEN;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkUser();
    
    // Listen for auth changes (handles automatic session refresh, logout, etc.)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.warn('[Telegram Debug] onAuthStateChange triggered with event:', event, 'user:', session?.user?.id);
      
      if (session?.user) {
        console.warn('[Telegram Debug] onAuthStateChange: user exists, deferring loadUserProfile...');
        setTimeout(async () => {
          console.warn('[Telegram Debug] onAuthStateChange (deferred): calling loadUserProfile...');
          await loadUserProfile(session.user.id);
          console.warn('[Telegram Debug] onAuthStateChange (deferred): loadUserProfile completed');
        }, 0);
      } else {
        console.warn('[Telegram Debug] onAuthStateChange: no user session');
        setUser(null);
        setIsAdmin(false);
        AsyncStorage.removeItem('user').catch(() => {});
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      // First, try to get cached user from AsyncStorage for faster initial load
      const cachedUser = await AsyncStorage.getItem('user');
      if (cachedUser) {
        try {
          const userData = JSON.parse(cachedUser);
          // Ensure location field exists (for backward compatibility)
          const userWithLocation = {
            ...userData,
            location: userData.location || '',
          };
          setUser(userWithLocation);
          setIsAdmin(userData.is_admin || false);
        } catch (e) {
          console.log('Error parsing cached user:', e);
        }
      }

      // Then verify session with Supabase (this handles automatic session restoration)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.log('Session error:', sessionError);
        // If session check fails, clear cached user
        if (cachedUser) {
          await AsyncStorage.removeItem('user');
          setUser(null);
          setIsAdmin(false);
        }
      } else if (session?.user) {
        // Session is valid, load fresh user profile
        await loadUserProfile(session.user.id);
        // Register for push notifications
        const pushToken = await registerForPushNotifications();
        if (pushToken && session.user.id) {
          await savePushToken(session.user.id, pushToken);
        }
      } else {
        // No valid session, clear user state
        if (cachedUser) {
          await AsyncStorage.removeItem('user');
          setUser(null);
          setIsAdmin(false);
        }
      }
    } catch (error) {
      console.log('Error checking user:', error);
      // On error, clear any cached data
      await AsyncStorage.removeItem('user');
      setUser(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async (userId) => {
    try {
      console.warn('[Telegram Debug] loadUserProfile started for:', userId);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('[Telegram Debug] loadUserProfile db error:', error.message, error.code);
        throw error;
      }

      if (data) {
        console.warn('[Telegram Debug] loadUserProfile got user data:', data.id);
        // Ensure all required fields exist (for backward compatibility)
        const userData = {
          ...data,
          name: data.name || '',
          phone_number: data.phone_number || '',
          emergency_contact: data.emergency_contact || '',
          location: data.location || '',
        };
        setUser(userData);
        setIsAdmin(data.is_admin || false);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (error) {
      console.warn('[Telegram Debug] loadUserProfile exception caught:', error.message);
    }
  };

  const sendOTP = async (phoneNumber) => {
    try {
      // Format phone number (remove spaces, ensure + prefix)
      const formattedPhone = phoneNumber.trim().startsWith('+') 
        ? phoneNumber.trim() 
        : `+${phoneNumber.trim()}`;

      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) throw error;

      return { success: true, phoneNumber: formattedPhone };
    } catch (error) {
      throw error;
    }
  };

  const verifyOTP = async (phoneNumber, token) => {
    try {
      const formattedPhone = phoneNumber.trim().startsWith('+') 
        ? phoneNumber.trim() 
        : `+${phoneNumber.trim()}`;

      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: token,
        type: 'sms',
      });

      if (error) throw error;

      if (data.user) {
        // Check if user profile exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (!existingUser) {
          // Create user profile
          const newUser = {
            id: data.user.id,
            phone_number: formattedPhone,
            name: '',
            email: '',
            emergency_contact: '',
            location: '',
            saved_destinations: [],
            saved_stations: [],
            is_admin: false,
            created_at: new Date().toISOString(),
          };

          const { error: insertError } = await supabase
            .from('users')
            .insert([newUser]);

          if (insertError) throw insertError;

          setUser(newUser);
          await AsyncStorage.setItem('user', JSON.stringify(newUser));
        } else {
          setUser(existingUser);
          setIsAdmin(existingUser.is_admin || false);
          await AsyncStorage.setItem('user', JSON.stringify(existingUser));
        }
      }

      return data.user;
    } catch (error) {
      throw error;
    }
  };

  const loginWithTelegram = async (telegramAuthData) => {
    try {
      const supabaseUrl =
        process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://dotjlikaurcjwabarqcy.supabase.co';
      const supabaseAnonKey =
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvdGpsaWthdXJjandhYmFycWN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwODY5MTQsImV4cCI6MjA4MDY2MjkxNH0.zZ0GeY_sV0TtP9jGVQRKPoXoDBCSpyNDlRKruAisa9A';

      console.warn('[Telegram Debug] loginWithTelegram started for id:', telegramAuthData.id);

      // ── Security: wipe any existing local state BEFORE setting a new session ─────
      setUser(null);
      setIsAdmin(false);
      await AsyncStorage.removeItem('user');
      // ─────────────────────────────────────────────────────────────────────

      console.warn('[Telegram Debug] Calling edge function...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn('[Telegram Debug] Edge function fetch TIMEOUT triggered (15s)');
        controller.abort();
      }, 15000);

      let response;
      try {
        response = await fetch(
          `${supabaseUrl}/functions/v1/telegram-auth`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${supabaseAnonKey}`,
            },
            body: JSON.stringify(telegramAuthData),
            signal: controller.signal,
          },
        );
      } catch (fetchErr) {
        console.warn('[Telegram Debug] fetch call threw error:', fetchErr.message);
        throw fetchErr;
      } finally {
        clearTimeout(timeoutId);
      }

      console.warn('[Telegram Debug] Fetch completed. Status:', response.status);
      const bodyText = await response.text();
      console.warn('[Telegram Debug] Edge function response length:', bodyText.length);

      let result;
      try {
        result = JSON.parse(bodyText);
      } catch {
        throw new Error(`Edge function returned non-JSON (HTTP ${response.status}): ${bodyText.slice(0, 200)}`);
      }

      if (!response.ok || result.error) {
        throw new Error(result.error || `HTTP ${response.status} from edge function`);
      }

      const { session } = result;
      if (!session?.access_token) {
        throw new Error('No session returned from Telegram auth');
      }

      // ── Belt-and-suspenders: confirm the session belongs to the Telegram
      const expectedId = String(telegramAuthData.id);
      const meta = session.user?.user_metadata;
      if (meta?.telegram_id && meta.telegram_id !== expectedId) {
        console.error('[Telegram] SECURITY VIOLATION: session telegram_id', meta.telegram_id, '!== expected', expectedId);
        throw new Error('Account mismatch detected. Please try signing in again.');
      }

      console.warn('[Telegram Debug] Got session, calling supabase.auth.setSession...');

      const { error: setSessionError } = await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });

      if (setSessionError) {
        console.warn('[Telegram Debug] setSession error:', setSessionError);
        throw setSessionError;
      }

      console.warn('[Telegram Debug] setSession succeeded. Querying users table...');

      // Check if user profile exists
      const { data: existingUser, error: getProfileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (getProfileError && getProfileError.code !== 'PGRST116') {
        console.warn('[Telegram Debug] Error checking user profile:', getProfileError);
        throw getProfileError;
      }

      if (!existingUser) {
        console.warn('[Telegram Debug] Profile not found, creating a new profile for', session.user.id);
        const name = telegramAuthData.first_name || telegramAuthData.username || 'Telegram User';
        const newUser = {
          id: session.user.id,
          name: name,
          email: '',
          emergency_contact: '',
          location: '',
          saved_destinations: [],
          saved_stations: [],
          is_admin: false,
          created_at: new Date().toISOString(),
        };

        // Try inserting without phone_number first (in case it is nullable in the DB)
        const { error: insertError } = await supabase
          .from('users')
          .insert([newUser]);

        if (insertError) {
          console.warn('[Telegram Debug] Insert without phone_number failed, trying fallback with telegram id as phone_number...', insertError);
          
          // Retry with phone_number set to telegram:id
          newUser.phone_number = `telegram:${telegramAuthData.id}`;
          
          const { error: retryError } = await supabase
            .from('users')
            .insert([newUser]);

          if (retryError) {
            console.warn('[Telegram Debug] Fallback insert also failed:', retryError);
            throw retryError;
          }
        }

        console.warn('[Telegram Debug] User profile created, updating state...');
        setUser(newUser);
        await AsyncStorage.setItem('user', JSON.stringify(newUser));
      } else {
        console.warn('[Telegram Debug] Existing profile found, updating state...');
        const userData = {
          ...existingUser,
          name: existingUser.name || '',
          phone_number: existingUser.phone_number || '',
          emergency_contact: existingUser.emergency_contact || '',
          location: existingUser.location || '',
        };
        setUser(userData);
        setIsAdmin(existingUser.is_admin || false);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
      }

      console.warn('[Telegram Debug] Login complete for telegram_id:', expectedId);
    } catch (error) {
      console.warn('[Telegram Debug] Exception caught in loginWithTelegram:', error.message);
      await supabase.auth.signOut().catch(() => {});
      setUser(null);
      setIsAdmin(false);
      await AsyncStorage.removeItem('user');
      throw new Error(error.message || 'Telegram login failed. Please try again.');
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      await AsyncStorage.removeItem('user');
      // Increment a counter persisted in AsyncStorage so TelegramLoginScreen
      // knows to remount its WebView and clear the Telegram session cookie.
      const prev = await AsyncStorage.getItem('webview_reset_key');
      await AsyncStorage.setItem('webview_reset_key', String((parseInt(prev || '0', 10) + 1)));
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.log('Error logging out:', error);
    }
  };

  const clearLocalAccountData = async () => {
    const keys = await AsyncStorage.getAllKeys();
    const accountKeys = keys.filter((key) => (
      key === 'user' ||
      key === 'pushToken' ||
      key === 'notification_preferences' ||
      key === 'favorite_destinations' ||
      key === 'recentSearches' ||
      key.startsWith('tripReminder_') ||
      key.startsWith('sb-')
    ));

    if (accountKeys.length > 0) {
      await AsyncStorage.multiRemove(accountKeys);
    }
  };

  const deleteAccount = async () => {
    if (!user?.id) {
      throw new Error('No signed-in user found.');
    }

    const { error } = await supabase.rpc('delete_current_user_account');

    if (error) {
      if (
        error.message?.includes('delete_current_user_account') ||
        error.message?.includes('function') ||
        error.code === 'PGRST202'
      ) {
        throw new Error('Account deletion is not enabled on the server yet. Please apply the latest database migration and try again.');
      }

      throw error;
    }

    try {
      await Promise.all([
        cancelAllNotifications(),
        dismissAllNotifications(),
        setBadgeCount(0),
      ]);
    } catch (notificationError) {
      console.log('Error clearing notifications:', notificationError);
    }

    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (signOutError) {
      console.log('Error clearing local auth session:', signOutError);
    }

    await clearLocalAccountData();
    setUser(null);
    setIsAdmin(false);
  };

  const updateProfile = async (updates) => {
    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      // Reload user from database to ensure all fields are up to date
      await loadUserProfile(user.id);
    } catch (error) {
      throw error;
    }
  };

  const checkBypassCredentials = async (phoneNumber, tokenInput) => {
    console.warn('[Reviewer Debug] IS_SANDBOX_BUILD:', IS_SANDBOX_BUILD);
    console.warn('[Reviewer Debug] GOOGLE_REVIEW_PHONE:', GOOGLE_REVIEW_PHONE);
    console.warn('[Reviewer Debug] GOOGLE_REVIEW_BYPASS:', GOOGLE_REVIEW_BYPASS);
    console.warn('[Reviewer Debug] Input Phone:', phoneNumber);
    console.warn('[Reviewer Debug] Input Token:', tokenInput);

    if (!IS_SANDBOX_BUILD) {
      console.warn('[Reviewer Debug] Failed because IS_SANDBOX_BUILD is false');
      return false;
    }

    const formattedInputPhone = phoneNumber?.trim();
    const formattedReviewPhone = GOOGLE_REVIEW_PHONE?.trim();
    const formattedInputToken = tokenInput?.trim();
    const formattedReviewToken = GOOGLE_REVIEW_BYPASS?.trim();

    if (!formattedReviewPhone || !formattedReviewToken) {
      console.warn('[Reviewer Debug] Failed because configured phone or token is missing/empty');
      return false;
    }

    const isMatch = (
      formattedInputPhone === formattedReviewPhone &&
      formattedInputToken === formattedReviewToken
    );
    console.warn('[Reviewer Debug] Match result:', isMatch);
    return isMatch;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        sendOTP,
        verifyOTP,
        loginWithTelegram,
        logout,
        deleteAccount,
        updateProfile,
        IS_SANDBOX_BUILD,
        checkBypassCredentials,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
