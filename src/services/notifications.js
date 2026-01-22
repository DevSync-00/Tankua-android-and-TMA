/**
 * Push Notifications Service
 * Handles registration, permissions, and sending local/push notifications
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// CONFIGURATION
// ============================================

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ============================================
// PUSH TOKEN REGISTRATION
// ============================================

/**
 * Register for push notifications and get the token
 */
export async function registerForPushNotifications() {
  let token = null;
  
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  try {
    // Check existing permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permission if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return null;
    }

    // Get project ID from multiple sources
    // 1. Try from environment variable
    // 2. Try from Constants (expo-constants)
    // 3. Try from app.json extra.eas.projectId
    const projectId = 
      process.env.EXPO_PUBLIC_PROJECT_ID ||
      Constants.expoConfig?.extra?.eas?.projectId ||
      Constants.expoConfig?.extra?.projectId ||
      Constants.expoConfig?.projectId;

    // Get push token
    // Note: Push notifications don't work in Expo Go, only in development builds
    let tokenData;
    try {
      if (projectId) {
        tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: projectId,
        });
      } else {
        // Try without projectId - Expo SDK 50+ can sometimes infer it
        // This will fail if projectId is required, which is expected in Expo Go
        tokenData = await Notifications.getExpoPushTokenAsync();
      }
      token = tokenData.data;
    } catch (error) {
      // In Expo Go, push notifications don't work, so this error is expected
      if (error.message?.includes('projectId')) {
        console.warn(
          'Push notifications require a projectId and a development build. ' +
          'Push notifications are not available in Expo Go. ' +
          'To enable push notifications:\n' +
          '1. Create a development build: npx expo run:android or npx expo run:ios\n' +
          '2. Add your Expo project ID to app.json under extra.eas.projectId, or\n' +
          '3. Set EXPO_PUBLIC_PROJECT_ID in your .env file'
        );
      } else {
        console.error('Error getting push token:', error);
      }
      // Return null gracefully - the app can still work without push notifications
      return null;
    }

    // Store token locally
    await AsyncStorage.setItem('pushToken', token);

    // Configure Android channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#D4A017',
      });

      await Notifications.setNotificationChannelAsync('bookings', {
        name: 'Booking Updates',
        description: 'Notifications about your trip bookings',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#D4A017',
      });

      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Trip Reminders',
        description: 'Reminders before your trips',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('promotions', {
        name: 'Promotions',
        description: 'Special offers and promotions',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Save push token to database for a user
 */
export async function savePushToken(userId, token) {
  try {
    const { error } = await supabase
      .from('users')
      .update({ 
        push_token: token,
        push_token_updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error saving push token:', error);
    return false;
  }
}

// ============================================
// LOCAL NOTIFICATIONS
// ============================================

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification({
  title,
  body,
  data = {},
  trigger = null, // null = immediate, or { seconds: 60 } etc.
  channelId = 'default',
}) {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
        ...(Platform.OS === 'android' && { channelId }),
      },
      trigger,
    });
    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
}

/**
 * Schedule a trip reminder notification
 */
export async function scheduleTripReminder(booking) {
  const tripDate = new Date(booking.tripDate);
  const reminderDate = new Date(tripDate.getTime() - 24 * 60 * 60 * 1000); // 24 hours before
  
  // Only schedule if the reminder is in the future
  if (reminderDate <= new Date()) {
    return null;
  }

  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚐 Trip Tomorrow!',
        body: `Don't forget your trip to ${booking.destinationName || booking.churchName || 'your destination'}. Pickup at ${booking.pickupTime} from ${booking.pickupStation}.`,
        data: {
          type: 'trip_reminder',
          bookingId: booking.id,
        },
        sound: 'default',
        ...(Platform.OS === 'android' && { channelId: 'reminders' }),
      },
      trigger: {
        date: reminderDate,
      },
    });

    // Store the notification ID so we can cancel it if needed
    await AsyncStorage.setItem(`tripReminder_${booking.id}`, notificationId);
    
    return notificationId;
  } catch (error) {
    console.error('Error scheduling trip reminder:', error);
    return null;
  }
}

