import React, { useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS, FONTS, BORDER_RADIUS } from '../config/theme';
import { useFeedback } from '../contexts/FeedbackContext';
import ModernButton from '../components/ModernButton';
import TripTicketCard from '../components/TripTicketCard';
import { shareTicketAsImage } from '../utils/shareTicketImage';

const TicketScreen = ({ route, navigation }) => {
  const { booking } = route.params || {};
  const { showToast } = useFeedback();
  const ticketRef = useRef(null);
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    try {
      setSharing(true);
      await new Promise((resolve) => setTimeout(resolve, 300));
      await shareTicketAsImage(ticketRef);
    } catch (error) {
      showToast({ type: 'error', title: 'Share failed', message: error.message || 'Could not share ticket image.' });
    } finally {
      setSharing(false);
    }
  };

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
        <Text style={styles.customHeaderTitle}>Trip Ticket</Text>
        <View style={styles.customHeaderRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <TripTicketCard ref={ticketRef} booking={booking} showInstructions />
      </ScrollView>

      <View style={styles.footer}>
        <ModernButton
          title={sharing ? 'Preparing image...' : 'Share ticket'}
          onPress={handleShare}
          variant="primary"
          size="large"
          style={styles.button}
          icon={sharing ? undefined : 'share-outline'}
          iconPosition="left"
          disabled={sharing}
          loading={sharing}
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
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: SPACING.md,
    paddingBottom: SPACING.lg,
    justifyContent: 'center',
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
