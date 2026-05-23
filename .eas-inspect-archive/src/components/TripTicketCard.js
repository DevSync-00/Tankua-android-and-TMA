import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { getBookingDisplay } from '../utils/bookingDisplay';

const TripTicketCard = forwardRef(({ booking, showInstructions = false, style }, ref) => {
  const { width } = useWindowDimensions();
  const display = getBookingDisplay(booking);
  const qrSize = Math.min(Math.round(width - 112), 188);

  const statusColor =
    display.status === 'confirmed'
      ? COLORS.success
      : display.status === 'cancelled'
        ? COLORS.error
        : COLORS.warning;

  return (
    <View ref={ref} collapsable={false} style={[styles.card, style]}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.logoMark}>
            <Text style={styles.logoText}>T</Text>
          </View>
          <View>
            <Text style={styles.brandName}>Tankua</Text>
            <Text style={styles.brandSub}>Trip ticket</Text>
          </View>
        </View>
        <View style={[styles.statusPill, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{display.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.perforation}>
        {Array.from({ length: 18 }).map((_, index) => (
          <View key={`perf-${index}`} style={styles.perfDot} />
        ))}
      </View>

      <View style={styles.qrBlock}>
        <View style={styles.qrFrame}>
          <QRCode
            value={display.qrCode}
            size={qrSize}
            backgroundColor={COLORS.white}
            color={COLORS.secondary}
          />
        </View>
        <Text style={styles.qrCode}>{display.qrCode}</Text>
        <Text style={styles.qrHint}>Show this code at pickup</Text>
      </View>

      <View style={styles.details}>
        <DetailRow icon="location" label="Destination" value={display.destinationName} />
        {display.date ? (
          <DetailRow icon="calendar-outline" label="Date" value={display.date} />
        ) : null}
        <DetailRow icon="navigate-outline" label="Pickup" value={display.stationName} />
        {display.pickupTime ? (
          <DetailRow icon="time-outline" label="Pickup time" value={display.pickupTime} />
        ) : null}
        <DetailRow icon="people-outline" label="Seats" value={String(display.seats)} />

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total paid</Text>
          <Text style={styles.totalValue}>{display.totalPrice} ETB</Text>
        </View>
      </View>

      {showInstructions ? (
        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>Before you travel</Text>
          <Text style={styles.instructionLine}>• Arrive 15 minutes early</Text>
          <Text style={styles.instructionLine}>• Keep your phone charged</Text>
          <Text style={styles.instructionLine}>• Bring valid ID</Text>
        </View>
      ) : null}
    </View>
  );
});

const DetailRow = ({ icon, label, value }) => (
  <View style={styles.detailRow}>
    <View style={styles.detailIconWrap}>
      <Ionicons name={icon} size={16} color={COLORS.primary} />
    </View>
    <View style={styles.detailTextWrap}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.large,
  },
  header: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoMark: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  brandName: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.3,
  },
  brandSub: {
    fontSize: FONTS.sizes.xs,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.8,
  },
  perforation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.backgroundSecondary,
    height: 14,
  },
  perfDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  qrBlock: {
    alignItems: 'center',
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
  },
  qrFrame: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.small,
  },
  qrCode: {
    marginTop: SPACING.md,
    fontSize: FONTS.sizes.md,
    fontWeight: '800',
    color: COLORS.secondary,
    letterSpacing: 2,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  qrHint: {
    marginTop: SPACING.xs,
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    fontWeight: '500',
  },
  details: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    backgroundColor: COLORS.backgroundSecondary,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  detailIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${COLORS.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  detailTextWrap: {
    flex: 1,
  },
  detailLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray,
    fontWeight: '600',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: FONTS.sizes.md,
    color: COLORS.secondary,
    fontWeight: '700',
  },
  totalRow: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  totalValue: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '800',
    color: COLORS.primary,
  },
  instructions: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    backgroundColor: `${COLORS.primary}10`,
  },
  instructionsTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '800',
    color: COLORS.secondary,
    marginBottom: SPACING.xs,
  },
  instructionLine: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.secondary,
    lineHeight: 20,
  },
});

TripTicketCard.displayName = 'TripTicketCard';

export default TripTicketCard;
