import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../config/theme';
import { useLanguage } from '../../contexts/LanguageContext';
import { useBooking } from '../../contexts/BookingContext';
import ModernButton from '../../components/ModernButton';

const PassengerDetailsScreen = ({ navigation }) => {
  const { t } = useLanguage();
  const { currentBooking, updateBooking } = useBooking();
  const [passengers, setPassengers] = useState([]);
  const [activeField, setActiveField] = useState(null); // tracking focus

  useEffect(() => {
    const seats = currentBooking.seats || 1;
    const initialPassengers = Array.from({ length: seats }, (_, index) => ({
      id: index + 1,
      name: '',
      age: '',
    }));
    setPassengers(initialPassengers);
  }, [currentBooking.seats]);

  const updatePassenger = (index, field, value) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    setPassengers(updated);
  };

  const validatePassengers = () => {
    for (let i = 0; i < passengers.length; i++) {
      const passenger = passengers[i];
      if (!passenger.name || passenger.name.trim() === '') {
        Alert.alert('Missing Information', `Please enter the name for passenger ${i + 1}`);
        return false;
      }
      if (!passenger.age || passenger.age.trim() === '') {
        Alert.alert('Missing Information', `Please enter the age for passenger ${i + 1}`);
        return false;
      }
      const age = parseInt(passenger.age);
      if (isNaN(age) || age < 1 || age > 120) {
        Alert.alert('Invalid Age', `Please enter a valid age (1-120) for passenger ${i + 1}`);
        return false;
      }
    }
    return true;
  };

  const handleContinue = () => {
    if (!validatePassengers()) {
      return;
    }

    updateBooking({ passengers });
    navigation.navigate('Payment');
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
          <Text style={styles.title}>Passenger Details</Text>
          <Text style={styles.subtitle}>
            Please enter the full name and age for each passenger seat reserved
          </Text>
        </View>

        <View style={styles.passengersList}>
          {passengers.map((passenger, index) => {
            const isPrimary = index === 0;
            return (
              <View key={passenger.id} style={styles.passengerCard}>
                <View style={styles.passengerHeader}>
                  <View style={[styles.passengerNumber, isPrimary && styles.passengerNumberPrimary]}>
                    <Text style={styles.passengerNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.passengerLabel}>
                    {isPrimary ? 'Primary Passenger (User)' : `Passenger ${index + 1}`}
                  </Text>
                </View>

                <View style={styles.formRow}>
                  {/* Name Input */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Full Name *</Text>
                    <TextInput
                      style={[
                        styles.input,
                        activeField === `name-${index}` && styles.inputFocused,
                      ]}
                      placeholder="Enter full name"
                      placeholderTextColor={COLORS.grayLight}
                      value={passenger.name}
                      onFocus={() => setActiveField(`name-${index}`)}
                      onBlur={() => setActiveField(null)}
                      onChangeText={(text) => updatePassenger(index, 'name', text)}
                      autoCapitalize="words"
                    />
                  </View>

                  {/* Age Input */}
                  <View style={[styles.inputContainer, styles.ageInput]}>
                    <Text style={styles.inputLabel}>Age *</Text>
                    <TextInput
                      style={[
                        styles.input,
                        activeField === `age-${index}` && styles.inputFocused,
                      ]}
                      placeholder="Age"
                      placeholderTextColor={COLORS.grayLight}
                      value={passenger.age}
                      onFocus={() => setActiveField(`age-${index}`)}
                      onBlur={() => setActiveField(null)}
                      onChangeText={(text) => {
                        const numericValue = text.replace(/[^0-9]/g, '');
                        updatePassenger(index, 'age', numericValue);
                      }}
                      keyboardType="number-pad"
                      maxLength={3}
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Info Disclaimer Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={22} color={COLORS.iconSecondary} />
          <Text style={styles.infoText}>
            Accurate passenger names and ages are required for travel ticketing, verification, and insurance compliance.
          </Text>
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View style={styles.footer}>
        <ModernButton
          title={t('continue') || 'Continue'}
          onPress={handleContinue}
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
  passengersList: {
    gap: SPACING.md,
  },
  passengerCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.small,
  },
  passengerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  passengerNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  passengerNumberPrimary: {
    backgroundColor: COLORS.primary,
  },
  passengerNumberText: {
    color: COLORS.secondary,
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
  },
  passengerLabel: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  formRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  inputContainer: {
    flex: 1,
  },
  ageInput: {
    flex: 0.35,
  },
  inputLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.grayDark,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONTS.sizes.md,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  inputFocused: {
    borderColor: COLORS.secondary,
    borderWidth: 2,
    backgroundColor: COLORS.white,
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

export default PassengerDetailsScreen;
