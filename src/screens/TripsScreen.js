import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { useBooking } from '../contexts/BookingContext';
import { useAuth } from '../contexts/AuthContext';
import Loader from '../components/Loader';

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'upcoming',  label: 'Upcoming',  icon: 'time-outline' },
  { key: 'completed', label: 'Completed', icon: 'checkmark-circle-outline' },
  { key: 'cancelled', label: 'Cancelled', icon: 'close-circle-outline' },
];

const STATUS_CONFIG = {
  confirmed:  { color: COLORS.success,  bg: `${COLORS.success}15`,  label: 'Confirmed',  icon: 'checkmark-circle' },
  completed:  { color: COLORS.gray,     bg: `${COLORS.gray}15`,     label: 'Completed',  icon: 'checkmark-done-circle' },
  cancelled:  { color: COLORS.error,    bg: `${COLORS.error}15`,    label: 'Cancelled',  icon: 'close-circle' },
  pending:    { color: COLORS.warning,  bg: `${COLORS.warning}15`,  label: 'Pending',    icon: 'hourglass-outline' },
};

const getStatusConfig = (status) =>
  STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;

// ─── Booking Card ─────────────────────────────────────────────────────────────

const BookingCard = ({ item, onViewTicket }) => {
  const destinationName =
    item.destination_name || item.church_name || item.churchName || 'Unknown Destination';
  const status        = item.status || 'confirmed';
  const pickupStation = item.pickup_station || item.pickupStation || {};
  const stationName   = pickupStation.name || pickupStation.stationName || 'Pickup Station';
  const pickupTime    = pickupStation.pickupTime || pickupStation.pickup_time || 'TBD';
  const seats         = item.seats || 1;
  const totalPrice    = item.total_price || item.totalPrice || 0;
  const date          = item.date || '';
  const sc            = getStatusConfig(status);

  const formattedDate = date
    ? new Date(date).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
      })
    : '';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onViewTicket(item)}
      activeOpacity={0.75}
    >
      {/* ── Card top: destination + status badge ── */}
      <View style={styles.cardTop}>
        <View style={styles.busIconWrap}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.busIconGrad}
          >
            <Ionicons name="bus" size={22} color={COLORS.white} />
          </LinearGradient>
        </View>

        <View style={styles.cardTopText}>
          <Text style={styles.destName} numberOfLines={1}>{destinationName}</Text>
          <Text style={styles.dateText}>{formattedDate}</Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
          <Ionicons name={sc.icon} size={12} color={sc.color} />
          <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
        </View>
      </View>

      {/* ── Divider ── */}
      <View style={styles.cardDivider} />

      {/* ── Card details grid ── */}
      <View style={styles.detailGrid}>
        <View style={styles.detailCell}>
          <Ionicons name="location-outline" size={15} color={COLORS.primary} />
          <View style={styles.detailCellText}>
            <Text style={styles.detailLabel}>Pickup</Text>
            <Text style={styles.detailValue} numberOfLines={1}>{stationName}</Text>
          </View>
        </View>

        <View style={styles.detailDividerV} />

        <View style={styles.detailCell}>
          <Ionicons name="time-outline" size={15} color={COLORS.primary} />
          <View style={styles.detailCellText}>
            <Text style={styles.detailLabel}>Time</Text>
            <Text style={styles.detailValue}>{pickupTime}</Text>
          </View>
        </View>

        <View style={styles.detailDividerV} />

        <View style={styles.detailCell}>
          <Ionicons name="people-outline" size={15} color={COLORS.primary} />
          <View style={styles.detailCellText}>
            <Text style={styles.detailLabel}>Seats</Text>
            <Text style={styles.detailValue}>{seats}</Text>
          </View>
        </View>
      </View>

      {/* ── Footer: price + ticket CTA ── */}
      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.priceLabel}>Total</Text>
          <Text style={styles.priceValue}>{totalPrice.toLocaleString()} ETB</Text>
        </View>

        <TouchableOpacity
          style={styles.ticketBtn}
          onPress={() => onViewTicket(item)}
          activeOpacity={0.8}
        >
          <Ionicons name="qr-code-outline" size={16} color={COLORS.white} />
          <Text style={styles.ticketBtnText}>View Ticket</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState = ({ tab, onExplore }) => {
  const config = {
    upcoming:  { icon: 'calendar',             title: 'No Upcoming Trips',  sub: 'Your next adventure is waiting. Book a trip and it will show up here.' },
    completed: { icon: 'checkmark-done-circle', title: 'No Completed Trips', sub: 'All your past memories and finished journeys will appear here.' },
    cancelled: { icon: 'close-circle',         title: 'No Cancelled Trips', sub: "You don't have any cancelled bookings. Safe travels!" },
  };
  const { icon, title, sub } = config[tab] ?? config.upcoming;

  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyCard}>
        <View style={styles.emptyIconContainer}>
          <LinearGradient
            colors={[`${COLORS.primary}15`, `${COLORS.primary}30`]}
            style={styles.emptyIconGrad}
          >
            <Ionicons name={icon} size={44} color={COLORS.primary} />
          </LinearGradient>
        </View>
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptySub}>{sub}</Text>
        <TouchableOpacity style={styles.exploreBtn} onPress={onExplore} activeOpacity={0.85}>
          <Ionicons name="compass" size={18} color={COLORS.white} />
          <Text style={styles.exploreBtnText}>Explore Destinations</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

