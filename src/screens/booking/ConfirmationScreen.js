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
import { COLORS, FONTS, SPACING, SHADOWS } from '../../config/theme';
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
      <View style={styles.successBanner}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark" size={28} color={COLORS.white} />
        </View>
        <View style={styles.successCopy}>
          <Text style={styles.title}>{t('bookingConfirmed') || 'Booking confirmed!'}</Text>
          <Text style={styles.subtitle}>Your ticket is ready below</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TripTicketCard ref={ticketRef} booking={booking} showInstructions={false} />
      </ScrollView>

      <View style={styles.footer}>
        <ModernButton
          title={sharing ? 'Preparing image...' : 'Share ticket'}
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
    fontWeight: '500',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  successIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    ...SHADOWS.medium,
  },
  successCopy: {
    flex: 1,
  },
  title: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '800',
    color: COLORS.secondary,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 2,
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    fontWeight: '500',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    ...SHADOWS.large,
  },
  footerButton: {
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
});

export default ConfirmationScreen;
