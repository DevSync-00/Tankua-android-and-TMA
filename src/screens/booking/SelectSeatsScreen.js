import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../config/theme';
import { useLanguage } from '../../contexts/LanguageContext';
import { useBooking } from '../../contexts/BookingContext';
import ModernButton from '../../components/ModernButton';

const SelectSeatsScreen = ({ navigation }) => {
  const { t } = useLanguage();
  const { currentBooking, updateBooking } = useBooking();
  const [seats, setSeats] = useState(1);

  const isPrivateTrip = currentBooking.tripType === 'private';

  const vehicleTypes = [
    { id: 'sedan', name: 'Sedan', capacity: 4, icon: 'car-outline', price: 0 },
    { id: 'suv', name: 'SUV', capacity: 7, icon: 'car-sport-outline', price: 200 },
    { id: 'van', name: 'Van', capacity: 12, icon: 'bus-outline', price: 500 },
  ];

  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const handleContinue = () => {
    if (isPrivateTrip) {
      if (selectedVehicle) {
        updateBooking({ vehicleType: selectedVehicle, seats: selectedVehicle.capacity });
        if (selectedVehicle.capacity > 1) {
          navigation.navigate('PassengerDetails');
        } else {
          navigation.navigate('Payment');
        }
      }
    } else {
      updateBooking({ seats });
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

  // Step Progress Header
  const renderStepHeader = () => {
    const steps = [
      { key: 'trips', label: 'Trips' },
      { key: 'pickup', label: 'Pickup' },
      { key: 'seats', label: 'Seats' },
      { key: 'payment', label: 'Payment' }
    ];
    return (
      <View style={stepStyles.progressContainer}>
        {steps.map((step, idx) => {
          const isActive = step.key === 'seats';
          const isCompleted = idx < 2;
          return (
            <React.Fragment key={step.key}>
              <View style={stepStyles.stepWrapper}>
                <View style={[
                  stepStyles.stepCircle,
                  isActive && stepStyles.stepCircleActive,
                  isCompleted && stepStyles.stepCircleCompleted
                ]}>
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={12} color={COLORS.white} />
                  ) : (
                    <Text style={[
                      stepStyles.stepNumber,
                      isActive && stepStyles.stepNumberActive,
                    ]}>{idx + 1}</Text>
                  )}
                </View>
                <Text style={[
                  stepStyles.stepLabel,
                  isActive && stepStyles.stepLabelActive
                ]}>{step.label}</Text>
              </View>
              {idx < steps.length - 1 && (
                <View style={[
                  stepStyles.stepDivider,
                  isCompleted && stepStyles.stepDividerCompleted
                ]} />
              )}
            </React.Fragment>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {renderStepHeader()}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {isPrivateTrip ? t('selectVehicle') || 'Select Vehicle' : t('selectSeats') || 'Select Seats'}
          </Text>
          <Text style={styles.subtitle}>
            {isPrivateTrip
              ? 'Choose the vehicle type for your group'
              : 'How many seats do you need for this journey?'}
          </Text>
        </View>

        {isPrivateTrip ? (
          <View style={styles.vehiclesContainer}>
            {vehicleTypes.map((vehicle) => {
              const isSelected = selectedVehicle?.id === vehicle.id;
              return (
                <TouchableOpacity
                  key={vehicle.id}
                  style={[
                    styles.vehicleCard,
                    isSelected && styles.vehicleCardSelected,
                  ]}
                  onPress={() => setSelectedVehicle(vehicle)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.vehicleIconContainer, isSelected && styles.vehicleIconContainerActive]}>
                    <Ionicons 
                      name={vehicle.icon} 
                      size={28} 
                      color={isSelected ? COLORS.secondary : COLORS.iconPrimary} 
                    />
                  </View>
                  <View style={styles.vehicleDetails}>
                    <Text style={styles.vehicleName}>{vehicle.name}</Text>
                    <Text style={styles.vehicleCapacity}>Up to {vehicle.capacity} passengers</Text>
                  </View>
                  <View style={styles.vehicleRight}>
                    {vehicle.price > 0 && (
                      <Text style={styles.vehiclePrice}>+ETB {vehicle.price}</Text>
                    )}
                    <View style={[styles.radioDot, isSelected && styles.radioDotActive]}>
                      {isSelected && <View style={styles.radioDotInner} />}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.counterCard}>
            <Text style={styles.counterTitle}>Number of Passengers</Text>
            <View style={styles.seatsContainer}>
              <TouchableOpacity 
                style={[styles.seatButton, seats === 1 && styles.seatButtonDisabled]} 
                onPress={decrementSeats}
                disabled={seats === 1}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={24} color={seats === 1 ? COLORS.grayLight : COLORS.secondary} />
              </TouchableOpacity>

              <View style={styles.seatsDisplay}>
                <Text style={styles.seatsNumber}>{seats}</Text>
                <Text style={styles.seatsLabel}>
                  {seats === 1 ? 'Seat' : 'Seats'}
                </Text>
              </View>

              <TouchableOpacity 
                style={[styles.seatButton, seats === 10 && styles.seatButtonDisabled]} 
                onPress={incrementSeats}
                disabled={seats === 10}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={24} color={seats === 10 ? COLORS.grayLight : COLORS.secondary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Warning Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={22} color={COLORS.iconSecondary} />
          <Text style={styles.infoText}>
            {isPrivateTrip
              ? 'The selected vehicle will be booked exclusively for your private travel group.'
              : 'Public trip ticket bookings have a base price of ETB 500 per passenger seat.'}
          </Text>
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View style={styles.footer}>
        <ModernButton
          title={t('continue') || 'Continue'}
          onPress={handleContinue}
          disabled={isPrivateTrip ? !selectedVehicle : false}
          variant="primary"
          size="large"
          icon="arrow-forward"
          iconPosition="right"
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
};

const stepStyles = StyleSheet.create({
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  stepWrapper: {
    alignItems: 'center',
    width: 60,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepCircleActive: {
    backgroundColor: COLORS.primary,
  },
  stepCircleCompleted: {
    backgroundColor: COLORS.secondary,
  },
  stepNumber: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: '700',
  },
  stepNumberActive: {
    color: COLORS.secondary,
  },
  stepLabel: {
    fontSize: 10,
    color: COLORS.gray,
    fontWeight: '500',
  },
  stepLabelActive: {
    color: COLORS.secondary,
    fontWeight: 'bold',
  },
  stepDivider: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.borderLight,
    maxWidth: 40,
    marginTop: -14,
  },
  stepDividerCompleted: {
    backgroundColor: COLORS.secondary,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  content: {
    padding: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '800',
    color: COLORS.secondary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    fontWeight: '500',
    marginTop: 2,
  },
  vehiclesContainer: {
    gap: SPACING.md,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.small,
  },
  vehicleCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.cardBackground,
  },
  vehicleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleIconContainerActive: {
    backgroundColor: COLORS.primary,
  },
  vehicleDetails: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  vehicleName: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  vehicleCapacity: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray,
    fontWeight: '500',
    marginTop: 2,
  },
  vehicleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  vehiclePrice: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    color: COLORS.iconSecondary,
  },
  radioDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.borderDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDotActive: {
    borderColor: COLORS.secondary,
  },
  radioDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.secondary,
  },
  counterCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  counterTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: SPACING.lg,
  },
  seatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  seatButtonDisabled: {
    backgroundColor: COLORS.backgroundGray,
    borderColor: COLORS.borderLight,
  },
  seatsDisplay: {
    alignItems: 'center',
    minWidth: 100,
  },
  seatsNumber: {
    fontSize: 54,
    fontWeight: '900',
    color: COLORS.secondary,
    letterSpacing: -1,
  },
  seatsLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.xl,
    gap: SPACING.sm,
  },
  infoText: {
    flex: 1,
    fontSize: FONTS.sizes.xs,
    color: COLORS.charcoal,
    lineHeight: 18,
    fontWeight: '500',
  },
  footer: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    ...SHADOWS.large,
  },
  button: {
    width: '100%',
  },
});

export default SelectSeatsScreen;
