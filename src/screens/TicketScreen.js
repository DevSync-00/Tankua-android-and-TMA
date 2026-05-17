import React, { useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, SHADOWS } from '../config/theme';
import ModernButton from '../components/ModernButton';
import TripTicketCard from '../components/TripTicketCard';
import { shareTicketAsImage } from '../utils/shareTicketImage';

const TicketScreen = ({ route }) => {
  const { booking } = route.params || {};
  const ticketRef = useRef(null);
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
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
