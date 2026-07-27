import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, SHADOWS, BORDER_RADIUS } from '../../config/theme';
import { useLanguage } from '../../contexts/LanguageContext';
import { useBooking } from '../../contexts/BookingContext';
import { useAuth } from '../../contexts/AuthContext';
import ModernButton from '../../components/ModernButton';
import TripTicketCard from '../../components/TripTicketCard';
import Loader from '../../components/Loader';
import { shareTicketAsImage } from '../../utils/shareTicketImage';

const ConfirmationScreen = ({ navigation, route }) => {
  const { t } = useLanguage();
  const { createBooking, resetBooking } = useBooking();
  const { user } = useAuth();
  const ticketRef = useRef(null);
  const [booking, setBooking] = useState(route.params?.booking || null);
  const [loading, setLoading] = useState(!route.params?.booking);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (!route.params?.booking) {
      finalizeBooking();
    }
  }, []);

  const finalizeBooking = async () => {
    try {
      const newBooking = await createBooking(user.id, user);
      setBooking(newBooking);
      setLoading(false);
    } catch (error) {
      if (error.code === 'PROFILE_INCOMPLETE') {
        Alert.alert('Profile Incomplete', error.message, [
          { text: 'OK', onPress: () => navigation.navigate('MainTabs', { screen: 'Profile' }) },
        ]);
      } else {
        Alert.alert('Error', error.message || 'Failed to create booking');
      }
      setLoading(false);
    }
  };

  const handleDone = () => {
    resetBooking();
    navigation.getParent()?.navigate('MainTabs', { screen: 'Trips' });
  };

  const handleShareTicket = async () => {
    try {
      setSharing(true);
      await new Promise((resolve) => setTimeout(resolve, 300));
      await shareTicketAsImage(ticketRef);
    } catch (error) {
      Alert.alert('Share failed', error.message || 'Could not share ticket image.');
    } finally {
      setSharing(false);
    }
  };

  if (loading || !booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Loader />
          <Text style={styles.loadingText}>Creating your booking...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Custom Confirmation Header */}
      <View style={styles.customHeader}>
        <View style={styles.customHeaderLeft} />
        <Text style={styles.customHeaderTitle}>Confirmation</Text>
        <View style={styles.customHeaderRight} />
      </View>

      {/* Sleek Success Header Banner */}
      <View style={styles.successBanner}>
        <View style={styles.successIconCircle}>
          <Ionicons name="checkmark-circle" size={32} color={COLORS.success} />
        </View>
        <View style={styles.successCopy}>
          <Text style={styles.title}>{t('bookingConfirmed') || 'Booking Secured!'}</Text>
          <Text style={styles.subtitle}>Your digital travel ticket is ready below</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.ticketWrapper}>
          <TripTicketCard ref={ticketRef} booking={booking} showInstructions={false} />
        </View>
      </ScrollView>

      {/* Balanced Sticky Footer Action Buttons */}
      <View style={styles.footer}>
        <ModernButton
          title={sharing ? 'Preparing...' : 'Share Ticket'}
          onPress={handleShareTicket}
          variant="outline"
          size="large"
          style={styles.footerButton}
          icon={sharing ? undefined : 'share-outline'}
          iconPosition="left"
          disabled={sharing}
          loading={sharing}
        />
        <ModernButton
          title="Done"
          onPress={handleDone}
          variant="primary"
          size="large"
          style={styles.footerButton}
          icon="checkmark"
          iconPosition="right"
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONTS.sizes.md,
    color: COLORS.gray,
    fontWeight: '600',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    ...SHADOWS.xs,
  },
  successIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${COLORS.success}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  successCopy: {
    flex: 1,
  },
  title: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '800',
    color: COLORS.secondary,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 2,
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray,
    fontWeight: '500',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    justifyContent: 'center',
  },
  ticketWrapper: {
    alignSelf: 'stretch',
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    ...SHADOWS.large,
    gap: SPACING.sm,
  },
  footerButton: {
    flex: 1,
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
  customHeaderLeft: {
    width: 36,
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

export default ConfirmationScreen;
