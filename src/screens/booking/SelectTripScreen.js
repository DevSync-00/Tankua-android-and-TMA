import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../config/theme';
import { useLanguage } from '../../contexts/LanguageContext';
import { useBooking } from '../../contexts/BookingContext';
import { getTrips } from '../../services/database';
import ModernButton from '../../components/ModernButton';

const SelectTripScreen = ({ navigation }) => {
  const { t } = useLanguage();
  const { currentBooking, updateBooking } = useBooking();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(currentBooking.trip || null);

  useEffect(() => {
    loadTrips();
  }, [currentBooking.destination]);

  const loadTrips = async () => {
    try {
      setLoading(true);
      const destination = currentBooking.destination;

      if (!destination?.id) {
        const isBookingReset =
          !currentBooking.destination &&
          !currentBooking.provider &&
          !currentBooking.trip;
        
        if (isBookingReset) {
          navigation.getParent()?.navigate('MainTabs', { screen: 'Home' });
          return;
        }
        
        Alert.alert('Error', 'Please select a destination first');
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.getParent()?.navigate('MainTabs', { screen: 'Home' });
        }
        return;
      }

      const filters = { destinationId: destination.id };
      const data = await getTrips(filters);
      setTrips(data);
    } catch (error) {
      console.error('Error loading trips:', error);
      Alert.alert('Error', 'Failed to load available trips. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (selectedTrip) {
      updateBooking({ 
        trip: selectedTrip,
        provider: selectedTrip.providers,
        tripType: selectedTrip.trip_type,
        date: selectedTrip.departure_date || selectedTrip.date,
      });
      navigation.navigate('SelectPickupStation');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'TBD';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '6:00 AM';
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Ionicons key={i} name="star" size={12} color={COLORS.primary} />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Ionicons key={i} name="star-half" size={12} color={COLORS.primary} />);
      } else {
        stars.push(<Ionicons key={i} name="star-outline" size={12} color={COLORS.grayLight} />);
      }
    }
    return stars;
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
          const isActive = step.key === 'trips';
          const isCompleted = false;
          return (
            <React.Fragment key={step.key}>
              <View style={stepStyles.stepWrapper}>
                <View style={[
                  stepStyles.stepCircle,
                  isActive && stepStyles.stepCircleActive,
                  isCompleted && stepStyles.stepCircleCompleted
                ]}>
                  <Text style={[
                    stepStyles.stepNumber,
                    isActive && stepStyles.stepNumberActive,
                  ]}>{idx + 1}</Text>
                </View>
                <Text style={[
                  stepStyles.stepLabel,
                  isActive && stepStyles.stepLabelActive
                ]}>{step.label}</Text>
              </View>
              {idx < steps.length - 1 && (
                <View style={stepStyles.stepDivider} />
              )}
            </React.Fragment>
          );
        })}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading available trips...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {renderStepHeader()}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Trip</Text>
          <Text style={styles.subtitle}>
            {currentBooking.destination
              ? `Available trips to ${currentBooking.destination?.name || 'this destination'}`
              : 'Choose a trip for your journey'}
          </Text>
        </View>

        {trips.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={60} color={COLORS.grayLight} />
            <Text style={styles.emptyText}>No trips scheduled</Text>
            <Text style={styles.emptySubtext}>
              {currentBooking.destination
                ? `No trips are currently scheduled to ${currentBooking.destination?.name}. Please check back later.`
                : 'Please check back later or contact support.'}
            </Text>
          </View>
        ) : (
          <View style={styles.tripsList}>
            {trips.map((trip) => {
              const provider = trip.providers;
              const departureDate = trip.departure_date || trip.date;
              const returnDate = trip.return_date;
              const isRoundTrip = trip.trip_type === 'round_trip' || returnDate;
              const isSelected = selectedTrip?.id === trip.id;
              
              return (
                <TouchableOpacity
                  key={trip.id}
                  activeOpacity={0.9}
                  style={[
                    styles.tripCard,
                    isSelected && styles.tripCardSelected,
                  ]}
                  onPress={() => setSelectedTrip(trip)}
                >
                  {/* Provider Brand Info */}
                  <View style={styles.providerHeader}>
                    {provider?.logo_url ? (
                      <Image source={{ uri: provider.logo_url }} style={styles.providerLogo} />
                    ) : (
                      <View style={styles.providerLogoPlaceholder}>
                        <Ionicons name="bus" size={18} color={COLORS.iconPrimary} />
                      </View>
                    )}
                    <View style={styles.providerInfo}>
                      <Text style={styles.providerName}>{provider?.name || 'Travel Provider'}</Text>
                      {provider?.rating && (
                        <View style={styles.ratingRow}>
                          <View style={styles.starsRow}>{renderStars(provider.rating)}</View>
                          <Text style={styles.ratingText}>{provider.rating.toFixed(1)}</Text>
                        </View>
                      )}
                    </View>
                    <View style={[styles.selectIndicator, isSelected && styles.selectIndicatorActive]}>
                      {isSelected && <Ionicons name="checkmark" size={14} color={COLORS.white} />}
                    </View>
                  </View>

                  {/* Route & Times */}
                  <View style={styles.tripDetails}>
                    <View style={styles.itineraryContainer}>
                      <View style={styles.itineraryPoint}>
                        <View style={styles.pointIndicator} />
                        <View style={styles.pointContent}>
                          <Text style={styles.pointLabel}>Departure</Text>
                          <Text style={styles.pointDate}>{formatDate(departureDate)}</Text>
                          <Text style={styles.pointTime}>{formatTime(departureDate)}</Text>
                        </View>
                      </View>

                      {isRoundTrip && returnDate && (
                        <View style={[styles.itineraryPoint, { marginTop: SPACING.md }]}>
                          <View style={[styles.pointIndicator, { backgroundColor: COLORS.secondary }]} />
                          <View style={styles.pointContent}>
                            <Text style={styles.pointLabel}>Return</Text>
                            <Text style={styles.pointDate}>{formatDate(returnDate)}</Text>
                            <Text style={styles.pointTime}>{formatTime(returnDate)}</Text>
                          </View>
                        </View>
                      )}
                    </View>

                    {/* Divider */}
                    <View style={styles.cardDivider} />

                    {/* Trip Badges Footer */}
                    <View style={styles.tripBadgesRow}>
                      <View style={styles.badgeItem}>
                        <Ionicons name="people-outline" size={14} color={COLORS.gray} />
                        <Text style={styles.badgeText}>{trip.available_seats || 0} seats left</Text>
                      </View>
                      <View style={styles.pricePill}>
                        <Text style={styles.pricePillText}>
                          {trip.price ? `ETB ${trip.price}` : 'Price TBD'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Info Fee Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.iconSecondary} />
          <Text style={styles.infoText}>
            Tankua platform charges a 5% service fee included in the final price summary.
          </Text>
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View style={styles.footer}>
        <ModernButton
          title={t('continue') || 'Continue'}
          onPress={handleContinue}
          disabled={!selectedTrip}
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
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  content: {
    padding: SPACING.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONTS.sizes.md,
    color: COLORS.gray,
    fontWeight: '500',
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: COLORS.secondary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: SPACING.xl,
  },
  emptyText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.secondary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 20,
  },
  tripsList: {
    gap: SPACING.md,
  },
  tripCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.small,
  },
  tripCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.cardBackground,
    ...SHADOWS.medium,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  providerLogo: {
    width: 38,
    height: 38,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundGray,
  },
  providerLogoPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  providerName: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  starsRow: {
    flexDirection: 'row',
    marginRight: 4,
  },
  ratingText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  selectIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.borderDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectIndicatorActive: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  tripDetails: {
    marginTop: SPACING.xs,
  },
  itineraryContainer: {
    marginLeft: 4,
  },
  itineraryPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pointIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginTop: 5,
    marginRight: SPACING.md,
  },
  pointContent: {
    flex: 1,
  },
  pointLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pointDate: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.secondary,
    marginTop: 1,
  },
  pointTime: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray,
    fontWeight: '500',
    marginTop: 1,
  },
  cardDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.md,
  },
  tripBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.grayDark,
    fontWeight: '500',
    marginLeft: 4,
  },
  pricePill: {
    backgroundColor: COLORS.backgroundTertiary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pricePillText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '800',
    color: COLORS.iconSecondary,
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
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    ...SHADOWS.large,
  },
  button: {
    width: '100%',
  },
});

export default SelectTripScreen;
