import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../config/theme';
import { useLanguage } from '../../contexts/LanguageContext';
import { useBooking } from '../../contexts/BookingContext';
import Button from '../../components/Button';

const PassengerDetailsScreen = ({ navigation }) => {
  const { t } = useLanguage();
  const { currentBooking, updateBooking } = useBooking();
  const [passengers, setPassengers] = useState([]);

  useEffect(() => {
    // Initialize passengers array based on number of seats
    const seats = currentBooking.seats || 1;
    const initialPassengers = Array.from({ length: seats }, (_, index) => ({
      id: index + 1,
      name: index === 0 ? '' : '', // First passenger can be the user
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

    // Store passenger details in booking context
    updateBooking({ passengers });
    navigation.navigate('Payment');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Passenger Details</Text>
          <Text style={styles.subtitle}>
            Please enter name and age for each passenger ({passengers.length} {passengers.length === 1 ? 'person' : 'people'})
          </Text>
        </View>

        <View style={styles.passengersList}>
          {passengers.map((passenger, index) => (
            <View key={passenger.id} style={styles.passengerCard}>
              <View style={styles.passengerHeader}>
                <View style={styles.passengerNumber}>
                  <Text style={styles.passengerNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.passengerLabel}>
                  {index === 0 ? 'Primary Passenger' : `Passenger ${index + 1}`}
                </Text>
              </View>

              <View style={styles.formRow}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Full Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter full name"
                    placeholderTextColor={COLORS.grayLight}
                    value={passenger.name}
                    onChangeText={(text) => updatePassenger(index, 'name', text)}
                    autoCapitalize="words"
                  />
                </View>

                <View style={[styles.inputContainer, styles.ageInput]}>
                  <Text style={styles.inputLabel}>Age *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Age"
                    placeholderTextColor={COLORS.grayLight}
                    value={passenger.age}
                    onChangeText={(text) => {
                      // Only allow numbers
                      const numericValue = text.replace(/[^0-9]/g, '');
                      updatePassenger(index, 'age', numericValue);
                    }}
                    keyboardType="number-pad"
                    maxLength={3}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={COLORS.primary} />
          <Text style={styles.infoText}>
            All passenger information is required for booking confirmation and trip management.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={t('continue') || 'Continue'}
          onPress={handleContinue}
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
    paddingBottom: SPACING.xxl,
  },
  header: {
    marginBottom: SPACING.xl,
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
  },
  passengersList: {
    gap: SPACING.md,
  },
  passengerCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  passengerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  passengerNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  passengerNumberText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
  },
  passengerLabel: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
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
    flex: 0.4,
  },
  inputLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.secondary,
    marginBottom: SPACING.xs,
    fontWeight: '500',
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    fontSize: FONTS.sizes.md,
    color: COLORS.secondary,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: `${COLORS.primary}10`,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.lg,
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

export default PassengerDetailsScreen;
