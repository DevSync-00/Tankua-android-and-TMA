import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../config/theme';
import { useLanguage } from '../../contexts/LanguageContext';
import { useBooking } from '../../contexts/BookingContext';
import { useFeedback } from '../../contexts/FeedbackContext';
import { expressTripInterest, getMyTripInterests, getTrips, getTripStations } from '../../services/database';
import ModernButton from '../../components/ModernButton';
import { formatTripPrice } from '../../utils/tripCurrency';

const SelectTripScreen = ({ navigation }) => {
  const { t } = useLanguage();
  const { currentBooking, updateBooking } = useBooking();
  const { showToast } = useFeedback();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(currentBooking.trip || null);
  // This traveler's saved pledge per trip, what they are choosing now, and each trip's pickup points.
  const [pledges, setPledges] = useState({});
  const [drafts, setDrafts] = useState({});
  const [pickupsByTrip, setPickupsByTrip] = useState({});
  const [pendingInterestId, setPendingInterestId] = useState(null);
  const submittingInterest = useRef(false);

  const interestTrips = trips.filter((trip) => trip.status === 'collecting_interest');
  const bookableTrips = trips.filter((trip) => (
    (trip.status === 'upcoming' || trip.status === 'active')
    && Date.parse(trip.departure_date) > Date.now()
  ));
  const tripToBook = bookableTrips.find((trip) => trip.id === selectedTrip?.id);

  useEffect(() => {
    loadTrips();
  }, [currentBooking.destination]);

  const loadTrips = async ({ refresh = false } = {}) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    try {
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
        
        showToast({ type: 'warning', title: 'Destination Required', message: 'Please select a destination first' });
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.getParent()?.navigate('MainTabs', { screen: 'Home' });
        }
        return;
      }

      const data = await getTrips({ destinationId: destination.id, includeInterest: true });
      const interestIds = data.filter((trip) => trip.status === 'collecting_interest').map((trip) => trip.id);
      const [myInterests, pickupLists] = await Promise.all([
        getMyTripInterests(interestIds).catch((error) => {
          console.error('Error loading trip interests:', error);
          return null;
        }),
        Promise.all(interestIds.map((id) => getTripStations(id).catch(() => []))),
      ]);
      if (myInterests) {
        setPledges((previous) => ({ ...previous, ...myInterests }));
      }
      setPickupsByTrip(Object.fromEntries(interestIds.map((id, index) => [
        id,
        pickupLists[index]
          .filter((link) => link.pickup_stations?.is_active !== false)
          .map((link) => ({
            id: link.station_id,
            name: link.pickup_stations?.name || 'Pickup point',
            time: link.pickup_time,
            extraPrice: Number(link.extra_price || 0),
            isAddress: Boolean(link.pickup_stations?.is_address_pickup),
          })),
      ])));
      setTrips(data);
    } catch (error) {
      console.error('Error loading trips:', error);
      showToast({ type: 'error', title: 'Error', message: 'Failed to load available trips. Please try again.' });
    } finally {
      if (refresh) setRefreshing(false);
      else setLoading(false);
    }
  };

  const handleContinue = () => {
    if (tripToBook) {
      updateBooking({ 
        trip: tripToBook,
        provider: tripToBook.providers,
        tripType: tripToBook.trip_type,
        date: tripToBook.departure_date || tripToBook.date,
      });
      navigation.navigate('SelectPickupStation');
    }
  };

  // Matches the database: one pledge becomes one booking, capped at 8 seats.
  const seatLimit = (trip) => Math.max(1, Math.min(8, trip.max_seats || 8));
  const draftFor = (trip) => {
    const saved = pledges[trip.id];
    const pickups = pickupsByTrip[trip.id] || [];
    return {
      seats: saved?.seats ?? 1,
      pickupStationId: saved?.pickupStationId ?? (pickups.length === 1 ? pickups[0].id : null),
      pickupAddress: saved?.pickupAddress ?? '',
      ...drafts[trip.id],
    };
  };
  const updateDraft = (trip, changes) => {
    setDrafts((previous) => ({ ...previous, [trip.id]: { ...draftFor(trip), ...changes } }));
  };
  const changeSeats = (trip, delta) => {
    updateDraft(trip, { seats: Math.min(seatLimit(trip), Math.max(1, draftFor(trip).seats + delta)) });
  };
  const draftProblem = (trip) => {
    const draft = draftFor(trip);
    const pickups = pickupsByTrip[trip.id] || [];
    if (pickups.length === 0) return null;
    const pickup = pickups.find((item) => item.id === draft.pickupStationId);
    if (!pickup) return 'Choose a pickup point';
    if (pickup.isAddress && draft.pickupAddress.trim().length < 5) return 'Enter your pickup address';
    return null;
  };
  const draftUnchanged = (trip) => {
    const saved = pledges[trip.id];
    const draft = draftFor(trip);
    return Boolean(saved)
      && saved.seats === draft.seats
      && saved.pickupStationId === draft.pickupStationId
      && (saved.pickupAddress || '') === draft.pickupAddress.trim();
  };

  const handleExpressInterest = async (trip) => {
    const draft = draftFor(trip);
    if (submittingInterest.current || draftUnchanged(trip) || draftProblem(trip)) return;

    submittingInterest.current = true;
    setPendingInterestId(trip.id);
    try {
      const wasPledged = pledges[trip.id] != null;
      const pickup = (pickupsByTrip[trip.id] || []).find((item) => item.id === draft.pickupStationId);
      const result = await expressTripInterest(trip.id, {
        seats: draft.seats,
        pickupStationId: draft.pickupStationId,
        pickupAddress: pickup?.isAddress ? draft.pickupAddress : null,
      });
      if (result.interested && result.seats != null) {
        const saved = {
          seats: result.seats,
          pickupStationId: result.pickup_station_id ?? null,
          pickupAddress: result.pickup_address ?? '',
          bookingId: result.booking_id ?? null,
        };
        setPledges((previous) => ({ ...previous, [trip.id]: saved }));
        setDrafts((previous) => ({ ...previous, [trip.id]: saved }));
      }
      setTrips((previous) => previous.map((item) => item.id === trip.id
        ? { ...item, status: result.status, interest_count: result.interest_count }
        : item));
      const seatWord = `${result.seats} ${result.seats === 1 ? 'seat' : 'seats'}`;
      if (result.reservation_result === 'reserved') {
        showToast({ type: 'success', title: 'Your seats are reserved', message: `Your pledge reached the group goal. Your ${seatWord} ${result.seats === 1 ? 'is' : 'are'} held for you in My Trips.` });
      } else if ((result.status === 'upcoming' || result.status === 'active')
        && Date.parse(trip.departure_date) > Date.now()) {
        showToast({ type: 'success', title: 'Booking is open', message: 'The group goal was reached. You can now book this trip.' });
      } else if (result.status === 'collecting_interest' && result.interested) {
        showToast({
          type: 'success',
          title: wasPledged ? 'Pledge updated' : 'Seats pledged',
          message: `${seatWord} pledged. When the goal is reached we'll reserve them and message you.`,
        });
      } else {
        showToast({ type: 'warning', title: 'Trip unavailable', message: 'This trip is no longer accepting interest.' });
      }
    } catch (error) {
      console.error('Error expressing trip interest:', error);
      const message = /pickup|address|seats/i.test(error?.message || '') ? error.message : 'Refresh the trips and try again.';
      showToast({ type: 'error', title: 'Pledge not saved', message });
    } finally {
      submittingInterest.current = false;
      setPendingInterestId(null);
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
      { key: 'review', label: 'Review' }
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
      {/* Custom Back Header */}
      <View style={styles.customHeader}>
        <TouchableOpacity
          style={styles.customBackButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.customHeaderTitle}>Select Trip</Text>
        <View style={styles.customHeaderRight} />
      </View>

      {renderStepHeader()}

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
          if (!submittingInterest.current) loadTrips({ refresh: true });
        }} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Select Trip</Text>
          <Text style={styles.subtitle}>
            {currentBooking.destination
              ? `Trips to ${currentBooking.destination?.name || 'this destination'}`
              : 'Choose a trip for your journey'}
          </Text>
        </View>

        {bookableTrips.length === 0 && interestTrips.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={60} color={COLORS.grayLight} />
            <Text style={styles.emptyText}>No trips scheduled</Text>
            <Text style={styles.emptySubtext}>
              {currentBooking.destination
                ? `No trips are currently scheduled to ${currentBooking.destination?.name}. Please check back later.`
                : 'Please check back later or contact support.'}
            </Text>
          </View>
        )}

        {bookableTrips.length > 0 && (
          <View style={styles.tripsList}>
            {bookableTrips.map((trip) => {
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
                          {trip.price ? formatTripPrice(trip.price, trip.currency) : 'Price TBD'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {interestTrips.length > 0 && (
          <View style={styles.interestSection}>
            <Text style={styles.interestSectionTitle}>Planned departures</Text>
            <Text style={styles.subtitle}>
              Reservations open once enough seats are pledged. Pledging is free, and we&apos;ll message you when it happens.
            </Text>
            <View style={styles.tripsList}>
              {interestTrips.map((trip) => {
                const pledged = pledges[trip.id];
                const draft = draftFor(trip);
                const seats = draft.seats;
                const pickups = pickupsByTrip[trip.id] || [];
                const chosenPickup = pickups.find((item) => item.id === draft.pickupStationId);
                const problem = draftProblem(trip);
                const unchanged = draftUnchanged(trip);
                const seatWord = `${seats} ${seats === 1 ? 'seat' : 'seats'}`;
                const goal = trip.minimum_interest || 0;
                const progress = goal ? Math.min(1, (trip.interest_count || 0) / goal) : 0;
                const busy = refreshing || pendingInterestId !== null;
                return (
                  <View key={trip.id} style={[styles.tripCard, styles.interestCard]}>
                    <Text style={styles.providerName}>{trip.providers?.name || 'Travel Provider'}</Text>
                    {trip.summary ? <Text style={styles.subtitle}>{trip.summary}</Text> : null}
                    <Text style={styles.subtitle}>{formatDate(trip.departure_date || trip.date)}</Text>
                    {trip.price != null && (
                      <Text style={styles.subtitle}>{formatTripPrice(trip.price, trip.currency)} per person</Text>
                    )}
                    {goal > 0 && (
                      <View accessible accessibilityLabel={`${trip.interest_count || 0} of ${goal} seats pledged`}>
                        <View style={styles.interestBar}>
                          <View style={[styles.interestBarFill, { width: `${Math.round(progress * 100)}%` }]} />
                        </View>
                        <Text style={styles.interestProgressText}>
                          {trip.interest_count || 0} of {goal} seats pledged
                          {goal > (trip.interest_count || 0) ? ` · ${goal - (trip.interest_count || 0)} to go` : ''}
                        </Text>
                      </View>
                    )}
                    <View style={styles.seatPicker}>
                      <Text style={styles.seatPickerLabel}>Seats</Text>
                      <TouchableOpacity
                        style={[styles.seatButton, seats <= 1 && styles.seatButtonDisabled]}
                        onPress={() => changeSeats(trip, -1)}
                        disabled={busy || seats <= 1}
                        accessibilityRole="button"
                        accessibilityLabel="Fewer seats"
                      >
                        <Ionicons name="remove" size={18} color={COLORS.secondary} />
                      </TouchableOpacity>
                      <Text style={styles.seatCount} accessibilityLiveRegion="polite">{seats}</Text>
                      <TouchableOpacity
                        style={[styles.seatButton, seats >= seatLimit(trip) && styles.seatButtonDisabled]}
                        onPress={() => changeSeats(trip, 1)}
                        disabled={busy || seats >= seatLimit(trip)}
                        accessibilityRole="button"
                        accessibilityLabel="More seats"
                      >
                        <Ionicons name="add" size={18} color={COLORS.secondary} />
                      </TouchableOpacity>
                    </View>
                    {pickups.length > 0 && (
                      <View style={styles.pickupGroup} accessibilityRole="radiogroup" accessibilityLabel="Pickup point">
                        <Text style={styles.seatPickerLabel}>Pickup point</Text>
                        {pickups.map((pickup) => {
                          const selected = pickup.id === draft.pickupStationId;
                          return (
                            <TouchableOpacity
                              key={pickup.id}
                              style={[styles.pickupOption, selected && styles.pickupOptionSelected]}
                              onPress={() => updateDraft(trip, { pickupStationId: pickup.id })}
                              disabled={busy}
                              accessibilityRole="radio"
                              accessibilityState={{ selected }}
                            >
                              <Ionicons
                                name={selected ? 'radio-button-on' : 'radio-button-off'}
                                size={18}
                                color={selected ? COLORS.primary : COLORS.grayLight}
                              />
                              <Text style={styles.pickupOptionText}>
                                {pickup.name}{pickup.time ? ` · ${pickup.time}` : ''}
                                {pickup.extraPrice > 0 ? ` · +${formatTripPrice(pickup.extraPrice, trip.currency)}` : ''}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                        {chosenPickup?.isAddress && (
                          <TextInput
                            style={styles.pickupAddressInput}
                            value={draft.pickupAddress}
                            onChangeText={(text) => updateDraft(trip, { pickupAddress: text })}
                            placeholder="Your pickup address, e.g. Bole, near Edna Mall"
                            placeholderTextColor={COLORS.grayLight}
                            maxLength={240}
                            editable={!busy}
                            accessibilityLabel="Pickup address"
                          />
                        )}
                      </View>
                    )}
                    <Text style={styles.pledgeHint}>
                      {pledged?.bookingId
                        ? 'Your seats are reserved. See My Trips.'
                        : 'When the goal is reached, we reserve your seats automatically. You pay only once the trip is confirmed.'}
                    </Text>
                    <ModernButton
                      title={problem && !unchanged
                        ? problem
                        : pledged == null
                          ? `Pledge ${seatWord}`
                          : unchanged
                            ? `${pledged.seats} ${pledged.seats === 1 ? 'seat' : 'seats'} pledged`
                            : 'Update pledge'}
                      onPress={() => handleExpressInterest(trip)}
                      disabled={busy || unchanged || Boolean(problem)}
                      loading={pendingInterestId === trip.id}
                      icon="hand-left-outline"
                      variant="outline"
                      size="medium"
                    />
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {bookableTrips.length > 0 && (
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.iconSecondary} />
            <Text style={styles.infoText}>
              Tankua platform charges a 5% service fee included in the final price summary.
            </Text>
          </View>
        )}
      </ScrollView>

      {bookableTrips.length > 0 && (
        <View style={styles.footer}>
          <ModernButton
            title={t('continue') || 'Continue'}
            onPress={handleContinue}
            disabled={!tripToBook}
            variant="primary"
            size="large"
            icon="arrow-forward"
            iconPosition="right"
            style={styles.button}
          />
        </View>
      )}
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
  interestSection: {
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  interestSectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  interestCard: {
    gap: SPACING.sm,
  },
  interestBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.borderLight,
    overflow: 'hidden',
  },
  interestBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  interestProgressText: {
    marginTop: 4,
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  seatPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  seatPickerLabel: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  seatButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  seatButtonDisabled: {
    opacity: 0.35,
  },
  pickupGroup: {
    gap: SPACING.xs,
  },
  pickupOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    minHeight: 44,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.white,
  },
  pickupOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.cardBackground,
  },
  pickupOptionText: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
    color: COLORS.secondary,
  },
  pickupAddressInput: {
    minHeight: 44,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.white,
    fontSize: FONTS.sizes.sm,
    color: COLORS.secondary,
  },
  pledgeHint: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.iconSecondary,
    lineHeight: 18,
  },
  seatCount: {
    minWidth: 28,
    textAlign: 'center',
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.secondary,
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

export default SelectTripScreen;
