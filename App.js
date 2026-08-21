import 'react-native-url-polyfill/auto';
import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { BookingProvider } from './src/contexts/BookingContext';
import { FeedbackProvider } from './src/contexts/FeedbackContext';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import { addNotificationReceivedListener, addNotificationResponseListener, setBadgeCount } from './src/services/notifications';
import { supabase } from './src/config/supabase';
import { configureGoogleSignIn } from './src/services/googleAuth';

configureGoogleSignIn();

// Component to handle notification listeners
function NotificationHandler({ children }) {
  const { user } = useAuth();
  const notificationListener = useRef(null);
  const responseListener = useRef(null);

  useEffect(() => {
    // Set up notification received listener (when app is in foreground)
    notificationListener.current = addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      // Update badge count
      updateBadgeCount();
    });

    // Set up notification response listener (when user taps notification)
    responseListener.current = addNotificationResponseListener(response => {
      console.log('Notification tapped:', response);
      const data = response.notification.request.content.data;
      
      // Handle navigation based on notification type
      if (data?.type === 'booking_confirmation' || data?.type === 'payment_success') {
        // Navigate to ticket screen if needed
        // Navigation is handled by the notification screen
      }
    });

    // Update badge count on mount
    updateBadgeCount();

    // Set up interval to update badge count periodically
    const interval = setInterval(updateBadgeCount, 60000); // Every minute

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
      clearInterval(interval);
    };
  }, [user]);

  const updateBadgeCount = async () => {
    if (!user?.id) {
      await setBadgeCount(0);
      return;
    }

    try {
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_type', 'user')
        .eq('recipient_id', user.id)
        .eq('is_read', false);

      await setBadgeCount(count || 0);
    } catch (error) {
      console.error('Error updating badge count:', error);
    }
  };

  return children;
}

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <LanguageProvider>
            <AuthProvider>
              <FeedbackProvider>
                <NotificationHandler>
                  <BookingProvider>
                    <View style={{ flex: 1, backgroundColor: '#FFF8E6' }}>
                      <NavigationContainer
                        theme={{
                          dark: false,
                          colors: {
                            primary: '#FFB800',
                            background: '#FFF8E6',
                            card: '#FFFFFF',
                            text: '#1A1A2E',
                            border: '#E5E7EB',
                            notification: '#FFB800',
                          },
                        }}
                      >
                        <StatusBar style="dark" />
                        <AppNavigator />
                      </NavigationContainer>
                    </View>
                  </BookingProvider>
                </NotificationHandler>
              </FeedbackProvider>
            </AuthProvider>
          </LanguageProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
