import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  TextInput,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import MapView, { Marker, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
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
import { useBooking } from '../contexts/BookingContext';
import { useAuth } from '../contexts/AuthContext';
import { getDestinations } from '../services/database';
import { validateProfile, getProfileIncompleteMessage } from '../utils/profileValidation';
import AnimatedCard from '../components/AnimatedCard';
import ModernButton from '../components/ModernButton';
import CategoryRibbon from '../components/CategoryRibbon';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const MapScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const { t } = useLanguage();
  const { updateBooking } = useBooking();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  const scrollViewRef = useRef(null);
  
  // Calculate bottom padding to account for tab bar (70px height + bottom inset + padding)
  const tabBarHeight = 70;
  const tabBarBottomPadding = Math.max(insets.bottom, SPACING.md);
  const tabBarTopPadding = SPACING.sm;
  const totalTabBarSpace = tabBarHeight + tabBarBottomPadding + tabBarTopPadding + SPACING.md;
  
  // Calculate header height for view mode toggle positioning
  // Header: safe area top + header paddingTop (sm) + search container (~40) + margin (sm) + category container (~40) + header paddingBottom (md)
  const headerHeight = insets.top + SPACING.sm + 40 + SPACING.sm + 40 + SPACING.md;
  
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
  const [selectedCategory, setSelectedCategory] = useState(null); // null = show all categories
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'list'
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

    // Filter by category (only if a category is explicitly selected)
    if (selectedCategory !== null && selectedCategory !== undefined) {
      filtered = filtered.filter(d => d.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        d =>
          (d.name && d.name.toLowerCase().includes(query)) ||
          (d.city && d.city.toLowerCase().includes(query)) ||
          (d.region && d.region.toLowerCase().includes(query)) ||
          (d.description && d.description.toLowerCase().includes(query)) ||
          (d.tags && Array.isArray(d.tags) && d.tags.some(tag => tag && tag.toLowerCase().includes(query)))
      );
    }

    return filtered;
  }, [destinations, selectedCategory, searchQuery]);

  useEffect(() => {
    // Load destinations and request location in parallel
    const loadData = async () => {
      await Promise.all([
        loadDestinations(),
        requestLocationPermission(),
      ]);
    };
    loadData();
  }, [loadDestinations, requestLocationPermission]);

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

  // Calculate distances only when userLocation changes (not on every filter change)
  useEffect(() => {
    if (userLocation && destinations.length > 0) {
      const cleanup = calculateDistances();
      return cleanup;
    } else {
      setNearbyDestinations([]);
    }
  }, [userLocation, destinations.length, calculateDistances]); // Only depend on userLocation and destinations count

  // Recenter map to user location when tab is focused
  useFocusEffect(
    React.useCallback(() => {
      if (userLocation && mapRef.current) {
        // Small delay to ensure map is ready
        setTimeout(() => {
          mapRef.current?.animateToRegion({
            ...userLocation,
            latitudeDelta: 0.5,
            longitudeDelta: 0.5,
          }, 500);
        }, 100);
      } else if (!userLocation) {
        // Request location if we don't have it yet
        requestLocationPermission();
      }
    }, [userLocation])
  );

  const loadDestinations = useCallback(async () => {
    try {
      setLoading(true);
      // Explicitly load ALL destinations without any category filter
      // Pass empty object to ensure no filters are applied
      const data = await getDestinations({});
      
      if (!data || !Array.isArray(data)) {
        console.warn('getDestinations returned invalid data:', data);
        setDestinations([]);
        setLoading(false);
        return;
      }
      
      // Transform destinations efficiently - include ALL categories
      const transformedDestinations = data
        .filter(destination => {
          // Only include destinations with valid coordinates
          if (!destination.location || typeof destination.location !== 'object') {
            return false;
          }
          const lat = destination.location?.lat || destination.location?.coordinates?.[1];
          const lng = destination.location?.lng || destination.location?.coordinates?.[0];
          return lat && lng && lat !== 0 && lng !== 0;
        })
        .map(destination => ({
          id: destination.id,
          name: destination.name,
          city: destination.city || '',
          region: destination.region || '',
          category: destination.category || 'other', // Preserve original category
          lat: destination.location?.lat || destination.location?.coordinates?.[1] || 0,
          lng: destination.location?.lng || destination.location?.coordinates?.[0] || 0,
          images: destination.images || [],
          description: destination.description || '',
          rating: destination.rating || 4.5,
          review_count: destination.review_count || 0,
          price: destination.price || null,
          tags: destination.tags || [],
          fullData: destination,
          distance: null, // Will be calculated lazily
        }));
      
      // Log for debugging - remove in production
      const categoryCounts = transformedDestinations.reduce((acc, d) => {
        acc[d.category] = (acc[d.category] || 0) + 1;
        return acc;
      }, {});
      console.log('Loaded destinations by category:', categoryCounts);
      
      setDestinations(transformedDestinations);
      setLoading(false);
    } catch (error) {
      console.error('Error loading destinations:', error);
      setDestinations([]);
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDestinations();
    setRefreshing(false);
  }, [loadDestinations]);

  const requestLocationPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          maximumAge: 60000, // Use cached location if less than 1 minute old
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
        setRegion(prev => ({ ...prev, ...newRegion }));
        // Animate to user location
        if (mapRef.current) {
          mapRef.current.animateToRegion(newRegion, 500);
        }
      }
    } catch (error) {
      console.log('Error getting location:', error);
    }
  }, []);

  // Memoize distance calculation function
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
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
  }, []);

  // Optimized distance calculation - only update when userLocation changes
  const calculateDistances = useCallback(() => {
    if (!userLocation || destinations.length === 0) {
      setNearbyDestinations([]);
      return;
    }

    // Use setTimeout to defer heavy calculations
    const timeoutId = setTimeout(() => {
      // Calculate distances for all destinations (only if not already calculated)
      const destinationsWithDistance = destinations
        .filter(dest => dest.lat && dest.lng && dest.lat !== 0 && dest.lng !== 0)
        .map(dest => {
          // Only calculate if distance hasn't been calculated yet
          if (dest.distance !== null && dest.distance !== undefined) {
            return dest;
          }
          const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            dest.lat,
            dest.lng
          );
          return { ...dest, distance };
        });

      // Batch state update - only update if distances actually changed
      setDestinations(prev => {
        let hasChanges = false;
        const updated = prev.map(dest => {
          const updatedDest = destinationsWithDistance.find(d => d.id === dest.id);
          if (updatedDest && updatedDest.distance !== dest.distance) {
            hasChanges = true;
            return { ...dest, distance: updatedDest.distance };
          }
          return dest;
        });
        return hasChanges ? updated : prev;
      });
    }, 100); // Small delay to batch updates

    return () => clearTimeout(timeoutId);
  }, [userLocation, destinations, calculateDistance]);

  // Separate effect for nearby destinations - updates when filteredDestinations changes
  useEffect(() => {
    if (destinations.length === 0) {
      setNearbyDestinations([]);
      return;
    }

    // Get nearby destinations from filtered list (only if distances are already calculated)
    const nearby = filteredDestinations
      .filter(d => {
        return d.distance !== null && d.distance !== undefined && d.distance <= 50;
      })
      .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity))
      .slice(0, 5);
    
    setNearbyDestinations(nearby);
  }, [filteredDestinations, destinations]);



  const handleMarkerPress = useCallback((destination) => {
    setSelectedDestination(destination);
    // Animate map to destination
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: destination.lat,
        longitude: destination.lng,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      }, 500);
    }
  }, []);

  const handleViewDetails = useCallback(() => {
    if (selectedDestination && selectedDestination.fullData) {
      navigation.navigate('DestinationDetail', { destination: selectedDestination.fullData });
    }
  }, [selectedDestination, navigation]);

  const handleGetDirections = useCallback(async () => {
    if (selectedDestination) {
      const destination = `${selectedDestination.lat},${selectedDestination.lng}`;
      const url = userLocation
        ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${destination}`
        : `https://www.google.com/maps/search/?api=1&query=${destination}`;
      
      try {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Unable to open maps application');
        }
      } catch (error) {
        console.error('Error opening directions:', error);
        Alert.alert('Error', 'Failed to open directions');
      }
    }
  }, [selectedDestination, userLocation]);

  const handleBookTrip = useCallback(() => {
    if (!selectedDestination) return;

    // Validate profile before allowing booking
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

    // Set destination in booking context and navigate to booking flow
    updateBooking({ destination: selectedDestination.fullData || selectedDestination });
    navigation.navigate('BookingFlow', { screen: 'SelectTrip' });
  }, [selectedDestination, user, updateBooking, navigation]);

  const handleRecenter = useCallback(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      }, 500);
    }
  }, [userLocation]);

  const handleCategoryChange = useCallback((categoryId) => {
    // categoryId can be null for "All" category - this shows all destinations
    setSelectedCategory(categoryId);
  }, []);

  const getMarkerColor = (category) => {
    const colors = {
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
      religious: '🕌',
      sacred: '⭐',
      historical: '🏛️',
      nature: '🌲',
      adventure: '🚴',
      cultural: '🎭',
      monument: '🗿',
      park: '🌳',
      museum: '🏛️',
    };
    return icons[category] || '📍';
  };

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardTranslateY.value }],
    opacity: cardOpacity.value,
  }));

  const filterPanelStyle = useAnimatedStyle(() => ({
    height: filterPanelHeight.value,
    opacity: interpolate(
      filterPanelHeight.value,
      [0, 200],
      [0, 1],
      Extrapolate.CLAMP
    ),
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
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        mapType="standard"
        customMapStyle={[]}
        loadingEnabled={true}
        loadingIndicatorColor={COLORS.primary}
        moveOnMarkerPress={false}
        pitchEnabled={false}
        rotateEnabled={false}
        cacheEnabled={true}
        maxZoomLevel={18}
        minZoomLevel={5}
      >
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

        {/* Destination Markers - Only render visible markers */}
        {filteredDestinations
          .filter(destination => destination.lat && destination.lng && destination.lat !== 0 && destination.lng !== 0)
          .slice(0, 100) // Limit markers for performance
          .map((destination) => {
            const isSelected = selectedDestination?.id === destination.id;
            const markerColor = getMarkerColor(destination.category);
            
            return (
              <Marker
                key={destination.id}
                coordinate={{ latitude: destination.lat, longitude: destination.lng }}
                title={destination.name}
                description={destination.city}
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
                    <Text style={styles.markerIcon}>
                      {getMarkerIcon(destination.category)}
                    </Text>
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
            <TextInput
              style={styles.searchInput}
              placeholder="Search destinations..."
              placeholderTextColor={COLORS.grayLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery ? (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color={COLORS.gray} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => setShowFilters(!showFilters)}
                style={styles.filterButton}
              >
                <Ionicons name="options-outline" size={20} color={COLORS.gray} />
              </TouchableOpacity>
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

      {/* View Mode Toggle - Always visible and accessible */}
      <View style={[styles.viewModeContainer, { top: headerHeight, zIndex: viewMode === 'list' ? 25 : 5 }]}>
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'map' && styles.viewModeButtonActive]}
          onPress={() => setViewMode('map')}
        >
          <Ionicons
            name="map"
            size={20}
            color={viewMode === 'map' ? COLORS.white : COLORS.primary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeButtonActive]}
          onPress={() => setViewMode('list')}
        >
          <Ionicons
            name="list"
            size={20}
            color={viewMode === 'list' ? COLORS.white : COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      {/* List View */}
      {viewMode === 'list' && (
        <Animated.View style={styles.listViewContainer}>
          {/* Header for List View */}
          <SafeAreaView style={styles.listViewHeader} edges={['top']}>
            <View style={styles.listViewHeaderContent}>
              <View>
                <Text style={styles.listViewTitle}>Destinations</Text>
                <Text style={styles.listViewSubtitle}>
                  {filteredDestinations.length} {filteredDestinations.length === 1 ? 'place' : 'places'} to explore
                </Text>
              </View>
            </View>
          </SafeAreaView>

          <Animated.ScrollView
            ref={scrollViewRef}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            style={styles.listScrollView}
            contentContainerStyle={[styles.listContent, { paddingBottom: totalTabBarSpace }]}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {(() => {
              const displayDestinations = filteredDestinations;
              return (
                <>
                  {displayDestinations.length === 0 ? (
                    <View style={styles.emptyState}>
                      <View style={styles.emptyStateIconContainer}>
                        <Ionicons name="map-outline" size={80} color={COLORS.primary} />
                      </View>
                      <Text style={styles.emptyStateText}>No destinations found</Text>
                      <Text style={styles.emptyStateSubtext}>
                        Try adjusting your filters or search query
                      </Text>
                      <TouchableOpacity
                        style={styles.emptyStateButton}
                        onPress={() => {
                          setSearchQuery('');
                          setSelectedCategory(null);
                        }}
                      >
                        <Text style={styles.emptyStateButtonText}>Clear Filters</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    displayDestinations.map((destination, index) => {
                      const markerColor = getMarkerColor(destination.category);
                      return (
                        <TouchableOpacity
                          key={destination.id}
                          style={styles.listItem}
                          onPress={() => {
                            handleMarkerPress(destination);
                            setViewMode('map');
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.listItemImageContainer, { borderColor: markerColor + '30' }]}>
                            {destination.images && destination.images.length > 0 ? (
                              <Image
                                source={{ uri: destination.images[0] }}
                                style={styles.listItemImage}
                              />
                            ) : (
                              <View style={[styles.listItemImage, styles.listItemImagePlaceholder, { backgroundColor: markerColor + '15' }]}>
                                <Text style={styles.listItemImageIcon}>{getMarkerIcon(destination.category)}</Text>
                              </View>
                            )}
                            <View style={[styles.listItemCategoryBadge, { backgroundColor: markerColor }]}>
                              <Ionicons 
                                name={categories.find(c => c.id === destination.category)?.icon || 'location-outline'} 
                                size={12} 
                                color={COLORS.white} 
                              />
                            </View>
                          </View>
                          <View style={styles.listItemContent}>
                            <Text style={styles.listItemTitle} numberOfLines={2}>
                              {destination.name}
                            </Text>
                            <View style={styles.listItemLocation}>
                              <Ionicons name="location" size={14} color={COLORS.gray} />
                              <Text style={styles.listItemSubtitle} numberOfLines={1}>
                                {destination.city} {destination.region ? `• ${destination.region}` : ''}
                              </Text>
                            </View>
                            <View style={styles.listItemFooter}>
                              <View style={styles.listItemRating}>
                                <Ionicons name="star" size={16} color={COLORS.primary} />
                                <Text style={styles.listItemRatingText}>
                                  {destination.rating?.toFixed(1) || '4.5'}
                                </Text>
                                {destination.review_count > 0 && (
                                  <Text style={styles.listItemReviewCount}>
                                    ({destination.review_count})
                                  </Text>
                                )}
                              </View>
                              {destination.distance !== null && destination.distance !== undefined && (
                                <View style={styles.listItemDistanceContainer}>
                                  <Ionicons name="navigate" size={14} color={COLORS.primary} />
                                  <Text style={styles.listItemDistance}>
                                    {destination.distance.toFixed(1)} km
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                          <View style={styles.listItemActions}>
                            <TouchableOpacity
                              style={styles.listItemBookButton}
                              onPress={(e) => {
                                e.stopPropagation();
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
                                updateBooking({ destination: destination.fullData || destination });
                                navigation.navigate('BookingFlow', { screen: 'SelectTrip' });
                              }}
                              activeOpacity={0.7}
                            >
                              <Ionicons name="bus" size={16} color={COLORS.primary} />
                            </TouchableOpacity>
                            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )
                }
                </>
              );
            })()}
          </Animated.ScrollView>
        </Animated.View>
      )}

      {/* Nearby Destinations Panel */}
      {viewMode === 'map' && nearbyDestinations.length > 0 && !selectedDestination && (
        <Animated.View style={[styles.nearbyPanel, { bottom: totalTabBarSpace }]}>
          <Text style={styles.nearbyPanelTitle}>Nearby Destinations</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {nearbyDestinations.map((dest) => (
              <TouchableOpacity
                key={dest.id}
                style={styles.nearbyCard}
                onPress={() => handleMarkerPress(dest)}
              >
                {dest.images && dest.images.length > 0 ? (
                  <Image source={{ uri: dest.images[0] }} style={styles.nearbyCardImage} />
                ) : (
                  <View style={[styles.nearbyCardImage, styles.nearbyCardImagePlaceholder]}>
                    <Text style={styles.nearbyCardIcon}>{getMarkerIcon(dest.category)}</Text>
                  </View>
                )}
                <View style={styles.nearbyCardContent}>
                  <Text style={styles.nearbyCardTitle} numberOfLines={1}>
                    {dest.name}
                  </Text>
                  {dest.distance !== null && dest.distance !== undefined ? (
                    <Text style={styles.nearbyCardDistance}>
                      {dest.distance.toFixed(1)} km
                    </Text>
                  ) : (
                    <Text style={styles.nearbyCardDistance}>Distance unknown</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {/* Selected Destination Card */}
      {selectedDestination && (
        <Animated.View style={[styles.selectedCard, cardAnimatedStyle, { bottom: totalTabBarSpace }]}>
          <AnimatedCard variant="glass">
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.cardScrollView}
            >
              <View style={styles.cardContent}>
                {/* Image */}
                {selectedDestination.images && selectedDestination.images.length > 0 ? (
                  <Image
                    source={{ uri: selectedDestination.images[0] }}
                    style={styles.cardImage}
                  />
                ) : (
                  <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                    <Text style={styles.cardImageIcon}>
                      {getMarkerIcon(selectedDestination.category)}
                    </Text>
                  </View>
                )}

                {/* Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={styles.cardIcon}>
                      <Text style={styles.cardIconText}>
                        {getMarkerIcon(selectedDestination.category)}
                      </Text>
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
                  {selectedDestination.rating && (
                    <View style={styles.cardInfoItem}>
                      <Ionicons name="star" size={16} color={COLORS.primary} />
                      <Text style={styles.cardInfoText}>
                        {selectedDestination.rating.toFixed(1)}
                      </Text>
                    </View>
                  )}
                  {selectedDestination.distance !== null && selectedDestination.distance !== undefined && (
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
                    title="Book Trip"
                    onPress={handleBookTrip}
                    variant="primary"
                    size="medium"
                    style={styles.cardActionButton}
                    icon="bus"
                    iconPosition="left"
                  />
                  <View style={styles.cardActionRow}>
                    <ModernButton
                      title="View Details"
                      onPress={handleViewDetails}
                      variant="outline"
                      size="medium"
                      style={styles.cardActionButtonSecondary}
                      icon="information-circle"
                      iconPosition="left"
                    />
                    {userLocation && (
                      <TouchableOpacity
                        style={styles.directionsButton}
                        onPress={handleGetDirections}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="navigate" size={20} color={COLORS.primary} />
                        <Text style={styles.directionsButtonText}>Directions</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </ScrollView>
          </AnimatedCard>
        </Animated.View>
      )}

      {/* Action Buttons */}
      <View style={[styles.actionButtons, { bottom: totalTabBarSpace }]}>
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
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
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
    padding: SPACING.xs,
  },
  filterButton: {
    marginLeft: SPACING.xs,
    padding: SPACING.xs,
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
    backgroundColor: COLORS.lightGray,
    borderWidth: 1.5,
    borderColor: COLORS.border,
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
    right: SPACING.md,
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xs,
    ...SHADOWS.medium,
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
    backgroundColor: COLORS.backgroundSecondary,
    zIndex: 20,
  },
  listViewHeader: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    ...SHADOWS.small,
  },
  listViewHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
  },
  listViewTitle: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: FONTS.weights.black,
    color: COLORS.secondary,
    letterSpacing: -1,
    marginBottom: SPACING.xs / 2,
  },
  listViewSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    fontWeight: FONTS.weights.medium,
  },
  listScrollView: {
    flex: 1,
  },
  listContent: {
    padding: SPACING.md,
    paddingTop: SPACING.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
    paddingHorizontal: SPACING.xl,
  },
  emptyStateIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${COLORS.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  emptyStateText: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.black,
    color: COLORS.secondary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptyStateSubtext: {
    fontSize: FONTS.sizes.md,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  emptyStateButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    ...SHADOWS.small,
  },
  emptyStateButtonText: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
  },
  listItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.medium,
    overflow: 'hidden',
  },
  listItemImageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 2,
  },
  listItemImage: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.lightGray,
  },
  listItemImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  listItemImageIcon: {
    fontSize: 40,
  },
  listItemCategoryBadge: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  listItemContent: {
    flex: 1,
    marginLeft: SPACING.md,
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  listItemTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.black,
    color: COLORS.secondary,
    marginBottom: SPACING.xs / 2,
    letterSpacing: -0.3,
  },
  listItemLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  listItemSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    marginLeft: SPACING.xs / 2,
    fontWeight: FONTS.weights.medium,
  },
  listItemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listItemRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
  },
  listItemRatingText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    color: COLORS.secondary,
  },
  listItemReviewCount: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray,
    marginLeft: SPACING.xs / 2,
  },
  listItemDistanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
    backgroundColor: `${COLORS.primary}10`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.full,
  },
  listItemDistance: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.primary,
    fontWeight: FONTS.weights.bold,
  },
  listItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  listItemBookButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  nearbyPanel: {
    position: 'absolute',
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
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  nearbyCardImage: {
    width: '100%',
    height: 80,
    backgroundColor: COLORS.lightGray,
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
    backgroundColor: COLORS.lightGray,
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
    gap: SPACING.md,
  },
  cardActionButton: {
    width: '100%',
  },
  cardActionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
  },
  cardActionButtonSecondary: {
    flex: 1,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  directionsButtonText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  actionButtons: {
    position: 'absolute',
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
