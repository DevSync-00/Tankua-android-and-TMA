import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS, ANIMATIONS } from '../../config/theme';
import { useLanguage } from '../../contexts/LanguageContext';
import { useBooking } from '../../contexts/BookingContext';
import ModernButton from '../../components/ModernButton';
import AnimatedCard from '../../components/AnimatedCard';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const SelectTripTypeScreen = ({ navigation }) => {
  const { t } = useLanguage();
  const { updateBooking } = useBooking();
  const [selectedType, setSelectedType] = useState(null);

  const tripTypes = [
    {
      id: 'group',
      name: t('groupTrip') || 'Group Trip',
      description: 'Join other pilgrims on a shared journey',
      icon: 'people',
      basePrice: 500,
      color: COLORS.primary,
      emoji: '👥',
    },
    {
      id: 'private',
      name: t('privateTrip') || 'Private Trip',
      description: 'Exclusive trip for your family',
      icon: 'car',
      basePrice: 1500,
      color: COLORS.secondary,
      emoji: '🚗',
    },
    {
      id: 'holiday',
      name: t('holidayTrip') || 'Holiday Trip',
      description: 'Special holiday packages',
      icon: 'calendar',
      basePrice: 750,
      color: COLORS.primary,
      emoji: '🎉',
    },
  ];

  const handleContinue = () => {
    if (selectedType) {
      updateBooking({ tripType: selectedType });
      navigation.navigate('SelectDate');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('selectTripType') || 'Select Trip Type'}</Text>
          <Text style={styles.subtitle}>Choose the perfect trip for your journey</Text>
        </View>

        <View style={styles.typesContainer}>
          {tripTypes.map((type, index) => {
            const isSelected = selectedType === type.id;
            const scale = useSharedValue(1);

            const animatedStyle = useAnimatedStyle(() => ({
              transform: [{ scale: scale.value }],
            }));

            const handlePressIn = () => {
              scale.value = withSpring(0.96, ANIMATIONS.spring);
            };

            const handlePressOut = () => {
              scale.value = withSpring(1, ANIMATIONS.spring);
            };

            return (
              <AnimatedCard key={type.id} delay={index * 100} variant="glass">
                <AnimatedTouchable
                  style={[
                    styles.typeCard,
                    isSelected && styles.typeCardSelected,
                    animatedStyle,
                  ]}
                  onPress={() => setSelectedType(type.id)}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  activeOpacity={1}
                >
                  <View style={[styles.iconContainer, { backgroundColor: `${type.color}15` }]}>
                    <Text style={styles.emoji}>{type.emoji}</Text>
                  </View>
                  <View style={styles.typeContent}>
                    <Text style={styles.typeName}>{type.name}</Text>
                    <Text style={styles.typeDescription}>{type.description}</Text>
                    <View style={styles.priceContainer}>
                      <Text style={styles.priceLabel}>From</Text>
                      <Text style={styles.typePrice}>{type.basePrice} ETB</Text>
                    </View>
                  </View>
                  {isSelected && (
                    <View style={styles.checkContainer}>
                      <Ionicons name="checkmark-circle" size={32} color={COLORS.primary} />
                    </View>
                  )}
                </AnimatedTouchable>
              </AnimatedCard>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <ModernButton
          title={t('continue') || 'Continue'}
          onPress={handleContinue}
          disabled={!selectedType}
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
    padding: SPACING.md,
  },
  header: {
    marginBottom: SPACING.xl,
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
  typesContainer: {
    gap: SPACING.md,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 3,
    borderColor: COLORS.borderLight,
    ...SHADOWS.large,
  },
  typeCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}08`,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  emoji: {
    fontSize: 40,
  },
  typeContent: {
    flex: 1,
  },
  typeName: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: SPACING.xs,
    letterSpacing: -0.3,
  },
  typeDescription: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    marginBottom: SPACING.sm,
    lineHeight: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.xs,
  },
  priceLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray,
    fontWeight: '500',
  },
  typePrice: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  checkContainer: {
    marginLeft: SPACING.sm,
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

export default SelectTripTypeScreen;
