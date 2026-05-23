import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import Animated, {
  useAnimatedStyle,
} from 'react-native-reanimated';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS, ANIMATIONS } from '../../config/theme';
import { useLanguage } from '../../contexts/LanguageContext';
import { useBooking } from '../../contexts/BookingContext';
import ModernButton from '../../components/ModernButton';
import AnimatedCard from '../../components/AnimatedCard';

const SelectDateScreen = ({ navigation }) => {
  const { t } = useLanguage();
  const { updateBooking } = useBooking();
  const [selectedDate, setSelectedDate] = useState(null);

  const calendarAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 1,
    transform: [{ translateY: 0 }],
  }));

  const dateCardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: selectedDate ? 1 : 0 }],
    opacity: selectedDate ? 1 : 0,
  }));

  const handleContinue = () => {
    if (selectedDate) {
      updateBooking({ date: selectedDate });
      navigation.navigate('SelectProvider');
    }
  };

  const minDate = new Date();
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 6);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('selectDate') || 'Select Date'}</Text>
          <Text style={styles.subtitle}>Choose your preferred trip date</Text>
        </View>

        <Animated.View style={calendarAnimatedStyle}>
          <AnimatedCard variant="glass" style={styles.calendarCard}>
            <Calendar
              minDate={minDate.toISOString().split('T')[0]}
              maxDate={maxDate.toISOString().split('T')[0]}
              onDayPress={(day) => setSelectedDate(day.dateString)}
              markedDates={
                selectedDate
                  ? {
                      [selectedDate]: {
                        selected: true,
                        selectedColor: COLORS.primary,
                        selectedTextColor: COLORS.white,
                      },
                    }
                  : {}
              }
              theme={{
                selectedDayBackgroundColor: COLORS.primary,
                selectedDayTextColor: COLORS.white,
                todayTextColor: COLORS.primary,
                arrowColor: COLORS.primary,
                textDayFontWeight: '600',
                textMonthFontWeight: '800',
                textDayHeaderFontWeight: '700',
                textDayFontSize: FONTS.sizes.md,
                textMonthFontSize: FONTS.sizes.xl,
                'stylesheet.calendar.header': {
                  week: {
                    marginTop: SPACING.md,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingHorizontal: SPACING.sm,
                  },
                },
              }}
              style={styles.calendar}
            />
          </AnimatedCard>
        </Animated.View>

        {selectedDate && (
          <Animated.View style={[styles.selectedDateContainer, dateCardAnimatedStyle]}>
            <AnimatedCard variant="glass">
              <View style={styles.selectedDateContent}>
                <View style={styles.selectedDateIcon}>
                  <Text style={styles.selectedDateEmoji}>📅</Text>
                </View>
                <View style={styles.selectedDateText}>
                  <Text style={styles.selectedDateLabel}>Selected Date</Text>
                  <Text style={styles.selectedDate}>
                    {new Date(selectedDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              </View>
            </AnimatedCard>
          </Animated.View>
        )}
      </View>

      <View style={styles.footer}>
        <ModernButton
          title={t('continue') || 'Continue'}
          onPress={handleContinue}
          disabled={!selectedDate}
          variant="primary"
          size="large"
          style={styles.button}
          icon="arrow-forward"
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
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: '800',
    color: COLORS.secondary,
    marginBottom: SPACING.sm,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.gray,
    fontWeight: '500',
  },
  calendarCard: {
    padding: SPACING.md,
    ...SHADOWS.large,
  },
  calendar: {
    borderRadius: BORDER_RADIUS.lg,
  },
  selectedDateContainer: {
    marginTop: SPACING.lg,
  },
  selectedDateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  selectedDateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  selectedDateEmoji: {
    fontSize: 32,
  },
  selectedDateText: {
    flex: 1,
  },
  selectedDateLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    marginBottom: SPACING.xs,
    fontWeight: '600',
  },
  selectedDate: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.3,
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

export default SelectDateScreen;
