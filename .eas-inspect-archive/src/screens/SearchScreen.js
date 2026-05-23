import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  useWindowDimensions,
  Dimensions,
  RefreshControl,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { useAuth } from '../contexts/AuthContext';
import { getDestinations } from '../services/database';
import EnhancedDestinationCard from '../components/EnhancedDestinationCard';
import CategoryRibbon from '../components/CategoryRibbon';
import { SkeletonCard } from '../components/SkeletonLoader';
import { deduplicateDestinations } from '../utils/destinationUtils';

const SearchScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const windowDimensions = useWindowDimensions();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('rating'); // rating, distance, price, name
  const [priceRange, setPriceRange] = useState(null); // low, medium, high
  const [minRating, setMinRating] = useState(0);
  const [maxDistance, setMaxDistance] = useState(null);
  const [activeFilters, setActiveFilters] = useState([]);

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
    return 375;
  }, [windowDimensions]);

  useEffect(() => {
    loadRecentSearches();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() || selectedCategory) {
      setIsSearching(true);
      loadDestinations();
      if (searchQuery.trim()) {
        saveRecentSearch(searchQuery.trim());
      }
    } else {
      setIsSearching(false);
      loadPopularDestinations();
    }
  }, [searchQuery, selectedCategory, sortBy, priceRange, minRating, maxDistance]);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem('recentSearches');
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  const saveRecentSearch = async (query) => {
    try {
      const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
      setRecentSearches(updated);
      await AsyncStorage.setItem('recentSearches', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  };

  const clearRecentSearches = async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem('recentSearches');
    } catch (error) {
      console.error('Error clearing recent searches:', error);
    }
  };

  const loadDestinations = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (selectedCategory) {
        filters.category = selectedCategory;
      }
      if (searchQuery.trim()) {
        filters.search = searchQuery.trim();
      }
      
      const data = await getDestinations(filters);
      
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
        estimated_duration: destination.estimated_duration || Math.floor(Math.random() * 8) + 2,
        price_range: destination.price_range || (destination.price ? `$${Math.floor(destination.price / 100)}` : null),
        is_verified: destination.is_verified || Math.random() > 0.3,
      }));
      
      transformedDestinations = deduplicateDestinations(transformedDestinations);
      
      // Apply filters
      let filtered = transformedDestinations;
      
      if (minRating > 0) {
        filtered = filtered.filter(d => (d.rating || 0) >= minRating);
      }
      
      if (maxDistance) {
        filtered = filtered.filter(d => (d.distance || 0) <= maxDistance);
      }
      
      if (priceRange) {
        filtered = filtered.filter(d => {
          const price = d.price || 0;
          if (priceRange === 'low') return price < 500;
          if (priceRange === 'medium') return price >= 500 && price < 1500;
          if (priceRange === 'high') return price >= 1500;
          return true;
        });
      }
      
      // Apply sorting
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'rating':
            return (b.rating || 0) - (a.rating || 0);
          case 'distance':
            return (a.distance || 0) - (b.distance || 0);
          case 'price':
            return (a.price || 0) - (b.price || 0);
          case 'name':
            return (a.name || '').localeCompare(b.name || '');
          default:
            return 0;
        }
      });
      
      // Update active filters
      const filtersList = [];
      if (minRating > 0) filtersList.push(`Rating: ${minRating}+`);
      if (maxDistance) filtersList.push(`Distance: ≤${maxDistance}km`);
      if (priceRange) filtersList.push(`Price: ${priceRange}`);
      if (sortBy !== 'rating') filtersList.push(`Sort: ${sortBy}`);
      setActiveFilters(filtersList);
      
      setDestinations(filtered);
      setLoading(false);
    } catch (err) {
      console.error('Error loading destinations:', err);
      setLoading(false);
    }
  };

  const loadPopularDestinations = async () => {
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
        estimated_duration: destination.estimated_duration || Math.floor(Math.random() * 8) + 2,
        price_range: destination.price_range || (destination.price ? `$${Math.floor(destination.price / 100)}` : null),
        is_verified: destination.is_verified || Math.random() > 0.3,
      }));
      
      transformedDestinations = deduplicateDestinations(transformedDestinations);
      transformedDestinations = transformedDestinations
        .sort((a, b) => {
          const ratingDiff = (b.rating || 0) - (a.rating || 0);
          if (ratingDiff !== 0) return ratingDiff;
          return (b.review_count || 0) - (a.review_count || 0);
        })
        .slice(0, 20);
      setDestinations(transformedDestinations);
      setLoading(false);
    } catch (err) {
      console.error('Error loading popular destinations:', err);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (isSearching) {
      await loadDestinations();
    } else {
      await loadPopularDestinations();
    }
    setRefreshing(false);
  };

  const handleDestinationPress = (destination) => {
    if (navigation && navigation.navigate) {
      navigation.navigate('DestinationDetail', { destination });
    }
  };

  const handleCategoryPress = (categoryId) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSortBy('rating');
    setPriceRange(null);
    setMinRating(0);
    setMaxDistance(null);
    setActiveFilters([]);
  };

  const handleClearFilters = () => {
    setSortBy('rating');
    setPriceRange(null);
    setMinRating(0);
    setMaxDistance(null);
    setActiveFilters([]);
  };

  const quickSearches = [
    'Lalibela', 'Axum', 'Gondar', 'Bahir Dar', 'Harar', 'Simien Mountains'
  ];

  const handleQuickSearch = (query) => {
    setSearchQuery(query);
  };

  const filteredDestinations = destinations;

  const sortOptions = [
    { value: 'rating', label: 'Highest Rated' },
    { value: 'distance', label: 'Nearest First' },
    { value: 'price', label: 'Price: Low to High' },
    { value: 'name', label: 'Name: A to Z' },
  ];

  const priceRanges = [
    { value: 'low', label: 'Budget (<500 ETB)' },
    { value: 'medium', label: 'Moderate (500-1500 ETB)' },
    { value: 'high', label: 'Premium (1500+ ETB)' },
  ];

  const trendingSearches = [
    'Lake Tana', 'Simien Mountains', 'Danakil Depression', 'Bale Mountains',
    'Lalibela Heritage', 'Gondar Castles', 'Axum Obelisks'
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Search</Text>
          </View>
          <TouchableOpacity
            style={styles.mapToggle}
            onPress={() => {
              if (navigation && navigation.navigate) {
                navigation.navigate('Map');
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="map-outline" size={20} color={COLORS.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Prominent Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={22} color={COLORS.primary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search destinations, cities, or experiences..."
            placeholderTextColor={COLORS.gray}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoFocus={false}
          />
          {(searchQuery.length > 0 || selectedCategory) && (
            <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={22} color={COLORS.gray} />
            </TouchableOpacity>
          )}
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
        {!isSearching ? (
          <>
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <View style={styles.quickSearchesSection}>
                <View style={styles.sectionTitleRow}>
                  <Text style={styles.quickSearchesTitle}>Recent Searches</Text>
                  <TouchableOpacity onPress={clearRecentSearches}>
                    <Text style={styles.clearText}>Clear</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.quickSearchesContainer}>
                  {recentSearches.map((search, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.quickSearchChip}
                      onPress={() => handleQuickSearch(search)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="time-outline" size={16} color={COLORS.primary} />
                      <Text style={styles.quickSearchText}>{search}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Trending Searches */}
            <View style={styles.quickSearchesSection}>
              <Text style={styles.quickSearchesTitle}>Trending Now</Text>
              <View style={styles.quickSearchesContainer}>
                {trendingSearches.map((search, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.quickSearchChip, styles.trendingChip]}
                    onPress={() => handleQuickSearch(search)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trending-up" size={16} color={COLORS.accent} />
                    <Text style={styles.quickSearchText}>{search}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Popular Searches */}
            <View style={styles.quickSearchesSection}>
              <Text style={styles.quickSearchesTitle}>Popular Searches</Text>
              <View style={styles.quickSearchesContainer}>
                {quickSearches.map((search, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.quickSearchChip}
                    onPress={() => handleQuickSearch(search)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="star-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.quickSearchText}>{search}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Category Ribbon */}
            <CategoryRibbon
              onCategoryPress={handleCategoryPress}
              selectedCategory={selectedCategory}
            />

            {/* Popular Destinations Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Top Rated</Text>
              </View>

              <View style={styles.destinationsGrid}>
                {loading ? (
                  Array.from({ length: 6 }).map((_, index) => {
                    const safeWidth = typeof width === 'number' && width > 0 ? width : 375;
                    return (
                      <View key={`skeleton-${index}`} style={styles.gridItem}>
                        <SkeletonCard width={(safeWidth - SPACING.md * 3) / 2} height={280} />
                      </View>
                    );
                  })
                ) : filteredDestinations.length > 0 ? (
                  filteredDestinations.map((item, index) => (
                    <View key={`destination-${item.id}-${index}`} style={styles.gridItem}>
                      <EnhancedDestinationCard
                        destination={item}
                        onPress={() => handleDestinationPress(item)}
                        size="small"
                        index={index}
                        containerWidth={width}
                      />
                    </View>
                  ))
                ) : null}
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Category Ribbon */}
            <CategoryRibbon
              onCategoryPress={handleCategoryPress}
              selectedCategory={selectedCategory}
            />

            {/* Active Filters */}
            {activeFilters.length > 0 && (
              <View style={styles.filtersSection}>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filtersContainer}
                >
                  {activeFilters.map((filter, index) => (
                    <View key={index} style={styles.activeFilterChip}>
                      <Text style={styles.activeFilterText}>{filter}</Text>
                    </View>
                  ))}
                  <TouchableOpacity 
                    style={styles.clearFiltersButton}
                    onPress={handleClearFilters}
                  >
                    <Ionicons name="close-circle" size={18} color={COLORS.gray} />
                    <Text style={styles.clearFiltersText}>Clear All</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            )}

            {/* Search Results */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.resultsHeader}>
                  <Text style={styles.sectionTitle}>
                    {filteredDestinations.length > 0 
                      ? `${filteredDestinations.length} ${filteredDestinations.length === 1 ? 'Result' : 'Results'}`
                      : 'No Results'}
                  </Text>
                  <TouchableOpacity 
                    style={styles.filterButton}
                    onPress={() => setShowFilters(true)}
                  >
                    <Ionicons name="options-outline" size={20} color={COLORS.secondary} />
                    <Text style={styles.filterButtonText}>Filters</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.destinationsGrid}>
                {loading ? (
                  Array.from({ length: 6 }).map((_, index) => {
                    const safeWidth = typeof width === 'number' && width > 0 ? width : 375;
                    return (
                      <View key={`skeleton-${index}`} style={styles.gridItem}>
                        <SkeletonCard width={(safeWidth - SPACING.md * 3) / 2} height={280} />
                      </View>
                    );
                  })
                ) : filteredDestinations.length > 0 ? (
                  filteredDestinations.map((item, index) => (
                    <View key={`destination-${item.id}-${index}`} style={styles.gridItem}>
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
                    <Ionicons name="search-outline" size={64} color={COLORS.grayLight} />
                    <Text style={styles.emptyStateTitle}>No results found</Text>
                    <Text style={styles.emptyStateText}>
                      Try adjusting your search or browse by category above.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Sort By */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupTitle}>Sort By</Text>
                {sortOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterOption,
                      sortBy === option.value && styles.filterOptionActive
                    ]}
                    onPress={() => setSortBy(option.value)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      sortBy === option.value && styles.filterOptionTextActive
                    ]}>
                      {option.label}
                    </Text>
                    {sortBy === option.value && (
                      <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Price Range */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupTitle}>Price Range</Text>
                {priceRanges.map((range) => (
                  <TouchableOpacity
                    key={range.value}
                    style={[
                      styles.filterOption,
                      priceRange === range.value && styles.filterOptionActive
                    ]}
                    onPress={() => setPriceRange(priceRange === range.value ? null : range.value)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      priceRange === range.value && styles.filterOptionTextActive
                    ]}>
                      {range.label}
                    </Text>
                    {priceRange === range.value && (
                      <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Minimum Rating */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupTitle}>Minimum Rating</Text>
                <View style={styles.ratingContainer}>
                  {[0, 3, 4, 4.5].map((rating) => (
                    <TouchableOpacity
                      key={rating}
                      style={[
                        styles.ratingOption,
                        minRating === rating && styles.ratingOptionActive
                      ]}
                      onPress={() => setMinRating(rating)}
                    >
                      <Ionicons 
                        name="star" 
                        size={18} 
                        color={minRating === rating ? COLORS.primary : COLORS.grayLight} 
                      />
                      <Text style={[
                        styles.ratingText,
                        minRating === rating && styles.ratingTextActive
                      ]}>
                        {rating === 0 ? 'Any' : `${rating}+`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Max Distance */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupTitle}>Maximum Distance</Text>
                {[null, 100, 200, 500].map((distance) => (
                  <TouchableOpacity
                    key={distance || 'any'}
                    style={[
                      styles.filterOption,
                      maxDistance === distance && styles.filterOptionActive
                    ]}
                    onPress={() => setMaxDistance(distance)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      maxDistance === distance && styles.filterOptionTextActive
                    ]}>
                      {distance ? `Within ${distance}km` : 'Any Distance'}
                    </Text>
                    {maxDistance === distance && (
                      <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={handleClearFilters}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl * 4 + SPACING.xl,
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
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: FONTS.weights.black,
    color: COLORS.secondary,
    letterSpacing: -1,
  },
  mapToggle: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  searchSection: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...SHADOWS.medium,
  },
  searchIcon: {
    marginRight: SPACING.md,
  },
  searchInput: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    color: COLORS.secondary,
    fontWeight: FONTS.weights.medium,
    padding: 0,
  },
  clearButton: {
    marginLeft: SPACING.sm,
    padding: SPACING.xs,
  },
  quickSearchesSection: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  quickSearchesTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.black,
    color: COLORS.secondary,
    marginBottom: SPACING.md,
    letterSpacing: -0.3,
  },
  quickSearchesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quickSearchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.small,
  },
  quickSearchText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.secondary,
    fontWeight: FONTS.weights.medium,
    marginLeft: SPACING.xs,
  },
  section: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
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
  destinationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    minHeight: 280,
    marginBottom: SPACING.md,
  },
  emptyState: {
    width: '100%',
    paddingVertical: SPACING.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.black,
    color: COLORS.secondary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptyStateText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.gray,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
    lineHeight: 22,
  },
  bottomSpacer: {
    height: SPACING.xxl * 4 + SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  clearText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: FONTS.weights.medium,
  },
  trendingChip: {
    borderColor: COLORS.accent,
    backgroundColor: `${COLORS.accent}10`,
  },
  filtersSection: {
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  filtersContainer: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
  },
  activeFilterText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.white,
    fontWeight: FONTS.weights.medium,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  clearFiltersText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    fontWeight: FONTS.weights.medium,
    marginLeft: SPACING.xs,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
  },
  filterButtonText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.secondary,
    fontWeight: FONTS.weights.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '80%',
    paddingBottom: SPACING.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.black,
    color: COLORS.secondary,
  },
  modalBody: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  filterGroup: {
    marginBottom: SPACING.xl,
  },
  filterGroupTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.secondary,
    marginBottom: SPACING.md,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.backgroundSecondary,
  },
  filterOptionActive: {
    backgroundColor: `${COLORS.primary}15`,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  filterOptionText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.secondary,
    fontWeight: FONTS.weights.medium,
  },
  filterOptionTextActive: {
    color: COLORS.primary,
    fontWeight: FONTS.weights.bold,
  },
  ratingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  ratingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.xs,
  },
  ratingOptionActive: {
    backgroundColor: `${COLORS.primary}15`,
    borderColor: COLORS.primary,
  },
  ratingText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    fontWeight: FONTS.weights.medium,
  },
  ratingTextActive: {
    color: COLORS.primary,
    fontWeight: FONTS.weights.bold,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    gap: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  resetButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  resetButtonText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.secondary,
    fontWeight: FONTS.weights.bold,
  },
  applyButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.white,
    fontWeight: FONTS.weights.bold,
  },
});

export default SearchScreen;
