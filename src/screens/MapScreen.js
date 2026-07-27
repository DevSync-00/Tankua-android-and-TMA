import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  ScrollView,
  ActivityIndicator,
  Image,
  Dimensions,
  RefreshControl,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import * as Location from 'expo-location';
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
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS, ANIMATIONS } from '../config/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { getDestinations, getPlaceholderImage } from '../services/database';
import { OSM_TILE_URL, getOsmDirectionsUrl } from '../config/osm';
import AnimatedCard from '../components/AnimatedCard';
import ModernButton from '../components/ModernButton';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const MapScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const { t } = useLanguage();
  const mapRef = useRef(null);
  const scrollViewRef = useRef(null);
  
  // State
  const [region, setRegion] = useState({
    latitude: 9.0320, // Addis Ababa default
    longitude: 38.7469,
    latitudeDelta: 5,
    longitudeDelta: 5,
  });
  const [userLocation, setUserLocation] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [nearbyDestinations, setNearbyDestinations] = useState([]);

  // Animation values
  const cardTranslateY = useSharedValue(400);
  const cardOpacity = useSharedValue(0);
  const filterPanelHeight = useSharedValue(0);
  const searchBarOpacity = useSharedValue(1);
  const scrollY = useSharedValue(0);

  // Categories
  const categories = [
    { id: null, label: 'All', icon: 'apps-outline' },
    { id: 'sacred', label: 'Sacred Sites', icon: 'star-outline' },
    { id: 'religious', label: 'Religious Heritage', icon: 'book-outline' },
    { id: 'historical', label: 'Historical', icon: 'library-outline' },
    { id: 'nature', label: 'Nature', icon: 'leaf-outline' },
    { id: 'adventure', label: 'Adventure', icon: 'bicycle-outline' },
    { id: 'cultural', label: 'Cultural', icon: 'people-outline' },
    { id: 'monument', label: 'Monuments', icon: 'location-outline' },
    { id: 'park', label: 'Parks', icon: 'tree-outline' },
    { id: 'museum', label: 'Museums', icon: 'library-outline' },
  ];

  // Memoize filtered destinations to avoid circular dependencies
  const filteredDestinations = useMemo(() => {
    let filtered = [...destinations];

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(d => d.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        d =>
          d.name.toLowerCase().includes(query) ||
          d.city.toLowerCase().includes(query) ||
          d.region.toLowerCase().includes(query) ||
          (d.description && d.description.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [destinations, selectedCategory, searchQuery]);

  useEffect(() => {
    requestLocationPermission();
    loadDestinations();
  }, []);

  useEffect(() => {
    if (selectedDestination) {
      cardTranslateY.value = withSpring(0, ANIMATIONS.spring);
      cardOpacity.value = withTiming(1, { duration: ANIMATIONS.normal });
    } else {
      cardTranslateY.value = withSpring(400, ANIMATIONS.spring);
      cardOpacity.value = withTiming(0, { duration: ANIMATIONS.normal });
    }
  }, [selectedDestination]);

  useEffect(() => {
    if (showFilters) {
      filterPanelHeight.value = withSpring(200, ANIMATIONS.spring);
    } else {
      filterPanelHeight.value = withSpring(0, ANIMATIONS.spring);
    }
  }, [showFilters]);

  useEffect(() => {
    if (userLocation) {
      calculateDistances();
    }
  }, [userLocation, filteredDestinations]);

  // Recenter map to user location when tab is focused
  useFocusEffect(
    React.useCallback(() => {
      if (userLocation && mapRef.current) {
        // Small delay to ensure map is ready
        setTimeout(() => {
          mapRef.current?.animateCamera({
            center: userLocation,
            zoom: 11,
          }, { duration: 600 });
        }, 100);
      } else if (!userLocation) {
        // Request location if we don't have it yet
        requestLocationPermission();
      }
    }, [userLocation])
  );

  const loadDestinations = async () => {
    try {
      setLoading(true);
      const data = await getDestinations({});
      
      const transformedDestinations = data
        .filter(destination => destination.location && typeof destination.location === 'object')
        .map(destination => ({
          id: destination.id,
          name: destination.name,
          city: destination.city || '',
          region: destination.region || '',
          category: destination.category || 'other',
          lat: destination.location?.lat || destination.location?.coordinates?.[1] || 0,
          lng: destination.location?.lng || destination.location?.coordinates?.[0] || 0,
          images: destination.images || [],
          description: destination.description || '',
          rating: destination.rating || 4.5,
          review_count: destination.review_count || 0,
          price: destination.price || null,
          tags: destination.tags || [],
          fullData: destination,
          distance: null, // Will be calculated
        }));
      
      setDestinations(transformedDestinations);
      setLoading(false);
    } catch (error) {
      console.error('Error loading destinations:', error);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDestinations();
    setRefreshing(false);
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const loc = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setUserLocation(loc);
        // Update region state for initial render
        const newRegion = {
          ...loc,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        };
        setRegion(newRegion);
        // Animate smoothly to user location
        if (mapRef.current) {
          mapRef.current.animateCamera({
            center: loc,
            zoom: 11,
          }, { duration: 600 });
        }
      }
    } catch (error) {
      console.log('Error getting location:', error);
    }
  };

  const calculateDistances = () => {
    if (!userLocation) return;

    const destinationsWithDistance = filteredDestinations.map(dest => {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        dest.lat,
        dest.lng
      );
      return { ...dest, distance };
    });

    // Sort by distance and get nearby ones
    const nearby = [...destinationsWithDistance]
      .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity))
      .slice(0, 5);
    
    setNearbyDestinations(nearby);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const handleMarkerPress = (destination) => {
    setSelectedDestination(destination);
    // Animate map smoothly to destination
    if (mapRef.current) {
      mapRef.current.animateCamera({
        center: {
          latitude: destination.lat,
          longitude: destination.lng,
        },
        zoom: 13,
      }, { duration: 600 });
    }
  };

  const handleViewDetails = () => {
    if (selectedDestination && selectedDestination.fullData) {
      navigation.navigate('DestinationDetail', { destination: selectedDestination.fullData });
    }
  };

  const handleGetDirections = () => {
    if (selectedDestination && userLocation) {
      const url = getOsmDirectionsUrl(
        userLocation.latitude,
        userLocation.longitude,
        selectedDestination.lat,
        selectedDestination.lng
      );
      Linking.openURL(url).catch((err) => console.error('Could not open directions:', err));
    }
  };

  const handleRecenter = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateCamera({
        center: userLocation,
        zoom: 11,
      }, { duration: 600 });
    }
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
  };

  const getMarkerColor = (category) => {
    const colors = {
      church: COLORS.primary,
      religious: COLORS.primary,
      sacred: COLORS.primary,
      historical: '#8B4513',
      nature: COLORS.success,
      adventure: COLORS.accent,
      cultural: '#9B59B6',
      monument: '#34495E',
      park: COLORS.success,
      museum: '#3498DB',
    };
    return colors[category] || COLORS.primary;
  };

  const getMarkerIcon = (category) => {
    const icons = {
      church: 'book-outline',
      religious: 'book-outline',
      sacred: 'star-outline',
      historical: 'library-outline',
      nature: 'leaf-outline',
      adventure: 'bicycle-outline',
      cultural: 'people-outline',
      monument: 'location-outline',
      park: 'tree-outline',
      museum: 'library-outline',
    };
    return icons[category] || 'location-outline';
  };

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardTranslateY.value }],
    opacity: cardOpacity.value,
  }));

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      searchBarOpacity.value = interpolate(
        event.contentOffset.y,
        [0, 50],
        [1, 0.7],
        Extrapolate.CLAMP
      );
    },
  });

  const searchBarAnimatedStyle = useAnimatedStyle(() => ({
    opacity: searchBarOpacity.value,
  }));

  if (loading && destinations.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading destinations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
      >
        <UrlTile
          urlTemplate={OSM_TILE_URL}
          maximumZ={19}
          flipY={false}
        />
        {/* User Location Marker */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="Your Location"
            identifier="user-location"
          >
            <Animated.View style={styles.userMarkerContainer}>
              <View style={styles.userMarkerPulse} />
              <View style={styles.userMarker}>
                <Ionicons name="person" size={16} color={COLORS.white} />
              </View>
            </Animated.View>
          </Marker>
        )}

        {/* Destination Markers */}
        {filteredDestinations.map((destination) => {
          const isSelected = selectedDestination?.id === destination.id;
          const markerColor = getMarkerColor(destination.category);
          
          return (
            <Marker
              key={destination.id}
              coordinate={{ latitude: destination.lat, longitude: destination.lng }}
              onPress={() => handleMarkerPress(destination)}
              identifier={destination.id}
            >
              <Animated.View
                style={[
                  styles.markerContainer,
                  isSelected && styles.markerContainerSelected,
                ]}
              >
                <View
                  style={[
                    styles.markerBackground,
                    { backgroundColor: markerColor },
                    isSelected && styles.markerBackgroundSelected,
                  ]}
                >
                  <Ionicons
                    name={getMarkerIcon(destination.category)}
                    size={isSelected ? 22 : 18}
                    color={COLORS.white}
                  />
                </View>
                {isSelected && (
                  <View style={[styles.markerPulse, { borderColor: markerColor }]} />
                )}
              </Animated.View>
            </Marker>
          );
        })}
      </MapView>

      {/* Header with Search */}
      <SafeAreaView style={styles.safeArea} edges={['top']} pointerEvents="box-none">
        <Animated.View style={[styles.header, searchBarAnimatedStyle]}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={COLORS.gray} style={styles.searchIcon} />
            <Text
              style={styles.searchInput}
              onPress={() => setShowFilters(!showFilters)}
            >
              {searchQuery || 'Search destinations...'}
            </Text>
            {searchQuery ? (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color={COLORS.gray} />
              </TouchableOpacity>
            ) : (
              <Ionicons name="options-outline" size={20} color={COLORS.gray} />
            )}
          </View>

          {/* Category Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryContainer}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id || 'all'}
                style={[
                  styles.categoryChip,
                  selectedCategory === category.id && styles.categoryChipActive,
                ]}
                onPress={() => handleCategoryChange(category.id)}
              >
                <Ionicons
                  name={category.icon}
                  size={16}
                  color={selectedCategory === category.id ? COLORS.white : COLORS.primary}
                />
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === category.id && styles.categoryChipTextActive,
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      </SafeAreaView>

      {/* Nearby Destinations Panel */}
      {nearbyDestinations.length > 0 && !selectedDestination && (
        <View style={styles.nearbyPanel}>
          <Text style={styles.nearbyPanelTitle}>Nearby Destinations</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {nearbyDestinations.map((dest) => (
              <TouchableOpacity
                key={dest.id}
                style={styles.nearbyCard}
                onPress={() => handleMarkerPress(dest)}
              >
                <Image
                  source={{
                    uri: (dest.images && dest.images.length > 0)
                      ? dest.images[0]
                      : getPlaceholderImage(dest.id, dest.name, dest.category)
                  }}
                  style={styles.nearbyCardImage}
                />
                <View style={styles.nearbyCardContent}>
                  <Text style={styles.nearbyCardTitle} numberOfLines={1}>
                    {dest.name}
                  </Text>
                  <Text style={styles.nearbyCardDistance}>
                    {dest.distance?.toFixed(1) || '0'} km
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Selected Destination Card */}
      {selectedDestination && (
        <Animated.View style={[styles.selectedCard, cardAnimatedStyle]}>
          <AnimatedCard variant="glass">
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.cardScrollView}
            >
              <View style={styles.cardContent}>
                {/* Image */}
                 <Image
                    source={{
                      uri: (selectedDestination.images && selectedDestination.images.length > 0)
                        ? selectedDestination.images[0]
                        : getPlaceholderImage(selectedDestination.id, selectedDestination.name, selectedDestination.category)
                    }}
                    style={styles.cardImage}
                  />

                {/* Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={styles.cardIcon}>
                      <Ionicons
                        name={getMarkerIcon(selectedDestination.category)}
                        size={28}
                        color={COLORS.primary}
                      />
                    </View>
                    <View style={styles.cardHeaderText}>
                      <Text style={styles.cardTitle} numberOfLines={2}>
                        {selectedDestination.name}
                      </Text>
                      <Text style={styles.cardSubtitle}>
                        {selectedDestination.city}
                        {selectedDestination.region && ` • ${selectedDestination.region}`}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedDestination(null)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close-circle" size={28} color={COLORS.gray} />
                  </TouchableOpacity>
                </View>

                {/* Info Row */}
                <View style={styles.cardInfoRow}>
                  {typeof selectedDestination.rating === 'number' && selectedDestination.rating > 0 && (
                    <View style={styles.cardInfoItem}>
                      <Ionicons name="star" size={16} color={COLORS.primary} />
                      <Text style={styles.cardInfoText}>
                        {selectedDestination.rating.toFixed(1)}
                      </Text>
                    </View>
                  )}
                  {selectedDestination.distance !== null && (
                    <View style={styles.cardInfoItem}>
                      <Ionicons name="location" size={16} color={COLORS.primary} />
                      <Text style={styles.cardInfoText}>
                        {selectedDestination.distance.toFixed(1)} km
                      </Text>
                    </View>
                  )}
                  {selectedDestination.category && (
                    <View style={styles.cardCategoryBadge}>
                      <Text style={styles.cardCategoryText}>
                        {selectedDestination.category}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Description */}
                {selectedDestination.description && (
                  <Text style={styles.cardDescription} numberOfLines={3}>
                    {selectedDestination.description}
                  </Text>
                )}

                {/* Actions */}
                <View style={styles.cardActions}>
                  <ModernButton
                    title="View Details"
                    onPress={handleViewDetails}
                    variant="primary"
                    size="medium"
                    style={styles.cardActionButton}
                    icon="arrow-forward"
                    iconPosition="right"
                  />
                  {userLocation && (
                    <TouchableOpacity
                      style={styles.directionsButton}
                      onPress={handleGetDirections}
                    >
                      <Ionicons name="navigate" size={20} color={COLORS.primary} />
                      <Text style={styles.directionsButtonText}>Directions</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </ScrollView>
          </AnimatedCard>
        </Animated.View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {userLocation && (
          <TouchableOpacity style={styles.actionButton} onPress={handleRecenter}>
            <Ionicons name="locate" size={24} color={COLORS.white} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="filter" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONTS.sizes.md,
    color: COLORS.gray,
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  header: {
    backgroundColor: COLORS.white,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    ...SHADOWS.medium,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    color: COLORS.secondary,
    paddingVertical: SPACING.xs,
  },
  clearButton: {
    marginLeft: SPACING.xs,
  },
  categoryContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    marginRight: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    marginLeft: SPACING.xs,
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: COLORS.white,
  },
  viewModeContainer: {
    position: 'absolute',
    top: 180,
    right: SPACING.md,
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xs,
    ...SHADOWS.medium,
    zIndex: 5,
  },
  viewModeButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: SPACING.xs / 2,
  },
  viewModeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  listViewContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.white,
    zIndex: 20,
  },
  listScrollView: {
    flex: 1,
  },
  listContent: {
    padding: SPACING.md,
    paddingTop: 180,
  },
  listHeader: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '800',
    color: COLORS.secondary,
    marginBottom: SPACING.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyStateText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.secondary,
    marginTop: SPACING.md,
  },
  emptyStateSubtext: {
    fontSize: FONTS.sizes.md,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  listItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.small,
  },
  listItemImage: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundSecondary,
  },
  listItemImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  listItemContent: {
    flex: 1,
    marginLeft: SPACING.md,
    justifyContent: 'center',
  },
  listItemTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: SPACING.xs / 2,
  },
  listItemSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    marginBottom: SPACING.xs,
  },
  listItemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  listItemRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
  },
  listItemRatingText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  listItemDistance: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
  },
  nearbyPanel: {
    position: 'absolute',
    bottom: 110,
    left: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.large,
    zIndex: 15,
    maxHeight: 180,
  },
  nearbyPanelTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: SPACING.sm,
  },
  nearbyCard: {
    width: 140,
    marginRight: SPACING.sm,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  nearbyCardImage: {
    width: '100%',
    height: 80,
    backgroundColor: COLORS.backgroundSecondary,
  },
  nearbyCardImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  nearbyCardIcon: {
    fontSize: 32,
  },
  nearbyCardContent: {
    padding: SPACING.sm,
    minHeight: 50,
  },
  nearbyCardTitle: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: SPACING.xs / 2,
    flexShrink: 1,
  },
  nearbyCardDistance: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray,
  },
  userMarkerContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMarkerPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}30`,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  userMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
    ...SHADOWS.medium,
  },
  markerContainer: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerContainerSelected: {
    zIndex: 1000,
  },
  markerBackground: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
    ...SHADOWS.large,
  },
  markerBackgroundSelected: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 4,
  },
  markerPulse: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  markerIcon: {
    fontSize: 24,
  },
  selectedCard: {
    position: 'absolute',
    bottom: SPACING.md,
    left: SPACING.md,
    right: SPACING.md,
    maxHeight: SCREEN_HEIGHT * 0.6,
    zIndex: 20,
  },
  cardScrollView: {
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
  cardContent: {
    padding: SPACING.lg,
  },
  cardImage: {
    width: '100%',
    height: 200,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.backgroundSecondary,
  },
  cardImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImageIcon: {
    fontSize: 64,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  cardIconText: {
    fontSize: 28,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '800',
    color: COLORS.secondary,
    marginBottom: SPACING.xs,
    letterSpacing: -0.5,
  },
  cardSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    fontWeight: '500',
  },
  closeButton: {
    padding: SPACING.xs,
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  cardInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
  },
  cardInfoText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  cardCategoryBadge: {
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  cardCategoryText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardDescription: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  cardActions: {
    gap: SPACING.sm,
  },
  cardActionButton: {
    width: '100%',
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  directionsButtonText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.primary,
  },
  actionButtons: {
    position: 'absolute',
    bottom: 110,
    right: SPACING.md,
    gap: SPACING.sm,
    zIndex: 15,
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.large,
  },
});

export default MapScreen;
