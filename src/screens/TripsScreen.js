import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { useBooking } from '../contexts/BookingContext';
import { useAuth } from '../contexts/AuthContext';
import Loader from '../components/Loader';
import ModernButton from '../components/ModernButton';

const TripsScreen = ({ navigation }) => {
  const { getUserBookings } = useBooking();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Calculate bottom padding to account for tab bar (70px height + bottom inset + padding)
  const tabBarHeight = 70;
  const tabBarBottomPadding = Math.max(insets.bottom, SPACING.md);
  const tabBarTopPadding = SPACING.sm;
  const totalTabBarSpace = tabBarHeight + tabBarBottomPadding + tabBarTopPadding + SPACING.md;

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const userBookings = await getUserBookings(user.id);
      setBookings(userBookings || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    const today = new Date().toISOString().split('T')[0];
    return bookings.filter(booking => {
      if (activeTab === 'upcoming') {
        return booking.date >= today;
      } else {
        return booking.date < today;
      }
    });
  };

  const handleViewTicket = (booking) => {
    navigation.navigate('Ticket', { booking });
  };

  const handleRateTrip = (booking) => {
    // Check if review already exists
    navigation.navigate('Review', { booking });
  };

  const renderTab = (tab, label, isLast = false) => {
    const isActive = activeTab === tab;
    return (
      <TouchableOpacity
        style={[styles.tab, isActive && styles.tabActive, isLast && styles.tabLast]}
        onPress={() => setActiveTab(tab)}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderBookingCard = ({ item, index }) => {
    // Use destination_name (new schema) or fall back to church_name (old schema) for backward compatibility
    const destinationName = item.destination_name || item.church_name || item.churchName || 'Unknown Destination';
    const status = item.status || 'confirmed';
    const pickupStation = item.pickup_station || item.pickupStation || {};
    const stationName = pickupStation.name || pickupStation.stationName || 'Pickup Station';
    const pickupTime = pickupStation.pickupTime || pickupStation.pickup_time || 'TBD';
    const seats = item.seats || 1;
    const totalPrice = item.total_price || item.totalPrice || 0;
    const date = item.date || '';

    const getStatusColor = () => {
      switch (status) {
        case 'confirmed':
          return COLORS.success;
        case 'cancelled':
          return COLORS.error;
        case 'completed':
          return COLORS.gray;
        default:
          return COLORS.warning;
      }
    };

    return (
      <TouchableOpacity
        style={styles.bookingCard}
        onPress={() => handleViewTicket(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardLeft}>
            <View style={styles.iconCircle}>
              <Ionicons name="bus" size={26} color={COLORS.iconPrimary} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.churchName} numberOfLines={1}>
                {destinationName}
              </Text>
              <Text style={styles.dateText}>{date}</Text>
            </View>
          </View>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardBody}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
              <Ionicons name="location-outline" size={16} color={COLORS.gray} />
            <Text style={[styles.detailText, { marginLeft: SPACING.xs }]} numberOfLines={1}>
                {stationName}
              </Text>
            </View>
          <View style={[styles.detailItem, styles.detailItemLast]}>
              <Ionicons name="time-outline" size={16} color={COLORS.gray} />
            <Text style={[styles.detailText, { marginLeft: SPACING.xs }]}>{pickupTime}</Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Total:</Text>
            <Text style={[styles.priceValue, { marginLeft: SPACING.xs }]}>{totalPrice} ETB</Text>
            </View>
            {status === 'completed' ? (
              <TouchableOpacity 
                style={[styles.ticketButton, styles.rateButton]}
                onPress={() => handleRateTrip(item)}
                activeOpacity={0.7}
              >
                <Ionicons name="star-outline" size={20} color={COLORS.primary} />
                <Text style={[styles.ticketButtonText, { marginLeft: SPACING.xs, color: COLORS.primary }]}>Rate Trip</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.ticketButton}
                onPress={() => handleViewTicket(item)}
                activeOpacity={0.7}
              >
                <Ionicons name="qr-code-outline" size={20} color={COLORS.iconPrimary} />
                <Text style={[styles.ticketButtonText, { marginLeft: SPACING.xs }]}>View Ticket</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIllustration}>
        <View style={styles.emptyCircle1}>
          <View style={styles.emptyCircle2}>
            <View style={styles.emptyCircle3}>
              <Ionicons name="bus-outline" size={72} color={COLORS.primary} />
            </View>
          </View>
        </View>
      </View>
      <Text style={styles.emptyTitle}>
        {activeTab === 'upcoming' 
          ? 'No Upcoming Trips'
          : activeTab === 'completed'
          ? 'No Completed Trips'
          : 'No Cancelled Trips'
        }
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'upcoming' 
          ? 'When you book a trip, it will appear here.'
          : activeTab === 'completed'
          ? 'Your completed trips will show up here.'
          : 'Your cancelled trips will show up here.'
        }
      </Text>

    </View>
  );

  if (loading) {
    return <Loader />;
  }

  const filteredBookings = filterBookings();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Fixed Header Section */}
      <View style={styles.headerSection}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>My Trips</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {renderTab('upcoming', 'Upcoming')}
          {renderTab('completed', 'Completed')}
          {renderTab('cancelled', 'Cancelled', true)}
        </View>
      </View>

      {/* Content */}
      {filteredBookings.length === 0 ? (
        <View style={[styles.emptyStateContainer, { paddingBottom: totalTabBarSpace }]}>
          {renderEmptyState()}
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          renderItem={renderBookingCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: totalTabBarSpace }]}
          showsVerticalScrollIndicator={false}
          style={styles.list}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  headerSection: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  title: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: FONTS.weights.black,
    color: COLORS.secondary,
    letterSpacing: -1,
    marginBottom: SPACING.xs,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  list: {
    flex: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md + 2,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.small,
  },
  tabLast: {
    marginRight: 0,
  },
  tabText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    color: COLORS.gray,
  },
  tabTextActive: {
    color: COLORS.white,
    fontWeight: FONTS.weights.black,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  emptyStateContainer: {
    flex: 1,
  },
  bookingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...SHADOWS.medium,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginHorizontal: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: `${COLORS.iconPrimary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  cardInfo: {
    flex: 1,
  },
  churchName: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.black,
    color: COLORS.secondary,
    marginBottom: SPACING.xs / 2,
    letterSpacing: -0.3,
  },
  dateText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    fontWeight: FONTS.weights.semibold,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: BORDER_RADIUS.full,
  },
  cardDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginHorizontal: SPACING.lg,
    marginVertical: 0,
  },
  cardBody: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  detailItemLast: {
    marginRight: 0,
  },
  detailText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray,
    fontWeight: FONTS.weights.medium,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray,
    fontWeight: FONTS.weights.medium,
  },
  priceValue: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.black,
    color: COLORS.secondary,
    letterSpacing: -0.5,
  },
  ticketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: `${COLORS.iconPrimary}15`,
  },
  ticketButtonText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.black,
    color: COLORS.iconPrimary,
  },
  rateButton: {
    backgroundColor: `${COLORS.primary}15`,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyIllustration: {
    marginBottom: SPACING.xl,
  },
  emptyCircle1: {
    width: 220,
    height: 220,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: `${COLORS.primary}08`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCircle2: {
    width: 160,
    height: 160,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCircle3: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: `${COLORS.primary}25`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.black,
    color: COLORS.secondary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    letterSpacing: -0.8,
  },
  emptySubtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
    lineHeight: 24,
    paddingHorizontal: SPACING.lg,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignSelf: 'center',
    ...SHADOWS.small,
  },
  searchButtonText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.secondary,
    fontWeight: FONTS.weights.medium,
    marginLeft: SPACING.xs,
  },
});

export default TripsScreen;
