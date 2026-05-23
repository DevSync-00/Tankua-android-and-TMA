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
import Button from '../../components/Button';

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
          // Booking was reset, navigate to main tabs silently
          navigation.getParent()?.navigate('MainTabs', { screen: 'Home' });
          return;
        }
        
        // Otherwise, show alert and navigate back
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
      
      if (data.length === 0) {
        // Show empty state in UI
      }
    } catch (error) {
      console.error('Error loading trips:', error);
      Alert.alert('Error', 'Failed to load available trips. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (selectedTrip) {
      // Store trip and provider info
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
      // If it's just a date string, return default time
      return '6:00 AM';
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Ionicons key={i} name="star" size={14} color={COLORS.primary} />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Ionicons key={i} name="star-half" size={14} color={COLORS.primary} />
        );
      } else {
        stars.push(
          <Ionicons key={i} name="star-outline" size={14} color={COLORS.gray} />
        );
      }
    }
    return stars;
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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Select Trip</Text>
        <Text style={styles.subtitle}>
          {currentBooking.destination
            ? `Available trips to ${currentBooking.destination?.name || 'this destination'}`
            : 'Choose a trip for your journey'}
        </Text>

        {trips.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={COLORS.gray} />
            <Text style={styles.emptyText}>No trips available</Text>
            <Text style={styles.emptySubtext}>
              {currentBooking.destination
                ? `No trips are currently scheduled to ${currentBooking.destination?.name || 'this destination'}. Please check back later or try a different destination.`
                : 'Please check back later or contact support'}
            </Text>
          </View>
        ) : (
          <View style={styles.tripsList}>
            {trips.map((trip) => {
              const provider = trip.providers;
              const departureDate = trip.departure_date || trip.date;
              const returnDate = trip.return_date;
              const isRoundTrip = trip.trip_type === 'round_trip' || returnDate;
              
              return (
                <TouchableOpacity
                  key={trip.id}
                  style={[
                    styles.tripCard,
                    selectedTrip?.id === trip.id && styles.tripCardSelected,
                  ]}
                  onPress={() => setSelectedTrip(trip)}
                >
                  {/* Provider Info */}
                  <View style={styles.providerHeader}>
                    {provider?.logo_url ? (
                      <Image
                        source={{ uri: provider.logo_url }}
                        style={styles.providerLogo}
                      />
                    ) : (
                      <View style={styles.providerLogoPlaceholder}>
                        <Ionicons name="business" size={20} color={COLORS.primary} />
                      </View>
                    )}
                    <View style={styles.providerInfo}>
                      <Text style={styles.providerName}>
                        {provider?.name || 'Travel Provider'}
                      </Text>
                      {provider?.rating && (
                        <View style={styles.ratingContainer}>
                          <View style={styles.starsContainer}>
                            {renderStars(provider.rating)}
                          </View>
                          <Text style={styles.ratingText}>
                            {provider.rating.toFixed(1)}
                          </Text>
                        </View>
                      )}
                    </View>
                    {selectedTrip?.id === trip.id && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={COLORS.primary}
                      />
                    )}
                  </View>

                  {/* Trip Details */}
                  <View style={styles.tripDetails}>
                    {/* Departure */}
                    <View style={styles.dateTimeRow}>
                      <View style={styles.dateTimeContainer}>
                        <View style={styles.dateTimeHeader}>
                          <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
                          <Text style={styles.dateTimeLabel}>Departure</Text>
                        </View>
                        <Text style={styles.dateText}>{formatDate(departureDate)}</Text>
                        <Text style={styles.timeText}>{formatTime(departureDate)}</Text>
                      </View>

                      {/* Return (if round trip) */}
                      {isRoundTrip && returnDate && (
                        <View style={styles.dateTimeContainer}>
                          <View style={styles.dateTimeHeader}>
                            <Ionicons name="arrow-back" size={16} color={COLORS.secondary} />
                            <Text style={styles.dateTimeLabel}>Return</Text>
                          </View>
                          <Text style={styles.dateText}>{formatDate(returnDate)}</Text>
                          <Text style={styles.timeText}>{formatTime(returnDate)}</Text>
                        </View>
                      )}
                    </View>

                    {/* Trip Info */}
                    <View style={styles.tripInfoRow}>
                      <View style={styles.infoItem}>
                        <Ionicons name="people-outline" size={16} color={COLORS.gray} />
                        <Text style={styles.infoItemText}>
                          {trip.available_seats || 0} seats available
                        </Text>
                      </View>
                      <View style={styles.infoItem}>
                        <Ionicons name="cash-outline" size={16} color={COLORS.gray} />
                        <Text style={styles.priceText}>
                          {trip.price ? `${trip.price} ETB` : 'Price TBD'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Tankua charges a 5% service fee. The provider receives 95% of the base price.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={t('continue')}
          onPress={handleContinue}
          disabled={!selectedTrip}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONTS.sizes.md,
    color: COLORS.gray,
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
  tripsList: {
    gap: SPACING.md,
  },
  tripCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.medium,
  },
  tripCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}05`,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  providerLogo: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.lightGray,
    marginRight: SPACING.sm,
  },
  providerLogoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: SPACING.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  tripDetails: {
    gap: SPACING.md,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  dateTimeContainer: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  dateTimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  dateTimeLabel: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '600',
    color: COLORS.gray,
    textTransform: 'uppercase',
  },
  dateText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: 2,
  },
  timeText: {
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  tripInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  infoItemText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
  },
  priceText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.secondary,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: FONTS.sizes.md,
    color: COLORS.gray,
    marginTop: SPACING.sm,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
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

export default SelectTripScreen;

