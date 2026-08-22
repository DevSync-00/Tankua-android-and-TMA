import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  ScrollView,
  ActivityIndicator,
  Image,
  Dimensions,
  RefreshControl,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import OsmMapView from '../components/OsmMapView';
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
import { getPlaceholderImage } from '../services/database';
import {
  getDestinationsSWR,
  subscribeDestinationUpdates,
  getInstantCachedDestinations
} from '../services/destinationCache';
import { OSM_TILE_URL, getOsmDirectionsUrl, fetchOsmRoute } from '../config/osm';
import AnimatedCard from '../components/AnimatedCard';
import ModernButton from '../components/ModernButton';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const transformMapItems = (rawList) =>
  (rawList || [])
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
      distance: null,
    }));

const MapScreen = ({ navigation, route }) => {
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
  const initialCache = getInstantCachedDestinations();
  const [destinations, setDestinations] = useState(transformMapItems(initialCache));
  const [loading, setLoading] = useState(initialCache.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [nearbyDestinations, setNearbyDestinations] = useState([]);
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  useEffect(() => {
    setTracksViewChanges(true);
    const timer = setTimeout(() => setTracksViewChanges(false), 600);
    return () => clearTimeout(timer);
  }, [destinations, selectedDestination, selectedCategory]);

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

  const loadDestinations = async (forceRefresh = false) => {
    try {
      const { data } = await getDestinationsSWR({ forceRefresh });
      setDestinations(transformMapItems(data));
    } catch (error) {
      console.error('Error loading destinations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    requestLocationPermission();
    loadDestinations();
    const unsubscribe = subscribeDestinationUpdates((freshData) => {
      setDestinations(transformMapItems(freshData));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (selectedDestination) {
      cardTranslateY.value = withTiming(0, { duration: 250 });
      cardOpacity.value = withTiming(1, { duration: 250 });
    } else {
      cardTranslateY.value = withTiming(400, { duration: 200 });
      cardOpacity.value = withTiming(0, { duration: 180 });
    }
  }, [selectedDestination]);

  useEffect(() => {
    if (showFilters) {
      filterPanelHeight.value = withTiming(200, { duration: 220 });
    } else {
      filterPanelHeight.value = withTiming(0, { duration: 180 });
    }
  }, [showFilters]);

  useEffect(() => {
    if (userLocation) {
      calculateDistances();
    }
  }, [userLocation, filteredDestinations]);

  // Request location permission on focus if not granted yet
  useFocusEffect(
    React.useCallback(() => {
      if (!userLocation) {
        requestLocationPermission();
      }
    }, [userLocation])
  );

  // Handle incoming targetDestination and showDirections from DestinationDetailScreen
  useFocusEffect(
    React.useCallback(() => {
      const target = route?.params?.targetDestination;
      const showDirections = route?.params?.showDirections;

      if (target && target.lat && target.lng) {
        setSelectedDestination(target);
        
        const newRegion = {
          latitude: target.lat,
          longitude: target.lng,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        };
        setRegion(newRegion);
        if (mapRef.current) {
          mapRef.current.animateToRegion(newRegion, 500);
        }

        if (showDirections && userLocation) {
          fetchOsmRoute(userLocation.latitude, userLocation.longitude, target.lat, target.lng)
            .then((routeData) => {
              if (routeData && routeData.coordinates.length > 0) {
                setRouteCoordinates(routeData.coordinates);
                setRouteInfo({
                  destinationName: target.name,
                  distanceKm: routeData.distanceKm,
                  durationMin: routeData.durationMin,
                });
                if (mapRef.current) {
                  mapRef.current.fitToCoordinates(routeData.coordinates, {
                    edgePadding: { top: 140, right: 60, bottom: 220, left: 60 },
                    animated: true,
                  });
                }
              }
            })
            .catch((err) => console.log('Error calculating incoming route:', err));
        }
      }
    }, [route?.params, userLocation])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDestinations(true);
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
    if (mapRef.current && destination.lat && destination.lng) {
      mapRef.current.animateToRegion({
        latitude: destination.lat,
        longitude: destination.lng,
        latitudeDelta: 0.2,
        longitudeDelta: 0.2,
      }, 300);
    }
  };

  const handleViewDetails = () => {
    if (selectedDestination && selectedDestination.fullData) {
      navigation.navigate('DestinationDetail', { destination: selectedDestination.fullData });
    }
  };

  const handleGetDirections = async () => {
    if (selectedDestination && userLocation) {
      try {
        setLoadingRoute(true);
        const routeData = await fetchOsmRoute(
          userLocation.latitude,
          userLocation.longitude,
          selectedDestination.lat,
          selectedDestination.lng
        );
        setLoadingRoute(false);

        if (routeData && routeData.coordinates.length > 0) {
          setRouteCoordinates(routeData.coordinates);
          setRouteInfo({
            destinationName: selectedDestination.name,
            distanceKm: routeData.distanceKm,
            durationMin: routeData.durationMin,
          });

          // Automatically fit camera bounds to show entire route
          if (mapRef.current) {
            mapRef.current.fitToCoordinates(routeData.coordinates, {
              edgePadding: { top: 140, right: 60, bottom: 220, left: 60 },
              animated: true,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching in-app route:', error);
        setLoadingRoute(false);
      }
    }
  };

  const formatDurationText = (mins) => {
    const m = Number(mins);
    if (isNaN(m) || m <= 0) return 'Approx drive';
    if (m < 60) return `Approx ${m} mins drive`;
    const hrs = Math.floor(m / 60);
    const remainingMins = Math.round(m % 60);
    if (remainingMins === 0) return `Approx ${hrs} hr${hrs > 1 ? 's' : ''} drive`;
    return `Approx ${hrs} hr${hrs > 1 ? 's' : ''} ${remainingMins} min${remainingMins > 1 ? 's' : ''} drive`;
  };

  const handleClearRoute = () => {
    setRouteCoordinates([]);
    setRouteInfo(null);
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
      <OsmMapView
        style={styles.map}
        region={region}
        destinations={filteredDestinations}
        routeCoordinates={routeCoordinates}
        userLocation={userLocation}
        selectedDestination={selectedDestination}
        onMarkerPress={handleMarkerPress}
        onMapPress={() => setSelectedDestination(null)}
      />

      {/* Header with Search */}
      <SafeAreaView style={styles.safeArea} edges={['top']} pointerEvents="box-none">
        <Animated.View style={[styles.header, searchBarAnimatedStyle]}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={COLORS.gray} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search destinations..."
              placeholderTextColor={COLORS.gray}
              returnKeyType="search"
            />
            {searchQuery ? (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color={COLORS.gray} />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              onPress={() => setShowFilters(!showFilters)}
              style={styles.filterIconButton}
              activeOpacity={0.7}
            >
              <Ionicons
                name={showFilters ? "options" : "options-outline"}
                size={20}
                color={showFilters ? COLORS.primary : COLORS.gray}
              />
            </TouchableOpacity>
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

      {/* Active Route Info Banner */}
      {routeInfo && (
        <View style={styles.routeBannerCard}>
          <View style={styles.routeBannerLeft}>
            <View style={styles.routeIconCircle}>
              <Ionicons name="navigate-circle" size={24} color={COLORS.white} />
            </View>
            <View style={styles.routeBannerTextCol}>
              <Text style={styles.routeBannerTitle} numberOfLines={1}>
                Route to {routeInfo.destinationName}
              </Text>
              <Text style={styles.routeBannerSubtitle}>
                {routeInfo.distanceKm} km • {formatDurationText(routeInfo.durationMin)}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.clearRouteBtn}
            onPress={handleClearRoute}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle" size={15} color="#DC2626" />
            <Text style={styles.clearRouteText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

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
                    {dest.distance != null && !isNaN(Number(dest.distance)) ? Number(dest.distance).toFixed(1) : '0'} km
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
            <View style={styles.compactCardContent}>
              {/* Header Row */}
              <View style={styles.compactHeaderRow}>
                {/* Thumbnail Image */}
                <Image
                  source={{
                    uri: (selectedDestination.images && selectedDestination.images.length > 0)
                      ? selectedDestination.images[0]
                      : getPlaceholderImage(selectedDestination.id, selectedDestination.name, selectedDestination.category)
                  }}
                  style={styles.compactCardImage}
                />

                {/* Details Col */}
                <View style={styles.compactDetailsCol}>
                  <Text style={styles.compactTitle} numberOfLines={1}>
                    {selectedDestination.name}
                  </Text>
                  <Text style={styles.compactSubtitle} numberOfLines={1}>
                    {selectedDestination.city}
                    {selectedDestination.region && ` • ${selectedDestination.region}`}
                  </Text>
                  
                  {/* Meta Badges Row */}
                  <View style={styles.compactMetaRow}>
                    {selectedDestination.rating != null && (
                      <View style={styles.compactBadge}>
                        <Ionicons name="star" size={12} color={COLORS.primary} />
                        <Text style={styles.compactBadgeText}>
                          {Number(selectedDestination.rating || 4.8).toFixed(1)}
                        </Text>
                      </View>
                    )}
                    {selectedDestination.distance != null && !isNaN(Number(selectedDestination.distance)) && (
                      <View style={styles.compactBadge}>
                        <Ionicons name="location-outline" size={12} color={COLORS.primary} />
                        <Text style={styles.compactBadgeText}>
                          {Number(selectedDestination.distance).toFixed(1)} km
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Close Button */}
                <TouchableOpacity
                  onPress={() => setSelectedDestination(null)}
                  style={styles.compactCloseButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={24} color={COLORS.gray} />
                </TouchableOpacity>
              </View>

              {/* Action Buttons Row */}
              <View style={styles.compactActionsRow}>
                <ModernButton
                  title="View Details"
                  onPress={handleViewDetails}
                  variant="primary"
                  size="small"
                  style={styles.compactActionButton}
                  icon="arrow-forward"
                  iconPosition="right"
                />
                {userLocation && (
                  <TouchableOpacity
                    style={styles.compactDirectionsButton}
                    onPress={handleGetDirections}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="navigate" size={16} color={COLORS.secondary} />
                    <Text style={styles.compactDirectionsText}>Directions</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
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
  routeBannerCard: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 195 : 185,
    left: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 12,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    ...SHADOWS.large,
  },
  routeBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.xs,
  },
  routeIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  routeBannerTextCol: {
    flex: 1,
  },
  routeBannerTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  routeBannerSubtitle: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray,
    fontWeight: '600',
  },
  clearRouteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full,
    gap: 4,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  clearRouteText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    color: '#DC2626',
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
    paddingVertical: Platform.OS === 'ios' ? SPACING.xs : 0,
    height: 38,
  },
  clearButton: {
    padding: 2,
    marginRight: 4,
  },
  filterIconButton: {
    padding: 4,
    marginLeft: 2,
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
  markerCanvasBuffer: {
    width: 190,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  markerCanvasBufferSelected: {
    zIndex: 1000,
    width: 210,
    height: 64,
  },
  unifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: COLORS.secondary,
    maxWidth: 180,
    gap: 6,
    ...SHADOWS.medium,
  },
  unifiedPillSelected: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.primary,
    borderWidth: 2,
    maxWidth: 200,
    paddingHorizontal: 10,
    paddingVertical: 6,
    ...SHADOWS.large,
  },
  pillIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillTitleText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '800',
    color: COLORS.secondary,
    includeFontPadding: false,
    maxWidth: 135,
  },
  pillTitleTextSelected: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: '800',
    maxWidth: 145,
  },
  pillPointerStem: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    alignSelf: 'center',
    marginTop: -1,
  },
  markerIcon: {
    fontSize: 24,
  },
  selectedCard: {
    position: 'absolute',
    bottom: 95,
    left: SPACING.md,
    right: SPACING.md,
    zIndex: 20,
  },
  compactCardContent: {
    padding: SPACING.md,
  },
  compactHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  compactCardImage: {
    width: 70,
    height: 70,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundSecondary,
    marginRight: SPACING.md,
  },
  compactDetailsCol: {
    flex: 1,
    justifyContent: 'center',
  },
  compactTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '800',
    color: COLORS.secondary,
    marginBottom: 2,
  },
  compactSubtitle: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray,
    marginBottom: 6,
  },
  compactMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  compactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.sm,
  },
  compactBadgeText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  compactCloseButton: {
    padding: 2,
    alignSelf: 'flex-start',
  },
  compactActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: 4,
  },
  compactActionButton: {
    flex: 1,
  },
  compactDirectionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1.5,
    borderColor: COLORS.secondary,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    gap: 4,
  },
  compactDirectionsText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    color: COLORS.secondary,
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
