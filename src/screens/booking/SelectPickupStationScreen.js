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

  // Tamed subtle animation values
  const mapCardTranslateY = useSharedValue(120);
  const mapCardOpacity = useSharedValue(0);

  useEffect(() => {
    loadStations();
  }, []);

  useEffect(() => {
    if (selectedStation && viewMode === 'map') {
      mapCardTranslateY.value = withTiming(0, { duration: 250 });
      mapCardOpacity.value = withTiming(1, { duration: 250 });
    } else {
      mapCardTranslateY.value = withTiming(120, { duration: 200 });
      mapCardOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [selectedStation, viewMode]);

  const loadStations = async () => {
    try {
      setLoading(true);
      let rows = currentBooking.trip?.id
        ? await getTripStations(currentBooking.trip.id)
        : await getProviderPickupStations(currentBooking.provider?.id);
      
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

  // Step Progress Header
  const renderStepHeader = () => {
    const steps = [
      { key: 'trips', label: 'Trips' },
      { key: 'pickup', label: 'Pickup' },
      { key: 'seats', label: 'Seats' },
      { key: 'payment', label: 'Payment' }
    ];
    return (
      <View style={stepStyles.progressContainer}>
        {steps.map((step, idx) => {
          const isActive = step.key === 'pickup';
          const isCompleted = idx < 1;
          return (
            <React.Fragment key={step.key}>
              <View style={stepStyles.stepWrapper}>
                <View style={[
                  stepStyles.stepCircle,
                  isActive && stepStyles.stepCircleActive,
                  isCompleted && stepStyles.stepCircleCompleted
                ]}>
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={12} color={COLORS.white} />
                  ) : (
                    <Text style={[
                      stepStyles.stepNumber,
                      isActive && stepStyles.stepNumberActive,
                    ]}>{idx + 1}</Text>
                  )}
                </View>
                <Text style={[
                  stepStyles.stepLabel,
                  isActive && stepStyles.stepLabelActive
                ]}>{step.label}</Text>
              </View>
              {idx < steps.length - 1 && (
                <View style={[
                  stepStyles.stepDivider,
                  isCompleted && stepStyles.stepDividerCompleted
                ]} />
              )}
            </React.Fragment>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Custom Back Header */}
      <View style={styles.customHeader}>
        <TouchableOpacity
          style={styles.customBackButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.customHeaderTitle}>Pickup Station</Text>
        <View style={styles.customHeaderRight} />
      </View>

      {renderStepHeader()}

      <View style={styles.header}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.subtitle}>Choose your preferred departure station</Text>
        </View>
        
        {/* Toggle Switcher */}
        <View style={styles.switcherContainer}>
          <TouchableOpacity
            style={[styles.switchButton, viewMode === 'list' && styles.switchButtonActive]}
            onPress={() => setViewMode('list')}
            activeOpacity={0.8}
          >
            <Ionicons name="list" size={16} color={viewMode === 'list' ? COLORS.white : COLORS.secondary} />
            <Text style={[styles.switchText, viewMode === 'list' && styles.switchTextActive]}>List</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.switchButton, viewMode === 'map' && styles.switchButtonActive]}
            onPress={() => setViewMode('map')}
            activeOpacity={0.8}
          >
            <Ionicons name="map" size={16} color={viewMode === 'map' ? COLORS.white : COLORS.secondary} />
            <Text style={[styles.switchText, viewMode === 'map' && styles.switchTextActive]}>Map</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.subtitle}>Loading pickup stations...</Text>
        </View>
      ) : stations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="location-outline" size={48} color={COLORS.grayLight} />
          <Text style={styles.emptyTitle}>No pickup stations found</Text>
          <Text style={styles.subtitle}>No stations scheduled for this trip.</Text>
        </View>
      ) : viewMode === 'list' ? (
        <FlatList
          data={stations}
          renderItem={({ item, index }) => (
            <View style={styles.cardPadding}>
              <ModernPickupStationCard
                station={item}
                onPress={() => handleStationSelect(item)}
                selected={selectedStation?.id === item.id}
                index={index}
              />
            </View>
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
                ]}>
                  <Ionicons 
                    name="location" 
                    size={20} 
                    color={selectedStation?.id === station.id ? COLORS.white : COLORS.secondary} 
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

      {/* Sticky Bottom Footer */}
      <View style={styles.footer}>
        {selectedStation && (
          <View style={styles.selectedInfo}>
            <View style={styles.checkedCircle}>
              <Ionicons name="checkmark" size={14} color={COLORS.success} />
            </View>
            <View style={styles.selectedTextContainer}>
              <Text style={styles.selectedText}>{selectedStation.name}</Text>
              <Text style={styles.selectedSubtext}>
                Departs {selectedStation.pickupTime}
                {selectedStation.extraPrice > 0 ? ` • +ETB ${selectedStation.extraPrice}` : ''}
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

const stepStyles = StyleSheet.create({
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  stepWrapper: {
    alignItems: 'center',
    width: 60,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepCircleActive: {
    backgroundColor: COLORS.primary,
  },
  stepCircleCompleted: {
    backgroundColor: COLORS.secondary,
  },
  stepNumber: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: '700',
  },
  stepNumberActive: {
    color: COLORS.secondary,
  },
  stepLabel: {
    fontSize: 10,
    color: COLORS.gray,
    fontWeight: '500',
  },
  stepLabelActive: {
    color: COLORS.secondary,
    fontWeight: 'bold',
  },
  stepDivider: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.borderLight,
    maxWidth: 40,
    marginTop: -14,
  },
  stepDividerCompleted: {
    backgroundColor: COLORS.secondary,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '800',
    color: COLORS.secondary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray,
    fontWeight: '500',
    marginTop: 2,
  },
  switcherContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundGray,
    padding: 3,
    borderRadius: BORDER_RADIUS.md,
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.sm,
  },
  switchButtonActive: {
    backgroundColor: COLORS.secondary,
    ...SHADOWS.small,
  },
  switchText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    color: COLORS.secondary,
    marginLeft: 4,
  },
  switchTextActive: {
    color: COLORS.white,
  },
  cardPadding: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  listContent: {
    paddingBottom: SPACING.xl,
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
  },
  emptyTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.secondary,
    marginTop: SPACING.md,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...SHADOWS.medium,
  },
  markerSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.white,
  },
  mapStationCard: {
    position: 'absolute',
    bottom: SPACING.md,
    left: SPACING.md,
    right: SPACING.md,
  },
  footer: {
    padding: SPACING.lg,
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
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: SPACING.sm,
  },
  checkedCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: `${COLORS.success}15`,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: '500',
    marginTop: 2,
  },
  button: {
    width: '100%',
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  customBackButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
  },
  customHeaderTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '800',
    color: COLORS.secondary,
    textAlign: 'center',
  },
  customHeaderRight: {
    width: 36,
  },
});

export default SelectPickupStationScreen;
