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
      {/* Custom Back Header */}
      <View style={styles.customHeader}>
        <TouchableOpacity
          style={styles.customBackButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.customHeaderTitle}>
          {isPrivateTrip ? 'Select Vehicle' : 'Select Seats'}
        </Text>
        <View style={styles.customHeaderRight} />
      </View>

      {renderStepHeader()}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
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
                  activeOpacity={0.85}
                >
                  <View style={[styles.vehicleIconContainer, isSelected && styles.vehicleIconContainerActive]}>
                    <Ionicons 
                      name={vehicle.icon} 
                      size={24} 
                      color={isSelected ? COLORS.white : COLORS.secondary} 
                    />
                  </View>
                  <View style={styles.vehicleDetails}>
                    <Text style={styles.vehicleName}>{vehicle.name}</Text>
                    <Text style={styles.vehicleCapacity}>Up to {vehicle.capacity} passengers</Text>
                  </View>
                  <View style={styles.vehicleRight}>
                    {vehicle.price > 0 ? (
                      <Text style={styles.vehiclePrice}>+ETB {vehicle.price}</Text>
                    ) : (
                      <Text style={styles.vehicleFreeText}>Standard</Text>
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
          <View style={styles.seatSectionContainer}>
            {/* Quick Seat Selection Chips */}
            <Text style={styles.sectionSubtitle}>Quick Select Passengers</Text>
            <View style={styles.chipsRow}>
              {[1, 2, 3, 4, 5].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[styles.chipItem, seats === num && styles.chipItemActive]}
                  onPress={() => setSeats(num)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, seats === num && styles.chipTextActive]}>
                    {num} {num === 1 ? 'Seat' : 'Seats'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Stepper Box */}
            <View style={styles.counterCard}>
              <Text style={styles.counterTitle}>Passenger Count</Text>
              <View style={styles.seatsContainer}>
                <TouchableOpacity 
                  style={[styles.seatButton, seats === 1 && styles.seatButtonDisabled]} 
                  onPress={decrementSeats}
                  disabled={seats === 1}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={20} color={seats === 1 ? COLORS.grayLight : COLORS.secondary} />
                </TouchableOpacity>

                <View style={styles.seatsDisplay}>
                  <Text style={styles.seatsNumber}>{seats}</Text>
                  <Text style={styles.seatsLabel}>
                    {seats === 1 ? 'Passenger' : 'Passengers'}
                  </Text>
                </View>

                <TouchableOpacity 
                  style={[styles.seatButton, seats === 10 && styles.seatButtonDisabled]} 
                  onPress={incrementSeats}
                  disabled={seats === 10}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={20} color={seats === 10 ? COLORS.grayLight : COLORS.secondary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Live Price Breakdown Card */}
            <View style={styles.priceBreakdownCard}>
              <View style={styles.priceBreakdownRow}>
                <Text style={styles.priceBreakdownLabel}>Base Price per Seat</Text>
                <Text style={styles.priceBreakdownValue}>ETB {currentBooking.trip?.price || 500}</Text>
              </View>
              <View style={styles.priceBreakdownRow}>
                <Text style={styles.priceBreakdownLabel}>Passengers Selected</Text>
                <Text style={styles.priceBreakdownValue}>× {seats}</Text>
              </View>
              <View style={styles.priceBreakdownDivider} />
              <View style={styles.priceBreakdownRow}>
                <Text style={styles.priceTotalLabel}>Estimated Subtotal</Text>
                <Text style={styles.priceTotalValue}>ETB {(currentBooking.trip?.price || 500) * seats}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Warning Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.secondary} />
          <Text style={styles.infoText}>
            {isPrivateTrip
              ? 'The selected vehicle will be booked exclusively for your private travel group.'
              : 'Public trip tickets guarantee reserved seats on your selected bus departure.'}
          </Text>
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View style={styles.footer}>
        <View style={styles.footerSummary}>
          <Text style={styles.footerTotalLabel}>Total Amount</Text>
          <Text style={styles.footerTotalValue}>
            ETB {isPrivateTrip 
              ? (currentBooking.trip?.price || 1500) + (selectedVehicle?.price || 0)
              : (currentBooking.trip?.price || 500) * seats}
          </Text>
        </View>
        <ModernButton
          title={t('continue') || 'Continue'}
          onPress={handleContinue}
          disabled={isPrivateTrip ? !selectedVehicle : false}
          variant="primary"
          size="medium"
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
  seatSectionContainer: {
    gap: SPACING.md,
  },
  sectionSubtitle: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '800',
    color: COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  chipItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  chipItemActive: {
    borderColor: COLORS.secondary,
    backgroundColor: COLORS.secondary,
  },
  chipText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  chipTextActive: {
    color: COLORS.white,
  },
  counterCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  counterTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: SPACING.md,
  },
  seatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
  },
  seatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
  },
  seatButtonDisabled: {
    backgroundColor: COLORS.backgroundSecondary,
    borderColor: COLORS.borderLight,
    opacity: 0.4,
  },
  seatsDisplay: {
    alignItems: 'center',
    minWidth: 80,
  },
  seatsNumber: {
    fontSize: 40,
    fontWeight: '800',
    color: COLORS.secondary,
    letterSpacing: -1,
  },
  seatsLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  priceBreakdownCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    gap: 8,
    ...SHADOWS.small,
  },
  priceBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceBreakdownLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray,
    fontWeight: '600',
  },
  priceBreakdownValue: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.secondary,
    fontWeight: '700',
  },
  priceBreakdownDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 4,
  },
  priceTotalLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  priceTotalValue: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  infoText: {
    flex: 1,
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray,
    lineHeight: 18,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    ...SHADOWS.large,
  },
  footerSummary: {
    flex: 1,
    marginRight: SPACING.md,
  },
  footerTotalLabel: {
    fontSize: 10,
    color: COLORS.gray,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  footerTotalValue: {
    fontSize: FONTS.sizes.md,
    fontWeight: '800',
    color: COLORS.secondary,
    marginTop: 2,
  },
  button: {
    minWidth: 140,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  customBackButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
  },
  customHeaderTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '800',
    color: COLORS.secondary,
    textAlign: 'center',
  },
  customHeaderRight: {
    width: 36,
  },
});

export default SelectSeatsScreen;
