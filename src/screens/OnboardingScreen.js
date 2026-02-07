import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../config/theme';
import { useLanguage } from '../contexts/LanguageContext';

const onboardingImage = require('../../assets/onboarding-fasil-ghebbi.png');
const onboardingWaterfallImage = require('../../assets/onboarding-waterfall.png');
const onboardingDallolImage = require('../../assets/onboarding-dallol.png');
const DOT_INACTIVE_COLOR = '#D9E6F2';

// Separate component for slide to allow hooks
const OnboardingSlide = ({ item, index, width, height, scrollX }) => {
  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
  const showImageHeader = Boolean(item.image);
  const imageHeight = Math.min(height * 0.45, 360);
  
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
    <Animated.View
      style={[styles.slide, { width }, animatedStyle, !showImageHeader && styles.slideCentered]}
    >
      {showImageHeader ? (
        <View style={[styles.imageContainer, { height: imageHeight }]}>
          <Image source={item.image} style={styles.headerImage} />
        </View>
      ) : (
        <Animated.View
          style={[
            styles.iconContainer,
            { backgroundColor: `${item.color}15` },
          ]}
        >
          <Text style={styles.emoji}>{item.emoji}</Text>
        </Animated.View>
      )}
      <View
        style={[
          styles.textContainer,
          showImageHeader ? styles.textContainerWithImage : styles.textContainerDefault,
        ]}
      >
        {item.headlinePrefix && item.headlineHighlight ? (
          <View style={styles.headlineContainer}>
            <Text style={styles.headline}>{item.headlinePrefix}</Text>
            <View style={styles.headlineHighlightWrapper}>
              <Text style={[styles.headline, styles.headlineHighlight]}>
                {item.headlineHighlight}
              </Text>
              <View style={styles.headlineUnderline} />
            </View>
          </View>
        ) : (
          <Text style={styles.title}>{item.title}</Text>
        )}
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </Animated.View>
  );
};

// Separate component for dot to allow hooks
const OnboardingDot = ({ index, width, scrollX, isActive }) => {
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
        { backgroundColor: isActive ? COLORS.primary : DOT_INACTIVE_COLOR },
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
      headlinePrefix: 'Discover fascinating',
      headlineHighlight: 'destinations',
      description:
        'Explore Ethiopia\'s biggest and most loved tourist attractions through our easy-to-use search and discover features.',
      image: onboardingImage,
    },
    {
      id: '2',
      headlinePrefix: 'Choose your comfort time and',
      headlineHighlight: 'destination',
      description:
        'Travel in comfort with everything you need for the perfect adventure. Book your trip, pick your date, and create memories that last a lifetime.',
      image: onboardingWaterfallImage,
    },
    {
      id: '3',
      headlinePrefix: 'Live discover travel',
      headlineHighlight: 'Ethiopia',
      description:
        'Discover and experience the beauty, history, and spirituality that define this remarkable nation.',
      image: onboardingDallolImage,
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
        height={height}
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
            isActive={currentIndex === index}
          />
        ))}
      </View>
    );
  };

  const isFirstSlide = currentIndex === 0;
  const primaryButtonLabel = isFirstSlide ? t('getStarted') || 'Get Started' : t('next') || 'Next';

  return (
    <View style={styles.container}>
      <View style={styles.fakeStatusBar}>
        <Text style={styles.statusTime}>9:41</Text>
        <View style={styles.statusIcons}>
          <Ionicons name="cellular" size={14} color={COLORS.white} />
          <Ionicons name="wifi" size={14} color={COLORS.white} />
          <Ionicons name="battery-full" size={16} color={COLORS.white} />
        </View>
      </View>
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
        <TouchableOpacity style={styles.primaryButton} onPress={handleNext} activeOpacity={0.9}>
          <Text style={styles.primaryButtonText}>{primaryButtonLabel}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.homeIndicator} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  fakeStatusBar: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.lg,
    right: SPACING.lg,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusTime: {
    color: COLORS.white,
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  skipButton: {
    position: 'absolute',
    top: SPACING.xl,
    right: SPACING.lg,
    zIndex: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.secondary,
    fontWeight: FONTS.weights.semibold,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: COLORS.white,
  },
  slideCentered: {
    justifyContent: 'center',
  },
  imageContainer: {
    width: '100%',
    overflow: 'hidden',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    backgroundColor: COLORS.lightGray,
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  textContainerWithImage: {
    marginTop: SPACING.xl,
  },
  textContainerDefault: {
    marginTop: 0,
  },
  headlineContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headline: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: FONTS.weights.bold,
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'serif',
    }),
    color: COLORS.secondary,
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  headlineHighlightWrapper: {
    alignItems: 'center',
  },
  headlineHighlight: {
    color: COLORS.primary,
  },
  headlineUnderline: {
    height: 6,
    width: 120,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    marginTop: 4,
    opacity: 0.9,
    transform: [{ rotate: '-2deg' }],
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
    lineHeight: 24,
    marginTop: SPACING.sm,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'sans-serif',
      default: 'System',
    }),
    fontWeight: '400',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  buttonContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
  },
  homeIndicator: {
    width: 120,
    height: 5,
    borderRadius: 999,
    backgroundColor: COLORS.black,
    alignSelf: 'center',
    marginBottom: SPACING.sm,
  },
});

export default OnboardingScreen;
