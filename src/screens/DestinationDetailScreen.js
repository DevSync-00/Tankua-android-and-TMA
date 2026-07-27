import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  Share,
  Dimensions,
  FlatList,
  Modal,
  Linking,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';

import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useBooking } from '../contexts/BookingContext';
import { getOsmSearchUrl } from '../config/osm';
import { useAuth } from '../contexts/AuthContext';
import { validateProfile, getProfileIncompleteMessage } from '../utils/profileValidation';
import ModernButton from '../components/ModernButton';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = 380;

const DestinationDetailScreen = ({ route, navigation }) => {
  const { destination } = route.params || {};
  const { t } = useLanguage();
  const { updateBooking } = useBooking();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  // State
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const scrollY = useSharedValue(0);
  const scrollViewRef = useRef(null);

  // Destructure destination data with defaults
  const {
    name = 'Destination',
    images = [],
    description = '',
    city = '',
    region = '',
    distance = 0,
    rating = 0,
    review_count = 0,
    price = null,
    estimated_duration = null,
    price_range = null,
    is_verified = false,
    category = 'General',
    tags = [],
  } = destination || {};

  // Image list fallback
  const displayImages = images && images.length > 0
    ? images
    : ['https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=800&q=80'];

  // Formatting helpers
  const formatDuration = () => {
    if (!estimated_duration) return '1-2 Days';
    if (typeof estimated_duration === 'string') return estimated_duration;
    if (estimated_duration < 1) return `${Math.round(estimated_duration * 60)} mins`;
    if (estimated_duration < 24) return `${Math.round(estimated_duration)} hrs`;
    return `${Math.round(estimated_duration / 24)} Days`;
  };

  const formatPriceRange = () => {
    if (price_range) {
      if (typeof price_range === 'string') return price_range;
      if (price_range.min && price_range.max) return `ETB ${price_range.min}-${price_range.max}`;
    }
    if (price) return `ETB ${price}`;
    return 'ETB 500+';
  };

  // Actions
  const handleBookTrip = () => {
    const validation = validateProfile(user);
    if (!validation.isValid) {
      Alert.alert(
        'Profile Incomplete',
        getProfileIncompleteMessage(validation.missingFields),
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Update Profile',
            onPress: () => navigation.navigate('MainTabs', { screen: 'Profile' }),
          },
        ]
      );
      return;
    }

    updateBooking({ destination });
    navigation.navigate('BookingFlow', { screen: 'SelectTrip' });
  };

  const handleToggleFavorite = () => {
    setIsSaved(!isSaved);
    Alert.alert(
      !isSaved ? 'Saved to Favorites' : 'Removed from Favorites',
      !isSaved ? `${name} has been added to your saved destinations.` : `${name} has been removed from your saved list.`,
      [{ text: 'OK' }]
    );
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Explore ${name} in ${city || region || 'Ethiopia'} with Tankua Travel!`,
        title: name,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleGetDirections = () => {
    const searchQuery = `${name} ${city || region || 'Ethiopia'}`;
    const url = getOsmSearchUrl(searchQuery);
    Linking.openURL(url).catch((err) => {
      console.error('Could not open maps:', err);
      Alert.alert('Error', 'Unable to open map directions application.');
    });
  };

  const handleOpenImageModal = (index) => {
    setModalImageIndex(index);
    setIsImageModalVisible(true);
  };

  // Scroll animations
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const animatedHeaderBackground = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [HERO_HEIGHT - 120, HERO_HEIGHT - 40],
      [0, 1],
      Extrapolate.CLAMP
    );
    return {
      opacity,
    };
  });

  const animatedHeaderTitle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [HERO_HEIGHT - 80, HERO_HEIGHT - 20],
      [0, 1],
      Extrapolate.CLAMP
    );
    const translateY = interpolate(
      scrollY.value,
      [HERO_HEIGHT - 80, HERO_HEIGHT - 20],
      [10, 0],
      Extrapolate.CLAMP
    );
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const animatedHeroScale = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [-HERO_HEIGHT, 0],
      [1.3, 1],
      Extrapolate.CLAMP
    );
    return {
      transform: [{ scale }],
    };
  });

  // Extract highlights/features from tags or defaults
  const featureList = [
    { icon: 'camera-outline', label: 'Scenic Views' },
    { icon: 'shield-checkmark-outline', label: 'Verified Tour' },
    { icon: 'compass-outline', label: 'Guided Option' },
    { icon: 'time-outline', label: 'Flexible Time' },
    ...(tags && tags.length > 0
      ? tags.map((t) => ({ icon: 'sparkles-outline', label: t }))
      : []),
  ].slice(0, 6);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Floating Animated Header */}
      <View style={[styles.floatingHeader, { paddingTop: insets.top }]}>
        <Animated.View style={[styles.headerBackground, animatedHeaderBackground]} />
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.circleIconButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
            accessibilityLabel="Go Back"
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.secondary} />
          </TouchableOpacity>

          <Animated.Text
            style={[styles.headerTitleText, animatedHeaderTitle]}
            numberOfLines={1}
          >
            {name}
          </Animated.Text>

          <View style={styles.headerRightActions}>
            <TouchableOpacity
              style={styles.circleIconButton}
              onPress={handleShare}
              activeOpacity={0.8}
              accessibilityLabel="Share Destination"
            >
              <Ionicons name="share-outline" size={20} color={COLORS.secondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.circleIconButton, { marginLeft: SPACING.sm }]}
              onPress={handleToggleFavorite}
              activeOpacity={0.8}
              accessibilityLabel="Favorite Destination"
            >
              <Ionicons
                name={isSaved ? 'heart' : 'heart-outline'}
                size={20}
                color={isSaved ? COLORS.accent : COLORS.secondary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Scroll Content */}
      <Animated.ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContainer}
      >
        {/* Hero Image Carousel */}
        <Animated.View style={[styles.heroContainer, animatedHeroScale]}>
          <FlatList
            data={displayImages}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setActiveImageIndex(index);
            }}
            keyExtractor={(_, index) => `hero-${index}`}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                activeOpacity={0.95}
                onPress={() => handleOpenImageModal(index)}
                style={styles.heroSlide}
              >
                <Image source={{ uri: item }} style={styles.heroImage} resizeMode="cover" />
              </TouchableOpacity>
            )}
          />

          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.7)']}
            locations={[0, 0.4, 1]}
            style={styles.heroGradientOverlay}
          />

          {/* Carousel Pagination & Image Counter */}
          <View style={styles.carouselInfoRow}>
            <View style={styles.paginationDots}>
              {displayImages.map((_, idx) => (
                <View
                  key={`dot-${idx}`}
                  style={[
                    styles.dot,
                    activeImageIndex === idx ? styles.activeDot : styles.inactiveDot,
                  ]}
                />
              ))}
            </View>

            <View style={styles.imageCounterBadge}>
              <Ionicons name="images-outline" size={13} color={COLORS.white} />
              <Text style={styles.imageCounterText}>
                {activeImageIndex + 1} / {displayImages.length}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Content Details Card */}
        <View style={styles.contentBody}>
          {/* Category & Verification Badge */}
          <View style={styles.topBadgeRow}>
            {is_verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color={COLORS.secondary} />
                <Text style={styles.verifiedBadgeText}>Verified Destination</Text>
              </View>
            )}
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{category}</Text>
            </View>
          </View>

          {/* Title & Location Header */}
          <Text style={styles.destinationTitle}>{name}</Text>

          <View style={styles.locationMetaRow}>
            <View style={styles.locationItem}>
              <Ionicons name="location" size={16} color={COLORS.primaryDark} />
              <Text style={styles.locationText}>
                {city ? `${city}, ${region || 'Ethiopia'}` : region || 'Ethiopia'}
              </Text>
            </View>
            {distance > 0 && (
              <View style={styles.distanceBadge}>
                <Ionicons name="navigate-outline" size={13} color={COLORS.grayDark} />
                <Text style={styles.distanceBadgeText}>{distance} km away</Text>
              </View>
            )}
          </View>

          {/* Rating Summary Bar */}
          <View style={styles.ratingBarCard}>
            <View style={styles.ratingBarLeft}>
              <Ionicons name="star" size={22} color={COLORS.primary} />
              <Text style={styles.ratingNumberText}>{rating > 0 ? rating.toFixed(1) : '4.8'}</Text>
              <Text style={styles.ratingMaxText}>/5.0</Text>
              <Text style={styles.reviewCountText}>
                ({review_count > 0 ? review_count : 124} reviews)
              </Text>
            </View>
            <TouchableOpacity
              style={styles.writeReviewLink}
              onPress={() => navigation.navigate('Review', { destination })}
              activeOpacity={0.7}
            >
              <Text style={styles.writeReviewText}>Write Review</Text>
              <Ionicons name="chevron-forward" size={14} color={COLORS.primaryDark} />
            </TouchableOpacity>
          </View>

          {/* Quick Key Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="time-outline" size={20} color={COLORS.iconPrimary} />
              </View>
              <Text style={styles.statLabel}>Duration</Text>
              <Text style={styles.statValue}>{formatDuration()}</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="cash-outline" size={20} color={COLORS.iconPrimary} />
              </View>
              <Text style={styles.statLabel}>Price Level</Text>
              <Text style={styles.statValue} numberOfLines={1}>{formatPriceRange()}</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="compass-outline" size={20} color={COLORS.iconPrimary} />
              </View>
              <Text style={styles.statLabel}>Category</Text>
              <Text style={styles.statValue} numberOfLines={1}>{category}</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.iconPrimary} />
              </View>
              <Text style={styles.statLabel}>Status</Text>
              <Text style={styles.statValue}>{is_verified ? 'Verified' : 'Featured'}</Text>
            </View>
          </View>

          {/* About Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeading}>About Destination</Text>
            <Text
              style={styles.descriptionText}
              numberOfLines={isDescriptionExpanded ? undefined : 4}
            >
              {description ||
                'Discover this captivating location filled with vibrant local culture, stunning natural landscapes, rich historic heritage, and memorable outdoor activities for travelers and adventure lovers.'}
            </Text>
            {(description.length > 140 || !description) && (
              <TouchableOpacity
                onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                style={styles.readMoreButton}
                activeOpacity={0.7}
              >
                <Text style={styles.readMoreText}>
                  {isDescriptionExpanded ? 'Read Less' : 'Read More'}
                </Text>
                <Ionicons
                  name={isDescriptionExpanded ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={COLORS.secondary}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Experience & Highlights Grid */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeading}>Highlights & Features</Text>
            <View style={styles.featuresGrid}>
              {featureList.map((item, idx) => (
                <View key={`feat-${idx}`} style={styles.featureChip}>
                  <Ionicons name={item.icon} size={16} color={COLORS.iconPrimary} />
                  <Text style={styles.featureChipText}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Location & Directions Card */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeading}>Location & Directions</Text>
            <View style={styles.locationCard}>
              <View style={styles.locationCardHeader}>
                <View style={styles.mapIconCircle}>
                  <Ionicons name="map" size={24} color={COLORS.secondary} />
                </View>
                <View style={styles.locationCardInfo}>
                  <Text style={styles.locationCardTitle}>{name}</Text>
                  <Text style={styles.locationCardSub}>
                    {city ? `${city}, ${region || 'Ethiopia'}` : region || 'Ethiopia'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.directionsButton}
                onPress={handleGetDirections}
                activeOpacity={0.85}
              >
                <Ionicons name="navigate" size={18} color={COLORS.white} />
                <Text style={styles.directionsButtonText}>Get Directions</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Spacer to prevent overlap with sticky footer */}
          <View style={{ height: 100 }} />
        </View>
      </Animated.ScrollView>

      {/* Full-Screen Image Lightbox Modal */}
      <Modal
        visible={isImageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsImageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <SafeAreaView style={styles.modalSafeArea}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setIsImageModalVisible(false)}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={26} color={COLORS.white} />
            </TouchableOpacity>

            <FlatList
              data={displayImages}
              horizontal
              pagingEnabled
              initialScrollIndex={modalImageIndex}
              getItemLayout={(_, index) => ({
                length: SCREEN_WIDTH,
                offset: SCREEN_WIDTH * index,
                index,
              })}
              keyExtractor={(_, index) => `modal-${index}`}
              renderItem={({ item }) => (
                <View style={styles.modalImageWrapper}>
                  <Image source={{ uri: item }} style={styles.modalImage} resizeMode="contain" />
                </View>
              )}
            />
          </SafeAreaView>
        </View>
      </Modal>

      {/* Sticky Bottom Glass CTA Bar */}
      <View style={[styles.bottomGlassFooter, { paddingBottom: Math.max(insets.bottom, SPACING.md) }]}>
        <View style={styles.footerPriceContainer}>
          <Text style={styles.footerPriceLabel}>Total Starting Price</Text>
          <View style={styles.footerPriceRow}>
            <Text style={styles.footerPriceValue}>
              {price ? `ETB ${price}` : formatPriceRange()}
            </Text>
            <Text style={styles.footerPriceUnit}> / person</Text>
          </View>
        </View>

        <ModernButton
          title={t('bookTrip') || 'Book Trip Now'}
          onPress={handleBookTrip}
          variant="primary"
          size="large"
          style={styles.bookCTAButton}
          icon="arrow-forward"
          iconPosition="right"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    paddingBottom: 0,
  },

  /* Floating Header Bar */
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    elevation: 10,
  },
  headerBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.small,
  },
  headerContent: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
  },
  circleIconButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.cardBackgroundGlass,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  headerTitleText: {
    flex: 1,
    marginHorizontal: SPACING.md,
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.secondary,
    textAlign: 'center',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  /* Hero Section */
  heroContainer: {
    height: HERO_HEIGHT,
    width: '100%',
    position: 'relative',
    backgroundColor: COLORS.secondaryDark,
  },
  heroSlide: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  carouselInfoRow: {
    position: 'absolute',
    bottom: 36,
    left: SPACING.lg,
    right: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paginationDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    height: 7,
    borderRadius: BORDER_RADIUS.full,
    marginRight: 5,
  },
  activeDot: {
    width: 22,
    backgroundColor: COLORS.primary,
  },
  inactiveDot: {
    width: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  imageCounterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  imageCounterText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.white,
    fontWeight: FONTS.weights.semibold,
    marginLeft: 5,
  },

  /* Content Body */
  contentBody: {
    backgroundColor: COLORS.cardBackground,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    minHeight: SCREEN_HEIGHT - HERO_HEIGHT,
    ...SHADOWS.large,
  },
  topBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: SPACING.sm,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
    marginBottom: 4,
  },
  verifiedBadgeText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.secondary,
    fontWeight: FONTS.weights.bold,
    marginLeft: 4,
  },
  categoryBadge: {
    backgroundColor: COLORS.backgroundTertiary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 4,
  },
  categoryBadgeText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.iconSecondary,
    fontWeight: FONTS.weights.semibold,
    textTransform: 'capitalize',
  },

  destinationTitle: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: FONTS.weights.black,
    color: COLORS.secondary,
    letterSpacing: -0.5,
    lineHeight: 38,
    marginBottom: SPACING.xs,
  },
  locationMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: SPACING.md,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  locationText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.charcoal,
    fontWeight: FONTS.weights.medium,
    marginLeft: 4,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundGray,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.sm,
  },
  distanceBadgeText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.grayDark,
    fontWeight: FONTS.weights.medium,
    marginLeft: 3,
  },

  /* Rating Bar Card */
  ratingBarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  ratingBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingNumberText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.black,
    color: COLORS.secondary,
    marginLeft: 6,
  },
  ratingMaxText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    fontWeight: FONTS.weights.medium,
  },
  reviewCountText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    marginLeft: SPACING.xs,
  },
  writeReviewLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  writeReviewText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.iconSecondary,
    marginRight: 2,
  },

  /* Stats Grid */
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.xs,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray,
    fontWeight: FONTS.weights.medium,
    marginBottom: 2,
  },
  statValue: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.secondary,
    fontWeight: FONTS.weights.bold,
    textAlign: 'center',
  },

  /* Sections */
  sectionContainer: {
    marginBottom: SPACING.xl,
  },
  sectionHeading: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.secondary,
    marginBottom: SPACING.md,
    letterSpacing: -0.3,
  },
  descriptionText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.charcoal,
    lineHeight: 24,
    fontWeight: FONTS.weights.regular,
  },
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  readMoreText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    color: COLORS.secondary,
    marginRight: 4,
  },

  /* Features Grid */
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    margin: 4,
    ...SHADOWS.xs,
  },
  featureChipText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.secondary,
    fontWeight: FONTS.weights.medium,
    marginLeft: 6,
  },

  /* Location Card */
  locationCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  locationCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  mapIconCircle: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  locationCardInfo: {
    flex: 1,
  },
  locationCardTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.secondary,
  },
  locationCardSub: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    marginTop: 2,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
  },
  directionsButtonText: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
    marginLeft: SPACING.sm,
  },

  /* Lightbox Modal */
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  modalSafeArea: {
    flex: 1,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImageWrapper: {
    width: SCREEN_WIDTH,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '94%',
    height: '80%',
  },

  /* Bottom Glass Sticky Footer */
  bottomGlassFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.cardBackgroundGlass,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    ...SHADOWS.large,
  },
  footerPriceContainer: {
    flex: 1,
    marginRight: SPACING.md,
  },
  footerPriceLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray,
    fontWeight: FONTS.weights.medium,
  },
  footerPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  footerPriceValue: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.black,
    color: COLORS.secondary,
  },
  footerPriceUnit: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray,
    fontWeight: FONTS.weights.medium,
  },
  bookCTAButton: {
    flex: 1.3,
  },
});

export default DestinationDetailScreen;
