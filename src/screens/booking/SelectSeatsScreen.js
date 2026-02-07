import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../config/theme';
import { useLanguage } from '../../contexts/LanguageContext';
import { useBooking } from '../../contexts/BookingContext';
import Button from '../../components/Button';

const SelectSeatsScreen = ({ navigation }) => {
  const { t } = useLanguage();
  const { currentBooking, updateBooking } = useBooking();
  const [seats, setSeats] = useState(1);

  const isPrivateTrip = currentBooking.tripType === 'private';

  const vehicleTypes = [
    { id: 'sedan', name: 'Sedan', capacity: 4, icon: 'car', price: 0 },
    { id: 'suv', name: 'SUV', capacity: 7, icon: 'car-sport', price: 200 },
    { id: 'van', name: 'Van', capacity: 12, icon: 'bus', price: 500 },
  ];

  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const handleContinue = () => {
    if (isPrivateTrip) {
      if (selectedVehicle) {
        updateBooking({ vehicleType: selectedVehicle, seats: selectedVehicle.capacity });
        // If more than 1 seat, go to passenger details, otherwise go to payment
        if (selectedVehicle.capacity > 1) {
          navigation.navigate('PassengerDetails');
        } else {
          navigation.navigate('Payment');
        }
      }
    } else {
      updateBooking({ seats });
      // If more than 1 seat, go to passenger details, otherwise go to payment
      if (seats > 1) {
        navigation.navigate('PassengerDetails');
      } else {
        navigation.navigate('Payment');
      }
    }
  };

  const incrementSeats = () => {
    if (seats < 10) setSeats(seats + 1);
  };

  const decrementSeats = () => {
    if (seats > 1) setSeats(seats - 1);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>
          {isPrivateTrip ? t('selectVehicle') : t('selectSeats')}
        </Text>
        <Text style={styles.subtitle}>
          {isPrivateTrip
            ? 'Choose the vehicle type for your trip'
            : 'How many seats do you need?'}
        </Text>

        {isPrivateTrip ? (
          <View style={styles.vehiclesContainer}>
            {vehicleTypes.map((vehicle) => (
              <TouchableOpacity
                key={vehicle.id}
                style={[
                  styles.vehicleCard,
                  selectedVehicle?.id === vehicle.id && styles.vehicleCardSelected,
                ]}
                onPress={() => setSelectedVehicle(vehicle)}
              >
                <Ionicons 
                  name={vehicle.icon} 
                  size={40} 
                  color={
                    selectedVehicle?.id === vehicle.id ? COLORS.primary : COLORS.gray
                  } 
                />
                <Text style={styles.vehicleName}>{vehicle.name}</Text>
                <Text style={styles.vehicleCapacity}>Up to {vehicle.capacity} passengers</Text>
                {vehicle.price > 0 && (
                  <Text style={styles.vehiclePrice}>+{vehicle.price} ETB</Text>
                )}
                {selectedVehicle?.id === vehicle.id && (
                  <Ionicons 
                    name="checkmark-circle" 
                    size={24} 
                    color={COLORS.primary}
                    style={styles.checkmark}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.seatsContainer}>
            <TouchableOpacity style={styles.seatButton} onPress={decrementSeats}>
              <Ionicons name="remove" size={28} color={COLORS.white} />
            </TouchableOpacity>

            <View style={styles.seatsDisplay}>
              <Text style={styles.seatsNumber}>{seats}</Text>
              <Text style={styles.seatsLabel}>{t('seats')}</Text>
            </View>

            <TouchableOpacity style={styles.seatButton} onPress={incrementSeats}>
              <Ionicons name="add" size={28} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={COLORS.primary} />
          <Text style={styles.infoText}>
            {isPrivateTrip
              ? 'The vehicle will be exclusively for your group'
              : 'Each seat costs 500 ETB base price'}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={t('continue')}
          onPress={handleContinue}
          disabled={isPrivateTrip ? !selectedVehicle : false}
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.gray,
    marginBottom: SPACING.xl,
  },
  seatsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: SPACING.xxl,
  },
  seatButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seatsDisplay: {
    alignItems: 'center',
    marginHorizontal: SPACING.xxl,
  },
  seatsNumber: {
    fontSize: 72,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  seatsLabel: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.gray,
    marginTop: SPACING.sm,
  },
  vehiclesContainer: {
    gap: SPACING.md,
  },
  vehicleCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  vehicleCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`,
  },
  vehicleName: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '600',
    color: COLORS.secondary,
    marginTop: SPACING.md,
  },
  vehicleCapacity: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  vehiclePrice: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: SPACING.sm,
  },
  checkmark: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: `${COLORS.primary}10`,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.xl,
  },
  infoText: {
    flex: 1,
    marginLeft: SPACING.md,
    fontSize: FONTS.sizes.sm,
    color: COLORS.secondary,
    lineHeight: 20,
  },
  footer: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  button: {
    width: '100%',
  },
});

export default SelectSeatsScreen;

