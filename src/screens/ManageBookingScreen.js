import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { useFeedback } from '../contexts/FeedbackContext';
import {
  applyBookingChange,
  getBookingChangeQuote,
  getPickupOptions,
  getRescheduleOptions,
} from '../services/bookingManagement';
import { formatTripPrice } from '../utils/tripCurrency';
import { startChangePayment, verifyChapaPayment } from '../services/payment';
import ModernButton from '../components/ModernButton';
import PaymentWebView from '../components/PaymentWebView';

const TABS = [
  { key: 'pickup', label: 'Pickup' },
  { key: 'seats', label: 'Seats' },
  { key: 'reschedule', label: 'Departure' },
];

const departureLabel = (date) => new Date(date).toLocaleString('en-GB', {
  timeZone: 'Africa/Addis_Ababa', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
});

function PickupList({ options, selectedId, onSelect, address, onAddress, currency, disabled }) {
  const selected = options.find((option) => option.id === selectedId);
  return (
    <View style={styles.group} accessibilityRole="radiogroup">
      {options.map((option) => {
        const isSelected = option.id === selectedId;
        return (
          <TouchableOpacity
            key={option.id}
            style={[styles.option, isSelected && styles.optionSelected]}
            onPress={() => onSelect(option.id)}
            disabled={disabled}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
          >
            <Ionicons name={isSelected ? 'radio-button-on' : 'radio-button-off'} size={18}
              color={isSelected ? COLORS.primary : COLORS.grayLight} />
            <Text style={styles.optionText}>
              {option.name}{option.time ? ` · ${option.time}` : ''}
              {option.extraPrice > 0 ? ` · +${formatTripPrice(option.extraPrice, currency)}` : ''}
            </Text>
          </TouchableOpacity>
        );
      })}
      {selected?.isAddress ? (
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={onAddress}
          placeholder="Your pickup address, e.g. Bole, near Edna Mall"
          placeholderTextColor={COLORS.grayLight}
          maxLength={240}
          editable={!disabled}
          accessibilityLabel="Pickup address"
        />
      ) : null}
    </View>
  );
}

