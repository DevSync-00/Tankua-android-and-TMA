import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS, ANIMATIONS } from '../../config/theme';
import { useLanguage } from '../../contexts/LanguageContext';
import { useBooking } from '../../contexts/BookingContext';
import { GOOGLE_MAPS_STYLE } from '../../config/googleMaps';
import ModernPickupStationCard from '../../components/ModernPickupStationCard';
import ModernButton from '../../components/ModernButton';
import { getTripStations, getProviderPickupStations } from '../../services/database';

const SelectPickupStationScreen = ({ navigation }) => {
  const { width, height } = useWindowDimensions();
  const { t } = useLanguage();
  const { currentBooking, updateBooking } = useBooking();
  const [selectedStation, setSelectedStation] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState({
    latitude: 9.0320,
    longitude: 38.7469,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  });

  const mapCardTranslateY = useSharedValue(300);
  const mapCardOpacity = useSharedValue(0);

  useEffect(() => {
    loadStations();
  }, []);

  useEffect(() => {
    if (selectedStation && viewMode === 'map') {
      mapCardTranslateY.value = withSpring(0, ANIMATIONS.spring);
      mapCardOpacity.value = withTiming(1, { duration: ANIMATIONS.normal });
    } else {
      mapCardTranslateY.value = withSpring(300, ANIMATIONS.spring);
      mapCardOpacity.value = withTiming(0, { duration: ANIMATIONS.normal });
    }
  }, [selectedStation, viewMode]);

  const loadStations = async () => {
    try {
      setLoading(true);
      let rows = currentBooking.trip?.id
        ? await getTripStations(currentBooking.trip.id)
        : await getProviderPickupStations(currentBooking.provider?.id);
      // Until a provider customizes stations for a particular trip, offer all
      // active stations belonging to that provider.
      if (rows.length === 0 && currentBooking.provider?.id) {
        rows = await getProviderPickupStations(currentBooking.provider.id);
      }
      const normalized = rows.map((row) => {
        const station = row.pickup_stations || row;
        return {
          ...station,
          lat: Number(station.lat ?? station.latitude),
          lng: Number(station.lng ?? station.longitude),
          pickupTime: row.pickup_time || station.pickup_time || 'TBD',
          extraPrice: Number(row.extra_price ?? station.extra_price ?? 0),
        };
      }).filter((station) => Number.isFinite(station.lat) && Number.isFinite(station.lng));
      setStations(normalized);
      if (normalized.length) {
        setRegion((previous) => ({
          ...previous,
          latitude: normalized[0].lat,
          longitude: normalized[0].lng,
        }));
      }
    } catch (error) {
      console.error('Error loading pickup stations:', error);
      Alert.alert('Error', 'Failed to load pickup stations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (selectedStation) {
      updateBooking({ pickupStation: selectedStation });
      navigation.navigate('SelectSeats');
    }
  };

  const handleStationSelect = (station) => {
    setSelectedStation(station);
    if (viewMode === 'map') {
      setRegion({
        latitude: station.lat,
        longitude: station.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  };

  const mapCardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: mapCardTranslateY.value }],
    opacity: mapCardOpacity.value,
  }));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t('selectPickupStation') || 'Select Pickup Station'}</Text>
          <Text style={styles.subtitle}>Choose your preferred pickup location</Text>
        </View>
        <View style={styles.viewToggle}>
          <ModernButton
            title=""
            onPress={() => setViewMode('list')}
            variant={viewMode === 'list' ? 'primary' : 'ghost'}
            size="small"
            style={styles.toggleButton}
            icon={viewMode === 'list' ? 'list' : 'list-outline'}
            iconPosition="left"
          />
          <ModernButton
            title=""
            onPress={() => setViewMode('map')}
            variant={viewMode === 'map' ? 'primary' : 'ghost'}
            size="small"
            style={styles.toggleButton}
            icon={viewMode === 'map' ? 'map' : 'map-outline'}
            iconPosition="left"
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.subtitle}>Loading pickup stations...</Text>
        </View>
      ) : stations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="location-outline" size={48} color={COLORS.gray} />
          <Text style={styles.emptyTitle}>No pickup stations available</Text>
          <Text style={styles.subtitle}>This provider has not added pickup stations for this trip yet.</Text>
        </View>
      ) : viewMode === 'list' ? (
        <FlatList
          data={stations}
          renderItem={({ item, index }) => (
            <ModernPickupStationCard
              station={item}
              onPress={() => handleStationSelect(item)}
              selected={selectedStation?.id === item.id}
              index={index}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={region}
            onRegionChangeComplete={setRegion}
            customMapStyle={GOOGLE_MAPS_STYLE}
          >
            {stations.map((station) => (
              <Marker
                key={station.id}
                coordinate={{ latitude: station.lat, longitude: station.lng }}
                title={station.name}
                description={`Pickup: ${station.pickupTime}`}
                onPress={() => handleStationSelect(station)}
              >
                <View style={[
                  styles.markerContainer,
                  selectedStation?.id === station.id && styles.markerSelected,
                  station.isNearest && styles.markerNearest,
                ]}>
                  <Ionicons 
                    name="location" 
                    size={24} 
                    color={
                      selectedStation?.id === station.id
                        ? COLORS.white
                        : station.isNearest
                        ? COLORS.primary
                        : COLORS.gray
                    } 
                  />
                </View>
              </Marker>
            ))}
          </MapView>

          {selectedStation && (
            <Animated.View style={[styles.mapStationCard, mapCardAnimatedStyle]}>
              <ModernPickupStationCard
                station={selectedStation}
                onPress={() => {}}
                selected={true}
              />
            </Animated.View>
          )}
        </View>
      )}

      <View style={styles.footer}>
        {selectedStation && (
          <View style={styles.selectedInfo}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <View style={styles.selectedTextContainer}>
              <Text style={styles.selectedText}>
                {selectedStation.name}
              </Text>
              <Text style={styles.selectedSubtext}>
                {selectedStation.pickupTime} • {selectedStation.distance} km
                {selectedStation.extraPrice > 0 && ` • +${selectedStation.extraPrice} ETB`}
              </Text>
            </View>
          </View>
        )}
        <ModernButton
          title={t('continue') || 'Continue'}
          onPress={handleContinue}
          disabled={!selectedStation}
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
  header: {
    padding: SPACING.md,
    paddingTop: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  title: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: '800',
    color: COLORS.secondary,
    marginBottom: SPACING.xs,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    fontWeight: '500',
  },
  viewToggle: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  toggleButton: {
    flex: 1,
  },
  listContent: {
    paddingBottom: SPACING.xxl,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.primary,
    ...SHADOWS.large,
  },
  markerSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.white,
  },
  markerNearest: {
    borderColor: COLORS.secondary,
  },
  mapStationCard: {
    position: 'absolute',
    bottom: SPACING.md,
    left: 0,
    right: 0,
  },
  footer: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    ...SHADOWS.large,
  },
  selectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    padding: SPACING.md,
    backgroundColor: `${COLORS.success}10`,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  selectedTextContainer: {
    flex: 1,
  },
  selectedText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.secondary,
    fontWeight: '700',
  },
  selectedSubtext: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray,
    marginTop: 2,
  },
  button: {
    width: '100%',
  },
});

export default SelectPickupStationScreen;
