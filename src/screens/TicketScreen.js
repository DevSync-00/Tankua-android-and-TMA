import React from 'react';
import { View, Text, StyleSheet, ScrollView, Share, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import Animated, {
  useAnimatedStyle,
} from 'react-native-reanimated';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS, ANIMATIONS } from '../config/theme';
import { useLanguage } from '../contexts/LanguageContext';
import ModernButton from '../components/ModernButton';
import AnimatedCard from '../components/AnimatedCard';

const { width } = Dimensions.get('window');

const TicketScreen = ({ route }) => {
  const { booking } = route.params || {};
  const { t } = useLanguage();

  const qrAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: 1 },
      { rotate: '0deg' },
    ],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 1,
  }));

  const churchName = booking?.church_name || booking?.churchName || 'Unknown Church';
  const qrCode = booking?.qr_code || booking?.qrCode || 'N/A';
  const date = booking?.date || '';
  const pickupStation = booking?.pickup_station || booking?.pickupStation || {};
  const stationName = pickupStation?.name || pickupStation?.stationName || 'Pickup Station';
  const pickupTime = pickupStation?.pickupTime || pickupStation?.pickup_time || 'TBD';
  const seats = booking?.seats || 1;
  const totalPrice = booking?.total_price || booking?.totalPrice || 0;
  const status = booking?.status || 'confirmed';

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Tankua Trip Ticket\nBooking ID: ${qrCode}\nChurch: ${churchName}\nDate: ${date}\nPickup: ${stationName} at ${pickupTime}`,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'confirmed':
        return COLORS.success;
      case 'cancelled':
        return COLORS.error;
      default:
        return COLORS.warning;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Ticket Card */}
        <AnimatedCard variant="glass" style={styles.ticket}>
          {/* Header */}
          <View style={[styles.ticketHeader, { backgroundColor: COLORS.secondary }]}>
            <View style={styles.headerLeft}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoEmoji}>⛪</Text>
              </View>
              <Text style={styles.appName}>Tankua</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
              <Text style={styles.statusText}>{status.toUpperCase()}</Text>
            </View>
          </View>

          {/* QR Code Section */}
          <Animated.View style={[styles.qrSection, qrAnimatedStyle]}>
            <View style={styles.qrContainer}>
            <QRCode
              value={qrCode}
                size={220}
              backgroundColor={COLORS.white}
              color={COLORS.secondary}
            />
            </View>
            <Text style={styles.bookingId}>{qrCode}</Text>
            <Text style={styles.bookingIdLabel}>Booking ID</Text>
          </Animated.View>

          {/* Trip Details */}
          <Animated.View style={[styles.detailsSection, contentAnimatedStyle]}>
            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Ionicons name="location" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Destination</Text>
              <Text style={styles.detailValue}>{churchName}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {date && (
              <>
                <View style={styles.detailItem}>
                  <View style={styles.detailIcon}>
                    <Ionicons name="calendar" size={20} color={COLORS.primary} />
                  </View>
                  <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Trip Date</Text>
                  <Text style={styles.detailValue}>{date}</Text>
                  </View>
                </View>
                <View style={styles.divider} />
              </>
            )}

            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Ionicons name="location" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Pickup Station</Text>
              <Text style={styles.detailValue}>{stationName}</Text>
              </View>
            </View>

            {pickupTime && (
              <>
                <View style={styles.divider} />
                <View style={styles.detailItem}>
                  <View style={styles.detailIcon}>
                    <Ionicons name="time" size={20} color={COLORS.primary} />
                  </View>
                  <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Pickup Time</Text>
                  <Text style={styles.detailValue}>{pickupTime}</Text>
                  </View>
                </View>
              </>
            )}

            <View style={styles.divider} />

            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Ionicons name="people" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Seats</Text>
              <Text style={styles.detailValue}>{seats}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Ionicons name="card" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Total Paid</Text>
              <Text style={[styles.detailValue, styles.priceValue]}>
                {totalPrice} ETB
              </Text>
            </View>
          </View>
          </Animated.View>

          {/* Instructions */}
          <Animated.View style={[styles.instructions, contentAnimatedStyle]}>
            <View style={styles.instructionsHeader}>
              <Ionicons name="information-circle" size={24} color={COLORS.primary} />
              <Text style={styles.instructionsTitle}>Important Instructions</Text>
            </View>
            <View style={styles.instructionsList}>
              <View style={styles.instructionItem}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                <Text style={styles.instructionText}>Arrive 15 minutes before pickup time</Text>
              </View>
              <View style={styles.instructionItem}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                <Text style={styles.instructionText}>Show this QR code to your driver</Text>
              </View>
              <View style={styles.instructionItem}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                <Text style={styles.instructionText}>Keep your phone charged</Text>
              </View>
              <View style={styles.instructionItem}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                <Text style={styles.instructionText}>Bring valid identification</Text>
          </View>
        </View>
          </Animated.View>
        </AnimatedCard>
      </ScrollView>

      <View style={styles.footer}>
        <ModernButton
          title="Share Ticket"
          onPress={handleShare}
          variant="outline"
          size="large"
          style={styles.button}
          icon="share-outline"
          iconPosition="left"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl + SPACING.xxl,
  },
  ticket: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  ticketHeader: {
    padding: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  logoEmoji: {
    fontSize: 24,
  },
  appName: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  statusText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 1,
  },
  qrSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    backgroundColor: COLORS.white,
  },
  qrContainer: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.medium,
  },
  bookingId: {
    marginTop: SPACING.lg,
    fontSize: FONTS.sizes.lg,
    fontWeight: '800',
    color: COLORS.secondary,
    letterSpacing: 3,
    fontFamily: 'monospace',
  },
  bookingIdLabel: {
    marginTop: SPACING.xs,
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    fontWeight: '600',
  },
  detailsSection: {
    padding: SPACING.lg,
    backgroundColor: COLORS.backgroundSecondary,
  },
  detailItem: {
    flexDirection: 'row',
    paddingVertical: SPACING.md,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    marginBottom: SPACING.xs,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.secondary,
    letterSpacing: -0.3,
  },
  priceValue: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xl,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.sm,
  },
  instructions: {
    backgroundColor: `${COLORS.primary}08`,
    padding: SPACING.lg,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  instructionsTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  instructionsList: {
    gap: SPACING.sm,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  instructionText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.secondary,
    fontWeight: '500',
    flex: 1,
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

export default TicketScreen;
