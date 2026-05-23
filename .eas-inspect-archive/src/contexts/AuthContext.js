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
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (session?.user) {
        // User is authenticated, load their profile
        await loadUserProfile(session.user.id);
      } else {
        // User is not authenticated, clear state
        setUser(null);
        setIsAdmin(false);
        await AsyncStorage.removeItem('user');
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
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
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
      console.log('Error loading user profile:', error);
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

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      await AsyncStorage.removeItem('user');
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

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        sendOTP,
        verifyOTP,
        logout,
        deleteAccount,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