const TripsScreen = ({ navigation }) => {
  const { getUserBookings } = useBooking();
  const { user } = useAuth();

  const [activeTab, setActiveTab]   = useState('upcoming');
  const [bookings, setBookings]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { load(); }, [user]);

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      const data = await getUserBookings(user.id);
      setBookings(data || []);
    } catch (e) {
      console.error('Error loading bookings:', e);
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, getUserBookings]);

  const onRefresh = () => { setRefreshing(true); load(); };

  // Filter by both status field AND date comparison so all three tabs work correctly
  const filtered = bookings.filter((b) => {
    const today  = new Date().toISOString().split('T')[0];
    const status = b.status || 'confirmed';
    if (activeTab === 'cancelled') return status === 'cancelled';
    if (activeTab === 'completed') return status === 'completed' || (status !== 'cancelled' && b.date < today);
    // upcoming: confirmed/pending and date >= today
    return status !== 'cancelled' && status !== 'completed' && (!b.date || b.date >= today);
  });

  // Count badges per tab
  const counts = {
    upcoming:  bookings.filter((b) => {
      const s = b.status || 'confirmed';
      return s !== 'cancelled' && s !== 'completed' && (!b.date || b.date >= new Date().toISOString().split('T')[0]);
    }).length,
    completed: bookings.filter((b) => {
      const s = b.status || 'confirmed';
      const today = new Date().toISOString().split('T')[0];
      return s === 'completed' || (s !== 'cancelled' && b.date < today);
    }).length,
    cancelled: bookings.filter((b) => (b.status || '') === 'cancelled').length,
  };

  if (loading) return <Loader />;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>My Trips</Text>
        <Text style={styles.pageSubtitle}>
          {bookings.length > 0
            ? `${bookings.length} booking${bookings.length !== 1 ? 's' : ''} total`
            : null}
        </Text>
      </View>

      {/* ── Tabs ── */}
      <View style={styles.tabRow}>
        {TABS.map(({ key, label }) => {
          const isActive = activeTab === key;
          const count    = counts[key];
          return (
            <TouchableOpacity
              key={key}
              style={[styles.tabBtn, isActive && styles.tabBtnActive]}
              onPress={() => setActiveTab(key)}
              activeOpacity={0.75}
            >
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {label}
              </Text>
              {count > 0 && (
                <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Content ── */}
      {filtered.length === 0 ? (
        <EmptyState tab={activeTab} onExplore={() => navigation.navigate('Home')} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <BookingCard item={item} onViewTicket={(b) => navigation.navigate('Ticket', { booking: b })} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },

  // Header
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.white,
  },
  pageTitle: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: FONTS.weights.black,
    color: COLORS.primary,
    letterSpacing: -0.8,
  },
  pageSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.grayLight,
    fontWeight: FONTS.weights.medium,
    marginTop: 2,
  },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.backgroundSecondary,
    gap: 5,
  },
  tabBtnActive: {
    backgroundColor: COLORS.secondary,
    ...SHADOWS.small,
  },
  tabLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    color: COLORS.gray,
  },
  tabLabelActive: {
    color: COLORS.white,
  },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeActive: {
    backgroundColor: COLORS.primary,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: FONTS.weights.bold,
    color: COLORS.gray,
  },
  tabBadgeTextActive: {
    color: COLORS.secondary,
  },

  // List
  listContent: {
    padding: SPACING.md,
    paddingBottom: 120,
  },

  // Card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.medium,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  busIconWrap: {
    flexShrink: 0,
  },
  busIconGrad: {
    width: 46,
    height: 46,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTopText: {
    flex: 1,
  },
  destName: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.black,
    color: COLORS.secondary,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  dateText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    fontWeight: FONTS.weights.medium,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    flexShrink: 0,
  },
  statusText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.bold,
  },
  cardDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginHorizontal: SPACING.md,
  },

  // Detail grid
  detailGrid: {
    flexDirection: 'row',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  detailCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  detailDividerV: {
    width: 1,
    backgroundColor: COLORS.borderLight,
    marginHorizontal: SPACING.sm,
    alignSelf: 'stretch',
  },
  detailCellText: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.grayLight,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    color: COLORS.secondary,
  },

  // Card footer
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  priceLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.grayLight,
    fontWeight: FONTS.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 1,
  },
  priceValue: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.black,
    color: COLORS.secondary,
    letterSpacing: -0.5,
  },
  ticketBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
  },
  ticketBtnText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
  },

  // Empty state card
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100, // Shrafts the container's center higher up the screen
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.medium,
  },
  emptyIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  emptyIconGrad: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.black,
    color: COLORS.secondary,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: SPACING.sm,
  },
  emptySub: {
    fontSize: FONTS.sizes.md,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.sm,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md - 2,
    borderRadius: BORDER_RADIUS.full,
    ...SHADOWS.medium,
  },
  exploreBtnText: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
  },
});

export default TripsScreen;
