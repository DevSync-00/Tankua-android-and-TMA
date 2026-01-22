import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  useWindowDimensions, 
  FlatList,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, ANIMATIONS } from '../config/theme';
import { useLanguage } from '../contexts/LanguageContext';
import ModernButton from '../components/ModernButton';

// Separate component for slide to allow hooks
const OnboardingSlide = ({ item, index, width, scrollX }) => {
  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
  
  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.8, 1, 0.8],
      Extrapolate.CLAMP
    );
    
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.5, 1, 0.5],
      Extrapolate.CLAMP
    );
    
    const translateY = interpolate(
      scrollX.value,
      inputRange,
      [50, 0, 50],
      Extrapolate.CLAMP
    );
    
    return {
      transform: [
        { scale },
        { translateY },
      ],
      opacity,
    };
  });

  return (
    <Animated.View style={[styles.slide, { width }, animatedStyle]}>
      <Animated.View 
        style={[
          styles.iconContainer,
          { backgroundColor: `${item.color}15` }
        ]}
      >
        <Text style={styles.emoji}>{item.emoji}</Text>
      </Animated.View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </Animated.View>
  );
};

// Separate component for dot to allow hooks
const OnboardingDot = ({ index, width, scrollX }) => {
  const dotAnimatedStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const widthValue = interpolate(
      scrollX.value,
      inputRange,
      [8, 24, 8],
      Extrapolate.CLAMP
    );
    const opacityValue = interpolate(
      scrollX.value,
      inputRange,
      [0.3, 1, 0.3],
      Extrapolate.CLAMP
    );
    
    return {
      width: widthValue,
      opacity: opacityValue,
    };
  });

  return (
    <Animated.View
      style={[
        styles.dot,
        { backgroundColor: COLORS.primary },
        dotAnimatedStyle,
      ]}
    />
  );
};

const OnboardingScreen = ({ navigation }) => {
  const { width, height } = useWindowDimensions();
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useSharedValue(0);

  const slides = [
    {
      id: '1',
      title: t('onboarding1Title') || 'Discover Amazing Places',
      description: t('onboarding1Desc') || 'Explore Ethiopia\'s most beautiful destinations and attractions with ease.',
      icon: 'location',
      emoji: '📍',
      color: COLORS.primary,
    },
    {
      id: '2',
      title: t('onboarding2Title') || 'Book Your Journey',
      description: t('onboarding2Desc') || 'Simple booking process with multiple pickup stations and flexible dates.',
      icon: 'calendar',
      emoji: '📅',
      color: COLORS.secondary,
    },
    {
      id: '3',
      title: t('onboarding3Title') || 'Travel in Peace',
      description: t('onboarding3Desc') || 'Join thousands of travelers on safe and comfortable trips.',
      icon: 'heart',
      emoji: '✨',
      color: COLORS.primary,
    },
  ];

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      setCurrentIndex(nextIndex);
    } else {
      navigation.replace('Login');
    }
  };

  const handleSkip = () => {
    navigation.replace('Login');
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const renderSlide = ({ item, index }) => {
    return (
      <OnboardingSlide
        item={item}
        index={index}
        width={width}
        scrollX={scrollX}
      />
    );
  };

  const renderDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {slides.map((_, index) => (
          <OnboardingDot
            key={index}
            index={index}
            width={width}
            scrollX={scrollX}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>{t('skip') || 'Skip'}</Text>
      </TouchableOpacity>

      <Animated.FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />

      {renderDots()}

      <View style={styles.buttonContainer}>
        <ModernButton
          title={currentIndex === slides.length - 1 ? (t('getStarted') || 'Get Started') : (t('next') || 'Next')}
          onPress={handleNext}
          variant="primary"
          size="large"
          style={styles.button}
          icon={currentIndex === slides.length - 1 ? 'arrow-forward' : 'chevron-forward'}
          iconPosition="right"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: SPACING.md,
    zIndex: 10,
    padding: SPACING.sm,
  },
  skipText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.gray,
    fontWeight: '600',
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  iconContainer: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  emoji: {
    fontSize: 80,
  },
  title: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: '800',
    color: COLORS.secondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
    letterSpacing: -1,
  },
  description: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: SPACING.lg,
    fontWeight: '400',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: SPACING.xl,
    gap: SPACING.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  buttonContainer: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  button: {
    width: '100%',
  },
});

export default OnboardingScreen;
