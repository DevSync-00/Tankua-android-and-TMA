import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
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
import ModernPickupStationCard from '../../components/ModernPickupStationCard';
import ModernButton from '../../components/ModernButton';

const MOCK_STATIONS = [
  {
    id: '1',
    name: 'Meskel Square',
    city: 'Addis Ababa',
    lat: 9.0092,
    lng: 38.7635,
    pickupTime: '6:00 AM',
    extraPrice: 0,
    distance: 2.3,
    isNearest: true,
  },
  {
    id: '2',
    name: 'Bole Airport',
    city: 'Addis Ababa',
    lat: 8.9806,
    lng: 38.7991,
    pickupTime: '6:30 AM',
    extraPrice: 50,
    distance: 8.5,
  },
  {
    id: '3',
    name: 'Piazza',
    city: 'Addis Ababa',
    lat: 9.0339,
    lng: 38.7507,
    pickupTime: '5:45 AM',
    extraPrice: 0,
    distance: 3.7,
  },
  {
    id: '4',
    name: 'Mexico Square',
    city: 'Addis Ababa',
    lat: 9.0158,
    lng: 38.7573,
    pickupTime: '6:15 AM',
    extraPrice: 25,
    distance: 4.2,
  },
  {
    id: '5',
    name: 'Kality',
    city: 'Addis Ababa',
    lat: 8.9183,
    lng: 38.7317,
    pickupTime: '5:30 AM',
    extraPrice: 100,
    distance: 15.8,
  },
];

const SelectPickupStationScreen = ({ navigation }) => {
  const { width, height } = useWindowDimensions();
  const { t } = useLanguage();
  const { updateBooking } = useBooking();
  const [selectedStation, setSelectedStation] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [stations, setStations] = useState([]);
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
    setTimeout(() => {
      setStations(MOCK_STATIONS);
    }, 500);
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

      {viewMode === 'list' ? (
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