/**
 * Cancel a scheduled trip reminder
 */
export async function cancelTripReminder(bookingId) {
  try {
    const notificationId = await AsyncStorage.getItem(`tripReminder_${bookingId}`);
    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      await AsyncStorage.removeItem(`tripReminder_${bookingId}`);
    }
  } catch (error) {
    console.error('Error cancelling trip reminder:', error);
  }
}

// ============================================
// NOTIFICATION TYPES
// ============================================

/**
 * Show booking confirmation notification
 */
export async function showBookingConfirmation(booking) {
  return scheduleLocalNotification({
    title: '✅ Booking Confirmed!',
    body: `Your trip to ${booking.destinationName || booking.churchName || 'your destination'} is confirmed for ${booking.tripDate}. Check your tickets in the app.`,
    data: {
      type: 'booking_confirmation',
      bookingId: booking.id,
    },
    channelId: 'bookings',
  });
}

/**
 * Show payment success notification
 */
export async function showPaymentSuccess(booking) {
  return scheduleLocalNotification({
    title: '💰 Payment Successful!',
    body: `Payment of ${booking.amount} ETB received. Your ticket is ready!`,
    data: {
      type: 'payment_success',
      bookingId: booking.id,
    },
    channelId: 'bookings',
  });
}

/**
 * Show booking cancellation notification
 */
export async function showBookingCancellation(booking, reason) {
  return scheduleLocalNotification({
    title: '❌ Booking Cancelled',
    body: reason || `Your booking for ${booking.destinationName || booking.churchName || 'your destination'} has been cancelled.`,
    data: {
      type: 'booking_cancelled',
      bookingId: booking.id,
    },
    channelId: 'bookings',
  });
}

/**
 * Show promotion notification
 */
export async function showPromotion(promo) {
  return scheduleLocalNotification({
    title: `🎉 ${promo.title}`,
    body: promo.description,
    data: {
      type: 'promotion',
      promoId: promo.id,
      promoCode: promo.code,
    },
    channelId: 'promotions',
  });
}

// ============================================
// NOTIFICATION LISTENERS
// ============================================

/**
 * Add listener for received notifications (when app is foregrounded)
 */
export function addNotificationReceivedListener(callback) {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add listener for notification responses (when user taps notification)
 */
export function addNotificationResponseListener(callback) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Get the last notification response (for handling cold starts)
 */
export async function getLastNotificationResponse() {
  return Notifications.getLastNotificationResponseAsync();
}

// ============================================
// NOTIFICATION MANAGEMENT
// ============================================

/**
 * Get all scheduled notifications
 */
export async function getScheduledNotifications() {
  return Notifications.getAllScheduledNotificationsAsync();
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications() {
  return Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Dismiss all delivered notifications
 */
export async function dismissAllNotifications() {
  return Notifications.dismissAllNotificationsAsync();
}

/**
 * Get notification badge count
 */
export async function getBadgeCount() {
  return Notifications.getBadgeCountAsync();
}

/**
 * Set notification badge count
 */
export async function setBadgeCount(count) {
  return Notifications.setBadgeCountAsync(count);
}

// ============================================
// NOTIFICATION PREFERENCES
// ============================================

const NOTIFICATION_PREFS_KEY = 'notification_preferences';

/**
 * Get notification preferences
 */
export async function getNotificationPreferences() {
  try {
    const prefs = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
    return prefs ? JSON.parse(prefs) : {
      bookingUpdates: true,
      tripReminders: true,
      promotions: true,
      announcements: true,
    };
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return {
      bookingUpdates: true,
      tripReminders: true,
      promotions: true,
      announcements: true,
    };
  }
}

/**
 * Save notification preferences
 */
export async function saveNotificationPreferences(preferences) {
  try {
    await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(preferences));
    return true;
  } catch (error) {
    console.error('Error saving notification preferences:', error);
    return false;
  }
}

/**
 * Check if a specific notification type is enabled
 */
export async function isNotificationTypeEnabled(type) {
  const prefs = await getNotificationPreferences();
  return prefs[type] !== false;
}


