import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  useWindowDimensions,
  TouchableOpacity,
  Alert,
  ScrollView,
  Share,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
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
import { useAuth } from '../contexts/AuthContext';
import { validateProfile, getProfileIncompleteMessage } from '../utils/profileValidation';
import ModernButton from '../components/ModernButton';

const IMAGE_HEIGHT = 380;
const HEADER_HEIGHT = 60;

const DestinationDetailScreen = ({ route, navigation }) => {
  const { destination } = route.params;
  const { t } = useLanguage();
  const { updateBooking } = useBooking();
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const scrollY = useSharedValue(0);

  const {
    name,
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
    category = 'other',
    tags = [],
  } = destination;

  const heroImage = images && images.length > 0 ? images[0] : null;
  const galleryImages = images && images.length > 1 ? images.slice(1, 4) : [];

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
            onPress: () => navigation.navigate('MainTabs', { screen: 'Profile' })
          },
        ]
      );
      return;
    }

    updateBooking({ destination });
    navigation.navigate('BookingFlow', { screen: 'SelectTrip' });
  };

  const handleSave = () => {
    setSaved(!saved);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${name} in ${city || region}!`,
        title: name,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatDuration = () => {
    if (!estimated_duration) return null;
    if (estimated_duration < 1) {
      return `${Math.round(estimated_duration * 60)}min`;
    }
    if (estimated_duration < 24) {
      return `${Math.round(estimated_duration)}h`;
    }
    return `${Math.round(estimated_duration / 24)}d`;
  };

  const formatPriceRange = () => {
    if (!price_range) return null;
    if (typeof price_range === 'string') return price_range;
    if (price_range.min && price_range.max) {
      return `$${price_range.min}-${price_range.max}`;
    }
    return null;
  };

  // Animated image style
  const imageAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [-IMAGE_HEIGHT, 0],
      [1.2, 1],
      Extrapolate.CLAMP
    );
    
    return {
      transform: [{ scale }],
    };
  });

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Image */}
        <Animated.View style={[styles.heroContainer, imageAnimatedStyle]}>
          {heroImage ? (
            <Image source={{ uri: heroImage }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Ionicons name="image-outline" size={80} color={COLORS.grayLight} />
            </View>
          )}
          <LinearGradient
            colors={['transparent', 'transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']}
            locations={[0, 0.3, 0.7, 1]}
            style={styles.heroGradient}
          />
          
          {/* Back Button Only */}
          <SafeAreaView edges={['top']} style={styles.floatingBackButtonContainer}>
            <TouchableOpacity
              style={styles.floatingBackButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={22} color={COLORS.white} />
            </TouchableOpacity>
          </SafeAreaView>
        </Animated.View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <View style={styles.titleRow}>
              <View style={styles.titleLeft}>
                <Text style={styles.title}>{name}</Text>
              </View>
            </View>
            
            <View style={styles.metaRow}>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={16} color={COLORS.gray} />
                <Text style={styles.locationText}>{city || region || 'Ethiopia'}</Text>
              </View>
              {distance > 0 && (
                <View style={styles.distanceRow}>
                  <Ionicons name="navigate-outline" size={16} color={COLORS.gray} />
                  <Text style={styles.distanceText}>{distance}km away</Text>
                </View>
              )}
            </View>

            {/* Rating */}
            {rating > 0 && (
              <View style={styles.ratingRow}>
                <View style={styles.ratingStars}>
                  <Ionicons name="star" size={18} color={COLORS.warning} />
                  <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                </View>
                {review_count > 0 && (
                  <Text style={styles.reviewCount}>({review_count} reviews)</Text>
                )}
              </View>
            )}
          </View>

          {/* Metadata Badges */}
          <View style={styles.badgesRow}>
            {formatDuration() && (
              <View style={styles.metadataBadge}>
                <Ionicons name="time-outline" size={16} color={COLORS.primary} />
                <Text style={styles.badgeText}>{formatDuration()}</Text>
              </View>
            )}
            {formatPriceRange() && (
              <View style={styles.metadataBadge}>
                <Ionicons name="cash-outline" size={16} color={COLORS.primary} />
                <Text style={styles.badgeText}>{formatPriceRange()}</Text>
              </View>
            )}
            {category && (
              <View style={styles.metadataBadge}>
                <Ionicons name="star-outline" size={16} color={COLORS.primary} />
                <Text style={styles.badgeText}>{category}</Text>
              </View>
            )}
          </View>

          {/* Image Gallery */}
          {galleryImages.length > 0 && (
            <View style={styles.gallerySection}>
              <Text style={styles.sectionTitle}>Gallery</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.galleryContainer}
              >
                {galleryImages.map((imageUri, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.galleryImageWrapper}
                    activeOpacity={0.9}
                  >
                    <Image source={{ uri: imageUri }} style={styles.galleryImage} resizeMode="cover" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* About Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>
              {description || 'Discover this amazing destination and create unforgettable memories.'}
            </Text>
          </View>

          {/* Tags */}
          {tags && tags.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.tagsContainer}>
                {tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Info Cards */}
          <View style={styles.infoSection}>
            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="location-outline" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{city || region || 'Ethiopia'}</Text>
              </View>
            </View>

            {distance > 0 && (
              <View style={styles.infoCard}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="navigate-outline" size={24} color={COLORS.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Distance</Text>
                  <Text style={styles.infoValue}>{distance} km</Text>
                </View>
              </View>
            )}

            {region && (
              <View style={styles.infoCard}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="map-outline" size={24} color={COLORS.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Region</Text>
                  <Text style={styles.infoValue}>{region}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Price Card */}
          {price && (
            <View style={styles.priceCard}>
              <View style={styles.priceCardContent}>
                <View style={styles.priceInfo}>
                  <Text style={styles.priceLabel}>Starting from</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceValue}>ETB {price}</Text>
                    <Text style={styles.priceNote}>per person</Text>
                  </View>
                </View>
                <View style={styles.priceIconContainer}>
                  <Ionicons name="cash" size={32} color={COLORS.primary} />
                </View>
              </View>
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </View>
      </Animated.ScrollView>

      {/* Sticky Footer */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <View style={styles.footerContent}>
          {price && (
            <View style={styles.footerPrice}>
              <Text style={styles.footerPriceLabel}>From</Text>
              <Text style={styles.footerPriceValue}>ETB {price}</Text>
            </View>
          )}
          <ModernButton
            title={t('bookTrip') || 'Book Trip'}
            onPress={handleBookTrip}
            variant="primary"
            size="large"
            style={styles.bookButton}
            icon="arrow-forward"
            iconPosition="right"
          />
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  scrollContent: {
    paddingBottom: SPACING.lg,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerSafeArea: {
    height: HEADER_HEIGHT,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    height: HEADER_HEIGHT,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
    marginLeft: SPACING.sm,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  heroContainer: {
    height: IMAGE_HEIGHT,
    width: '100%',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  floatingActions: {
    position: 'absolute',
    top: SPACING.lg + 20,
    left: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  floatingButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  floatingButtonActive: {
    backgroundColor: COLORS.accent,
  },
  content: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  titleSection: {
    marginBottom: SPACING.lg,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  titleLeft: {
    flex: 1,
  },
  title: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: FONTS.weights.black,
    color: COLORS.secondary,
    letterSpacing: -1,
    lineHeight: 40,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    flexWrap: 'wrap',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  locationText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.gray,
    fontWeight: FONTS.weights.medium,
    marginLeft: 4,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.gray,
    fontWeight: FONTS.weights.medium,
    marginLeft: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  ratingStars: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  ratingText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.black,
    color: COLORS.secondary,
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    fontWeight: FONTS.weights.medium,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.lg,
  },
  metadataBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  badgeText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.secondary,
    fontWeight: FONTS.weights.medium,
    marginLeft: 6,
    textTransform: 'capitalize',
  },
  gallerySection: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.black,
    color: COLORS.secondary,
    letterSpacing: -0.5,
    marginBottom: SPACING.md,
  },
  galleryContainer: {
    paddingRight: SPACING.md,
  },
  galleryImageWrapper: {
    width: 120,
    height: 120,
    borderRadius: 16,
    marginRight: SPACING.sm,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  section: {
    marginBottom: SPACING.xl,
  },
  description: {
    fontSize: FONTS.sizes.md,
    color: COLORS.gray,
    lineHeight: 24,
    fontWeight: FONTS.weights.regular,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  tagText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.secondary,
    fontWeight: FONTS.weights.medium,
  },
  infoSection: {
    marginBottom: SPACING.xl,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 24,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.medium,
  },
  infoIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    fontWeight: FONTS.weights.medium,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.secondary,
    fontWeight: FONTS.weights.black,
  },
  priceCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    ...SHADOWS.large,
  },
  priceCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceInfo: {
    flex: 1,
  },
  priceLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.white,
    fontWeight: FONTS.weights.medium,
    opacity: 0.9,
    marginBottom: SPACING.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceValue: {
    fontSize: FONTS.sizes.xxxl,
    color: COLORS.white,
    fontWeight: FONTS.weights.black,
    letterSpacing: -1,
    marginRight: SPACING.xs,
  },
  priceNote: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.white,
    fontWeight: FONTS.weights.medium,
    opacity: 0.8,
  },
  priceIconContainer: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSpacer: {
    height: SPACING.md,
  },
  footer: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    ...SHADOWS.large,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  footerPrice: {
    flex: 1,
    marginRight: SPACING.md,
  },
  footerPrice: {
    flex: 1,
  },
  footerPriceLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray,
    fontWeight: FONTS.weights.medium,
    marginBottom: 2,
  },
  footerPriceValue: {
    fontSize: FONTS.sizes.xl,
    color: COLORS.secondary,
    fontWeight: FONTS.weights.black,
    letterSpacing: -0.5,
  },
  bookButton: {
    flex: 2,
  },
});

export default DestinationDetailScreen;
