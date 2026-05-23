import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import SelectTripTypeScreen from '../screens/booking/SelectTripTypeScreen';
import SelectDateScreen from '../screens/booking/SelectDateScreen';
import SelectProviderScreen from '../screens/booking/SelectProviderScreen';
import SelectTripScreen from '../screens/booking/SelectTripScreen';
import SelectPickupStationScreen from '../screens/booking/SelectPickupStationScreen';
import SelectSeatsScreen from '../screens/booking/SelectSeatsScreen';
import PassengerDetailsScreen from '../screens/booking/PassengerDetailsScreen';
import PaymentScreen from '../screens/booking/PaymentScreen';
import ConfirmationScreen from '../screens/booking/ConfirmationScreen';

const Stack = createStackNavigator();

const BookingFlowNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#0A1A2F',
        },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen 
        name="SelectTripType" 
        component={SelectTripTypeScreen}
        options={{ title: 'Select Trip Type' }}
      />
      <Stack.Screen 
        name="SelectDate" 
        component={SelectDateScreen}
        options={{ title: 'Select Date' }}
      />
      <Stack.Screen 
        name="SelectProvider" 
        component={SelectProviderScreen}
        options={{ title: 'Select Provider' }}
      />
      <Stack.Screen 
        name="SelectTrip" 
        component={SelectTripScreen}
        options={{ title: 'Select Trip' }}
      />
      <Stack.Screen 
        name="SelectPickupStation" 
        component={SelectPickupStationScreen}
        options={{ title: 'Pickup Station' }}
      />
      <Stack.Screen 
        name="SelectSeats" 
        component={SelectSeatsScreen}
        options={{ title: 'Select Seats' }}
      />
      <Stack.Screen 
        name="PassengerDetails" 
        component={PassengerDetailsScreen}
        options={{ title: 'Passenger Details' }}
      />
      <Stack.Screen 
        name="Payment" 
        component={PaymentScreen}
        options={{ title: 'Payment' }}
      />
      <Stack.Screen 
        name="Confirmation" 
        component={ConfirmationScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
};

export default BookingFlowNavigator;

