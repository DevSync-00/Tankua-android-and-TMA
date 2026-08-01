import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  StatusBar,
  RefreshControl,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { getDestinations, getPlaceholderImage } from '../services/database';
import EnhancedDestinationCard from '../components/EnhancedDestinationCard';
import CategoryRibbon from '../components/CategoryRibbon';
import { SkeletonCard } from '../components/SkeletonLoader';
import { deduplicateDestinations, sortByDistance } from '../utils/destinationUtils';

const HomeScreen = ({ navigation }) => {
  const windowDimensions = useWindowDimensions();
  const { t, language } = useLanguage();
  const { user } = useAuth();

  // Safely get width with multiple fallbacks - ensure we always have a valid number
  const width = useMemo(() => {
    const wdWidth = windowDimensions?.width;
    if (wdWidth && typeof wdWidth === 'number' && wdWidth > 0 && !isNaN(wdWidth)) {
      return wdWidth;
    }

    try {
      const dims = Dimensions.get('window');
      const dimsWidth = dims?.width;
      if (dimsWidth && typeof dimsWidth === 'number' && dimsWidth > 0 && !isNaN(dimsWidth)) {
        return dimsWidth;
      }
    } catch (error) {
      // Silently fall through to default
    }

    return 375; // Default width
  }, [windowDimensions]);

  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadDestinations();
  }, []);

  const loadDestinations = async () => {
    try {
      setLoading(true);
      const data = await getDestinations({});

      let transformedDestinations = data.map(destination => ({
        id: destination.id,
        name: destination.name,
        description: destination.description || '',
        region: destination.region || '',
        city: destination.city || '',
        distance: destination.distance || 0,
        images: destination.images || [],
        tags: destination.tags || [],
        category: destination.category || 'other',
        location: destination.location || { lat: 0, lng: 0 },
        rating: destination.rating || 4.5,
        review_count: destination.review_count || 0,
        price: destination.price || null,
        estimated_duration: destination.estimated_duration || null,
        price_range: destination.price_range || (destination.price ? `$${Math.floor(destination.price / 100)}` : null),
        is_verified: Boolean(destination.is_verified),
      }));

      transformedDestinations = deduplicateDestinations(transformedDestinations);
      setDestinations(transformedDestinations);
      setLoading(false);
    } catch (err) {
      console.error('Error loading destinations:', err);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDestinations();
    setRefreshing(false);
  };

  const handleDestinationPress = (destination) => {
    if (navigation && navigation.navigate) {
      navigation.navigate('DestinationDetail', { destination });
    }
  };

  const handleCategoryPress = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  // Filter destinations by category
  const filteredDestinations = selectedCategory === 'all'
    ? destinations
    : destinations.filter(d => String(d.category || '').toLowerCase() === selectedCategory);

  const featuredDestinations = filteredDestinations.slice(0, 6);
  const popularDestinations = filteredDestinations.slice(0, 6).filter(Boolean);
  const showPopularSkeletons = loading && popularDestinations.length === 0;

  // Render featured card - simplified without complex animations
  const renderFeatured = ({ item, index }) => {
    const safeWidth = typeof width === 'number' && width > 0 ? width : 375;
    const cardWidth = safeWidth * 0.8;

    return (
      <View style={[styles.featuredCardWrapper, { width: cardWidth }]}>
        <TouchableOpacity
          style={styles.featuredCard}
          onPress={() => handleDestinationPress(item)}
          activeOpacity={0.9}
        >
          <View style={styles.featuredImageContainer}>
            <Image
              source={{
                uri: (item.images && item.images.length > 0)
                  ? item.images[0]
                  : getPlaceholderImage(item.id, item.name, item.category)
              }}
              style={styles.featuredImage}
            />
            <LinearGradient
              colors={['transparent', 'transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.7)']}
              locations={[0, 0.4, 0.7, 1]}
              style={styles.featuredGradient}
            />
            <View style={styles.featuredContent}>
              <Text style={styles.featuredTitle} numberOfLines={2}>
                {item.name}
              </Text>
              <View style={styles.featuredLocation}>
                <Ionicons name="location" size={14} color={COLORS.white} />
                <Text style={[styles.featuredLocationText, { marginLeft: 4 }]}>{item.city || item.region}</Text>
              </View>
              {item.rating > 0 && (
                <View style={styles.featuredRating}>
                  <Ionicons name="star" size={14} color={COLORS.warning} />
                  <Text style={[styles.featuredRatingText, { marginLeft: 4 }]}>{item.rating.toFixed(1)}</Text>
                </View>
              )}
              {item.price > 0 && (
                <View style={styles.featuredPrice}>
                  <Text style={styles.featuredPriceLabel}>From</Text>
                  <Text style={styles.featuredPriceValue}>ETB {item.price}</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>
              Explore <Text style={styles.headerLocation}>Ethiopia</Text>
            </Text>
            <Text style={styles.headerDate}>
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.mapHeaderBtn}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Map' })}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.primary, '#EAB308']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.mapHeaderBtnGradient}
            >
              <Ionicons name="map" size={18} color={COLORS.white} />
              <Text style={styles.mapHeaderBtnText}>Map</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Category Ribbon */}
        <CategoryRibbon
          onCategoryPress={handleCategoryPress}
          selectedCategory={selectedCategory}
        />

        {/* Featured Section */}
        {featuredDestinations.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredList}
              snapToInterval={(() => {
                const safeWidth = typeof width === 'number' && width > 0 ? width : 375;
                return safeWidth * 0.8 + SPACING.md;
              })()}
              decelerationRate="fast"
              pagingEnabled={false}
            >
              {featuredDestinations.map((item, index) => (
                <React.Fragment key={`featured-${item.id}-${index}`}>
                  {renderFeatured({ item, index })}
                </React.Fragment>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Popular Destinations Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Destinations</Text>
            <TouchableOpacity onPress={() => {
              if (navigation && navigation.navigate) {
                navigation.navigate('Search');
              }
            }}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {/* Standard Grid */}
          <View style={styles.popularGrid}>
            {showPopularSkeletons ? (
              Array.from({ length: 4 }).map((_, index) => {
                const safeWidth = typeof width === 'number' && width > 0 ? width : 375;
                return (
                  <View key={`skeleton-${index}`} style={styles.gridItem}>
                    <SkeletonCard width={(safeWidth - SPACING.md * 3) / 2} height={210} />
                  </View>
                );
              })
            ) : popularDestinations.length > 0 ? (
              popularDestinations.map((item, index) => (
                <View key={`popular-${item.id}-${index}`} style={styles.gridItem}>
                  <EnhancedDestinationCard
                    destination={item}
                    onPress={() => handleDestinationPress(item)}
                    size="small"
                    index={index}
                    containerWidth={width}
                  />
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No destinations found.</Text>
              </View>
            )}
          </View>
        </View>

        {/* How It Works Section */}
        <View style={[styles.section, styles.howItWorksSection]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>How It Works</Text>
          </View>

          <View style={styles.howItWorksContainer}>
            <View style={styles.howItWorksStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Choose Destination</Text>
                <Text style={styles.stepDescription}>
                  Browse and select your desired destination from our curated list
                </Text>
              </View>
            </View>

            <View style={styles.stepConnector}>
              <Ionicons name="arrow-down" size={20} color={COLORS.grayLight} />
            </View>

            <View style={styles.howItWorksStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Select Trip</Text>
                <Text style={styles.stepDescription}>
                  Pick a date, provider, and trip that fits your schedule
                </Text>
              </View>
            </View>

            <View style={styles.stepConnector}>
              <Ionicons name="arrow-down" size={20} color={COLORS.grayLight} />
            </View>

            <View style={styles.howItWorksStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Book & Pay</Text>
                <Text style={styles.stepDescription}>
                  Complete your booking and make secure payment online
                </Text>
              </View>
            </View>

            <View style={styles.stepConnector}>
              <Ionicons name="arrow-down" size={20} color={COLORS.grayLight} />
            </View>

            <View style={styles.howItWorksStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Travel & Enjoy</Text>
                <Text style={styles.stepDescription}>
                  Show your QR code at pickup and enjoy your journey
                </Text>
              </View>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  scrollContent: {
    paddingBottom: SPACING.xl + SPACING.xxl,
  },
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: FONTS.weights.black,
    color: COLORS.secondary,
    letterSpacing: -1,
    marginBottom: SPACING.xs,
  },
  headerLocation: {
    color: '#FF6B6B', // Coral color
  },
  headerDate: {
    fontSize: FONTS.sizes.md,
    color: COLORS.gray,
    fontWeight: FONTS.weights.medium,
  },
  mapHeaderBtn: {
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    marginTop: 2,
    ...SHADOWS.small,
  },
  mapHeaderBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    gap: 6,
  },
  mapHeaderBtnText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
  },
  section: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  howItWorksSection: {
    marginTop: -32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.black,
    color: COLORS.secondary,
    letterSpacing: -0.5,
  },
  seeAllText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: FONTS.weights.bold,
  },
  featuredList: {
    paddingLeft: SPACING.md,
    paddingRight: SPACING.sm,
  },
  featuredCardWrapper: {
    marginRight: SPACING.md,
  },
  featuredCard: {
    width: '100%',
    aspectRatio: 0.8, // 4:5 aspect ratio
    borderRadius: 24,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  featuredImageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  featuredImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  featuredContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
  },
  featuredTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.black,
    color: COLORS.white,
    marginBottom: SPACING.sm,
    lineHeight: 28,
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  featuredLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  featuredLocationText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.white,
    fontWeight: FONTS.weights.medium,
    opacity: 0.9,
  },
  featuredRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  featuredRatingText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.white,
    fontWeight: FONTS.weights.bold,
  },
  featuredPrice: {
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm - 2,
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.xs,
  },
  featuredPriceLabel: {
    fontSize: 9,
    color: COLORS.white,
    fontWeight: FONTS.weights.bold,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  featuredPriceValue: {
    fontSize: FONTS.sizes.md,
    color: COLORS.white,
    fontWeight: FONTS.weights.black,
  },
  popularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    height: 210,
    marginBottom: SPACING.md,
  },
  emptyState: {
    width: '100%',
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    fontWeight: FONTS.weights.medium,
  },
  howItWorksContainer: {
    paddingHorizontal: SPACING.md,
  },
  howItWorksStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  stepNumberText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
  },
  stepContent: {
    flex: 1,
    paddingTop: SPACING.xs,
  },
  stepTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
    color: COLORS.secondary,
    marginBottom: SPACING.xs,
  },
  stepDescription: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    lineHeight: 20,
  },
  stepConnector: {
    alignItems: 'center',
    marginLeft: SPACING.md + 20,
    marginBottom: SPACING.sm,
  },
});

export default HomeScreen;
