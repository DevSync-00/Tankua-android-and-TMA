import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useProfileCompletion } from '../hooks/useProfileCompletion';
import ProfileCompletionModal from '../components/ProfileCompletionModal';
import Loader from '../components/Loader';
import { COLORS } from '../config/theme';

// Auth Screens
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import TelegramLoginScreen from '../screens/TelegramLoginScreen';

// Main Screens
import MainTabNavigator from './MainTabNavigator';
import DestinationDetailScreen from '../screens/DestinationDetailScreen';
import BookingFlowNavigator from './BookingFlowNavigator';
import TicketScreen from '../screens/TicketScreen';

// Profile Screens
import MyAccountScreen from '../screens/MyAccountScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import HelpCenterScreen from '../screens/HelpCenterScreen';
import PaymentMethodsScreen from '../screens/PaymentMethodsScreen';
import CouponsScreen from '../screens/CouponsScreen';
import RewardsScreen from '../screens/RewardsScreen';
import ReferFriendScreen from '../screens/ReferFriendScreen';
import SuggestRouteScreen from '../screens/SuggestRouteScreen';
import CloseFriendsScreen from '../screens/CloseFriendsScreen';
import ReviewScreen from '../screens/ReviewScreen';
import SavedDestinationsScreen from '../screens/SavedDestinationsScreen';
import NotificationPreferencesScreen from '../screens/NotificationPreferencesScreen';

// Admin Screens
import AddAdminScreen from '../screens/admin/AddAdminScreen';

const Stack = createStackNavigator();

const AuthenticatedStack = () => {
  const navigation = useNavigation();
  const { isComplete, completionPercentage, missingFields, firstMissingField } = useProfileCompletion();
  const [modalDismissed, setModalDismissed] = useState(false);

  const showModal = !isComplete && !modalDismissed;

  const handleCompleteProfile = (targetField) => {
    setModalDismissed(true);
    navigation.navigate('MyAccount', { focusField: targetField || 'name' });
  };

  return (
    <View style={styles.flexOne}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        <Stack.Screen 
          name="DestinationDetail" 
          component={DestinationDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="BookingFlow" 
          component={BookingFlowNavigator}
        />
        <Stack.Screen 
          name="Ticket" 
          component={TicketScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="MyAccount" 
          component={MyAccountScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Notifications" 
          component={NotificationsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="HelpCenter" 
          component={HelpCenterScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="PaymentMethods" 
          component={PaymentMethodsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Coupons" 
          component={CouponsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Rewards" 
          component={RewardsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="ReferFriend" 
          component={ReferFriendScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="SuggestRoute" 
          component={SuggestRouteScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="CloseFriends" 
          component={CloseFriendsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Review" 
          component={ReviewScreen}
          options={{ headerShown: true, headerTitle: 'Rate Your Trip' }}
        />
        <Stack.Screen name="SavedDestinations" component={SavedDestinationsScreen} />
        <Stack.Screen name="NotificationPreferences" component={NotificationPreferencesScreen} />
        <Stack.Screen 
          name="AddAdmin" 
          component={AddAdminScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>

      <ProfileCompletionModal
        visible={showModal}
        completionPercentage={completionPercentage}
        missingFields={missingFields}
        firstMissingField={firstMissingField}
        onCompleteProfile={handleCompleteProfile}
        onDismiss={() => setModalDismissed(true)}
      />
    </View>
  );
};

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Loader size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="TelegramLogin" component={TelegramLoginScreen} />
        </>
      ) : (
        <Stack.Screen name="AuthenticatedApp" component={AuthenticatedStack} />
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});

export default AppNavigator;