const ManageBookingScreen = ({ navigation, route }) => {
  const { booking } = route.params || {};
  const { showToast, confirm, alert: customAlert } = useFeedback();
  const currentStationId = booking?.pickup_station?.id ?? null;
  const currency = booking?.currency || 'ETB';
  const paid = booking?.payment_status === 'paid';

  const [tab, setTab] = useState('pickup');
  const [pickups, setPickups] = useState([]);
  const [departures, setDepartures] = useState([]);
  const [newTripPickups, setNewTripPickups] = useState([]);
  const [stationId, setStationId] = useState(currentStationId);
  const [address, setAddress] = useState(booking?.pickup_station?.pickup_address || '');
  const [seats, setSeats] = useState(booking?.seats || 1);
  const [tripId, setTripId] = useState(null);
  const [newStationId, setNewStationId] = useState(null);
  const [newAddress, setNewAddress] = useState('');
  const [quote, setQuote] = useState(null);
  const [quoting, setQuoting] = useState(false);
  const [applying, setApplying] = useState(false);
  const [checkout, setCheckout] = useState(null); // { url, transactionRef, amount }
  const quoteRequest = useRef(0);

  useEffect(() => {
    if (!booking) return;
    getPickupOptions(booking.trip_id).then(setPickups).catch(() => setPickups([]));
    getRescheduleOptions(booking).then(setDepartures).catch(() => setDepartures([]));
  }, [booking?.id]);

  // When a new departure is picked, load its pickup points and keep the current one if offered.
  useEffect(() => {
    if (!tripId) { setNewTripPickups([]); return; }
    getPickupOptions(tripId).then((options) => {
      setNewTripPickups(options);
      setNewStationId(options.some((option) => option.id === currentStationId) ? currentStationId
        : options.length === 1 ? options[0].id : null);
      setNewAddress(booking?.pickup_station?.pickup_address || '');
    }).catch(() => setNewTripPickups([]));
  }, [tripId]);

  const change = useMemo(() => {
    if (tab === 'pickup') {
      if (!stationId || (stationId === currentStationId && (address || '') === (booking?.pickup_station?.pickup_address || ''))) return null;
      return { action: 'pickup', stationId, pickupAddress: address };
    }
    if (tab === 'seats') {
      return seats === booking?.seats ? null : { action: 'seats', seats };
    }
    if (!tripId) return null;
    return { action: 'reschedule', tripId, stationId: newStationId, pickupAddress: newAddress };
  }, [tab, stationId, address, seats, tripId, newStationId, newAddress]);

  // Live quote from the server for the change being drafted.
  useEffect(() => {
    if (!change) { setQuote(null); return undefined; }
    const request = ++quoteRequest.current;
    setQuoting(true);
    const timer = setTimeout(() => {
      getBookingChangeQuote(booking, change)
        .then((result) => { if (request === quoteRequest.current) setQuote(result); })
        .catch((error) => {
          if (request === quoteRequest.current) setQuote({ allowed: false, reason: error?.message || 'Could not check this change.' });
        })
        .finally(() => { if (request === quoteRequest.current) setQuoting(false); });
    }, 300);
    return () => clearTimeout(timer);
  }, [change]);

  if (!booking) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.empty}>Booking not found</Text>
      </SafeAreaView>
    );
  }

  const busy = applying || Boolean(checkout);
  const topUp = Number(quote?.top_up_amount || 0);

  // Pay only the difference; the server applies the change after Chapa confirms.
  const payTopUp = async () => {
    if (!quote?.needs_top_up || !change || busy) return;
    const ok = await confirm({
      title: `Pay ${formatTripPrice(topUp, currency)}?`,
      message: `Your new total is ${formatTripPrice(quote.new_total, currency)}. The change is made as soon as your payment is confirmed. If it can no longer be made, you get the money back.`,
      confirmText: 'Continue to payment',
      cancelText: 'Go back',
      variant: 'info',
    });
    if (!ok) return;
    setApplying(true);
    try {
      const started = await startChangePayment(booking.id, change);
      setCheckout({ url: started.checkoutUrl, transactionRef: started.transactionRef, amount: started.amount });
    } catch (error) {
      showToast({ type: 'error', title: 'Could not start payment', message: error?.message || 'Please try again.' });
    } finally {
      setApplying(false);
    }
  };

  const finishTopUp = async (transactionRef) => {
    setCheckout(null);
    if (!transactionRef) return;
    setApplying(true);
    try {
      const outcome = await verifyChapaPayment(transactionRef);
      if (!outcome.paid) {
        const again = await confirm({
          title: 'Payment still processing',
          message: "We haven't received confirmation from Chapa yet. Your booking changes once it arrives.",
          confirmText: 'Check again',
          cancelText: 'Later',
          variant: 'info',
        });
        if (again) finishTopUp(transactionRef);
        return;
      }
      await customAlert({
        title: outcome.applied ? 'Booking updated' : "We couldn't make that change",
        message: outcome.applied
          ? 'Your payment went through and your booking has been updated.'
          : `${outcome.reason || 'The change is no longer possible.'} Your booking is unchanged and your payment will be refunded.`,
        variant: outcome.applied ? 'info' : 'warning',
      });
      navigation.navigate('MainTabs', { screen: 'Trips' });
    } catch (error) {
      showToast({ type: 'error', title: 'Could not check payment', message: error?.message || 'Check My Trips shortly.' });
    } finally {
      setApplying(false);
    }
  };

  const apply = async () => {
    if (!quote?.allowed || !change || busy) return;
    const refund = Number(quote.refund_amount || 0);
    const ok = await confirm({
      title: 'Confirm this change?',
      message: [
        `New total: ${formatTripPrice(quote.new_total, currency)} (was ${formatTripPrice(quote.old_total, currency)}).`,
        refund > 0 ? `You'll get ${formatTripPrice(refund, currency)} back.` : null,
      ].filter(Boolean).join(' '),
      confirmText: 'Confirm change',
      cancelText: 'Go back',
      variant: 'info',
    });
    if (!ok) return;
    setApplying(true);
    try {
      await applyBookingChange(booking, change);
      await customAlert({
        title: 'Booking updated',
        message: refund > 0
          ? `Your refund of ${formatTripPrice(refund, currency)} is being processed. We'll message you when it is sent.`
          : 'Your booking has been updated.',
        variant: 'info',
      });
      navigation.navigate('MainTabs', { screen: 'Trips' });
    } catch (error) {
      showToast({ type: 'error', title: 'Could not change booking', message: error?.message || 'Please try again.' });
    } finally {
      setApplying(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}
          accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={20} color={COLORS.secondary} />
        </TouchableOpacity>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Change booking</Text>
          <Text style={styles.subtitle}>
            {booking.destination_name || 'Trip'} · {booking.seats} {booking.seats === 1 ? 'seat' : 'seats'}
          </Text>
        </View>
      </View>

      <View style={styles.tabs} accessibilityRole="tablist">
        {TABS.map((item) => (
          <TouchableOpacity key={item.key} style={[styles.tab, tab === item.key && styles.tabActive]}
            onPress={() => setTab(item.key)} accessibilityRole="tab" accessibilityState={{ selected: tab === item.key }}>
            <Text style={[styles.tabText, tab === item.key && styles.tabTextActive]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {tab === 'pickup' && (
          <>
            <Text style={styles.sectionLabel}>Choose a pickup point</Text>
            {pickups.length === 0 ? <ActivityIndicator color={COLORS.primary} /> : (
              <PickupList options={pickups} selectedId={stationId} onSelect={setStationId}
                address={address} onAddress={setAddress} currency={currency} disabled={busy} />
            )}
            {paid ? <Text style={styles.note}>If the new pickup point costs more, you pay the difference. If it costs less, you get the difference back.</Text> : null}
          </>
        )}

        {tab === 'seats' && (
          <>
            <Text style={styles.sectionLabel}>How many seats?</Text>
            <View style={styles.stepper}>
              <TouchableOpacity style={[styles.stepButton, seats <= 1 && styles.stepDisabled]}
                onPress={() => setSeats(Math.max(1, seats - 1))} disabled={busy || seats <= 1}
                accessibilityRole="button" accessibilityLabel="Fewer seats">
                <Ionicons name="remove" size={20} color={COLORS.secondary} />
              </TouchableOpacity>
              <Text style={styles.stepCount} accessibilityLiveRegion="polite">{seats}</Text>
              <TouchableOpacity style={[styles.stepButton, seats >= 8 && styles.stepDisabled]}
                onPress={() => setSeats(Math.min(8, seats + 1))} disabled={busy || seats >= 8}
                accessibilityRole="button" accessibilityLabel="More seats">
                <Ionicons name="add" size={20} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>
            {paid ? (
              <Text style={styles.note}>
                Adding seats: you pay for the extra seats. Removing seats follows the cancellation policy for the removed
                seats: 48h+ before departure 100% back, 24–48h 50%, under 24h nothing back.
              </Text>
            ) : null}
          </>
        )}

        {tab === 'reschedule' && (
          <>
            <Text style={styles.sectionLabel}>Move to another departure</Text>
            {departures.length === 0 ? (
              <Text style={styles.note}>No other departures to this destination have room right now.</Text>
            ) : departures.map((trip) => {
              const isSelected = trip.id === tripId;
              return (
                <TouchableOpacity key={trip.id} style={[styles.option, isSelected && styles.optionSelected]}
                  onPress={() => setTripId(trip.id)} disabled={busy}
                  accessibilityRole="radio" accessibilityState={{ selected: isSelected }}>
                  <Ionicons name={isSelected ? 'radio-button-on' : 'radio-button-off'} size={18}
                    color={isSelected ? COLORS.primary : COLORS.grayLight} />
                  <View style={styles.optionBody}>
                    <Text style={styles.optionText}>{departureLabel(trip.departure_date)}</Text>
                    <Text style={styles.optionSub}>
                      {trip.providers?.name || 'Operator'} · {formatTripPrice(trip.price, trip.currency)} per person · {trip.available_seats} left
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            {tripId && newTripPickups.length > 0 ? (
              <>
                <Text style={styles.sectionLabel}>Pickup point for that departure</Text>
                <PickupList options={newTripPickups} selectedId={newStationId} onSelect={setNewStationId}
                  address={newAddress} onAddress={setNewAddress} currency={currency} disabled={busy} />
              </>
            ) : null}
            {paid ? (
              <Text style={styles.note}>
                Paid bookings can move up to 48 hours before departure. You pay or get back any price difference.
              </Text>
            ) : null}
          </>
        )}

        {change ? (
          <View style={styles.quoteCard} accessibilityLiveRegion="polite">
            {quoting && !quote ? <ActivityIndicator color={COLORS.primary} /> : quote ? (
              quote.allowed ? (
                <>
                  <View style={styles.quoteRow}>
                    <Text style={styles.quoteLabel}>New total</Text>
                    <Text style={styles.quoteValue}>{formatTripPrice(quote.new_total, currency)}</Text>
                  </View>
                  <View style={styles.quoteRow}>
                    <Text style={styles.quoteLabel}>Was</Text>
                    <Text style={styles.quoteMuted}>{formatTripPrice(quote.old_total, currency)}</Text>
                  </View>
                  {Number(quote.refund_amount) > 0 ? (
                    <View style={styles.quoteRow}>
                      <Text style={styles.quoteLabel}>You get back</Text>
                      <Text style={styles.quoteRefund}>{formatTripPrice(quote.refund_amount, currency)}</Text>
                    </View>
                  ) : null}
                  {paid && Number(quote.refund_amount) === 0 && Number(quote.new_total) < Number(quote.old_total) ? (
                    <Text style={styles.note}>Within 24 hours of departure, so the removed seats aren&apos;t refunded.</Text>
                  ) : null}
                </>
              ) : (
                quote.needs_top_up ? (
                  <>
                    <View style={styles.quoteRow}>
                      <Text style={styles.quoteLabel}>New total</Text>
                      <Text style={styles.quoteValue}>{formatTripPrice(quote.new_total, currency)}</Text>
                    </View>
                    <View style={styles.quoteRow}>
                      <Text style={styles.quoteLabel}>Already paid</Text>
                      <Text style={styles.quoteMuted}>{formatTripPrice(quote.old_total, currency)}</Text>
                    </View>
                    <View style={styles.quoteRow}>
                      <Text style={styles.quoteLabel}>To pay now</Text>
                      <Text style={styles.quoteValue}>{formatTripPrice(topUp, currency)}</Text>
                    </View>
                  </>
                ) : (
                  <Text style={styles.quoteReason}>{quote.reason}</Text>
                )
              )
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <ModernButton
          title={applying ? 'Working…' : quote?.needs_top_up ? `Pay ${formatTripPrice(topUp, currency)} and change` : 'Confirm change'}
          onPress={quote?.needs_top_up ? payTopUp : apply}
          disabled={!(quote?.allowed || quote?.needs_top_up) || quoting || busy}
          loading={applying}
          variant="primary"
          size="large"
        />
      </View>
      <PaymentWebView
        visible={Boolean(checkout?.url)}
        checkoutUrl={checkout?.url}
        providerName="Chapa"
        onSuccess={() => finishTopUp(checkout?.transactionRef)}
        onCancel={() => setCheckout(null)}
        onError={(message) => {
          setCheckout(null);
          showToast({ type: 'error', title: 'Payment error', message: message || 'Could not complete checkout.' });
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  empty: { padding: SPACING.lg, color: COLORS.secondary },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingHorizontal: SPACING.md, paddingTop: SPACING.sm },
  backButton: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.white, ...SHADOWS.small,
  },
  titleBlock: { flex: 1 },
  title: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.secondary },
  subtitle: { fontSize: FONTS.sizes.sm, color: COLORS.iconSecondary, marginTop: 2 },
  tabs: {
    flexDirection: 'row', margin: SPACING.md, padding: 4, borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.borderLight,
  },
  tab: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: BORDER_RADIUS.md },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.secondary },
  tabTextActive: { color: COLORS.secondary, fontWeight: '700' },
  content: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.xl, gap: SPACING.sm },
  sectionLabel: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.secondary, marginTop: SPACING.sm },
  group: { gap: SPACING.xs },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, minHeight: 48, paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.borderLight,
    backgroundColor: COLORS.white,
  },
  optionSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.cardBackground },
  optionBody: { flex: 1 },
  optionText: { flex: 1, fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.secondary },
  optionSub: { fontSize: FONTS.sizes.xs, color: COLORS.iconSecondary, marginTop: 2 },
  input: {
    minHeight: 44, paddingHorizontal: SPACING.md, borderRadius: BORDER_RADIUS.md, borderWidth: 1,
    borderColor: COLORS.borderLight, backgroundColor: COLORS.white, fontSize: FONTS.sizes.sm, color: COLORS.secondary,
  },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg, alignSelf: 'flex-start' },
  stepButton: {
    width: 48, height: 48, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.borderLight,
    alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white,
  },
  stepDisabled: { opacity: 0.35 },
  stepCount: { minWidth: 32, textAlign: 'center', fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.secondary },
  note: { fontSize: FONTS.sizes.sm, color: COLORS.iconSecondary, lineHeight: 19 },
  quoteCard: {
    marginTop: SPACING.md, padding: SPACING.md, borderRadius: BORDER_RADIUS.lg, backgroundColor: COLORS.white,
    borderWidth: 1, borderColor: COLORS.borderLight, gap: SPACING.sm,
  },
  quoteRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  quoteLabel: { fontSize: FONTS.sizes.sm, color: COLORS.iconSecondary },
  quoteValue: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.secondary },
  quoteMuted: { fontSize: FONTS.sizes.sm, color: COLORS.grayLight, textDecorationLine: 'line-through' },
  quoteRefund: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.success },
  quoteReason: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.error, lineHeight: 19 },
  footer: { padding: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.borderLight, backgroundColor: COLORS.white },
});

export default ManageBookingScreen;
