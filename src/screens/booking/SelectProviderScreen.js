import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../config/theme';
import { useLanguage } from '../../contexts/LanguageContext';
import { useBooking } from '../../contexts/BookingContext';
import { getProviders } from '../../services/database';
import Button from '../../components/Button';

const SelectProviderScreen = ({ navigation }) => {
  const { t } = useLanguage();
  const { currentBooking, updateBooking } = useBooking();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState(currentBooking.provider || null);

  useEffect(() => {
    loadProviders();
  }, [currentBooking.destination, currentBooking.date]);

  const loadProviders = async () => {
    try {
      setLoading(true);
      
      // Filter providers based on selected destination and date
      const destination = currentBooking.destination;
      const filters = {};
      if (destination?.id) {
        filters.destinationId = destination.id;
      }
      if (currentBooking.date) {
        filters.date = currentBooking.date;
      }

      const data = await getProviders(filters);
      setProviders(data);
      
      // If no providers found and we have filters, show a helpful message
      if (data.length === 0 && (filters.destinationId || filters.date)) {
        // Don't show alert, just show empty state in UI
      }
    } catch (error) {
      console.error('Error loading providers:', error);
      Alert.alert('Error', 'Failed to load travel providers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (selectedProvider) {
      updateBooking({ provider: selectedProvider });
      navigation.navigate('SelectPickupStation');
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Ionicons key={i} name="star" size={16} color={COLORS.primary} />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Ionicons key={i} name="star-half" size={16} color={COLORS.primary} />
        );
      } else {
        stars.push(
          <Ionicons key={i} name="star-outline" size={16} color={COLORS.gray} />
        );
      }
    }
    return stars;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading providers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Select Travel Provider</Text>
        <Text style={styles.subtitle}>
          {currentBooking.destination && currentBooking.date
            ? `Available providers for ${currentBooking.destination?.name || 'this destination'} on ${typeof currentBooking.date === 'string' ? currentBooking.date : new Date(currentBooking.date).toLocaleDateString()}`
            : 'Choose a travel company for your trip'}
        </Text>

        {providers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={64} color={COLORS.gray} />
            <Text style={styles.emptyText}>No providers available</Text>
            <Text style={styles.emptySubtext}>
              {currentBooking.destination && currentBooking.date
                ? `No travel providers have scheduled trips to ${currentBooking.destination?.name || 'this destination'} on ${typeof currentBooking.date === 'string' ? currentBooking.date : new Date(currentBooking.date).toLocaleDateString()}. Please try a different date or check back later.`
                : 'Please check back later or contact support'}
            </Text>
          </View>
        ) : (
          <View style={styles.providersList}>
            {providers.map((provider) => (
              <TouchableOpacity
                key={provider.id}
                style={[
                  styles.providerCard,
                  selectedProvider?.id === provider.id && styles.providerCardSelected,
                ]}
                onPress={() => setSelectedProvider(provider)}
              >
                {/* Logo */}
                <View style={styles.logoContainer}>
                  {provider.logo_url ? (
                    <Image
                      source={{ uri: provider.logo_url }}
                      style={styles.logo}
                    />
                  ) : (
                    <View style={styles.logoPlaceholder}>
                      <Ionicons name="business" size={32} color={COLORS.primary} />
                    </View>
                  )}
                </View>

                {/* Provider Info */}
                <View style={styles.providerInfo}>
                  <View style={styles.providerHeader}>
                    <Text style={styles.providerName}>{provider.name}</Text>
                    {selectedProvider?.id === provider.id && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={COLORS.primary}
                      />
                    )}
                  </View>

                  {provider.description && (
                    <Text style={styles.providerDescription} numberOfLines={2}>
                      {provider.description}
                    </Text>
                  )}

                  <View style={styles.providerDetails}>
                    <View style={styles.ratingContainer}>
                      <View style={styles.starsContainer}>
                        {renderStars(provider.rating || 0)}
                      </View>
                      <Text style={styles.ratingText}>
                        {provider.rating?.toFixed(1) || '0.0'}
                      </Text>
                    </View>

                    {provider.total_trips > 0 && (
                      <View style={styles.tripsContainer}>
                        <Ionicons name="car" size={16} color={COLORS.gray} />
                        <Text style={styles.tripsText}>
                          {provider.total_trips}+ trips
                        </Text>
                      </View>
                    )}
                  </View>

                  {provider.phone && (
                    <View style={styles.contactContainer}>
                      <Ionicons name="call-outline" size={14} color={COLORS.gray} />
                      <Text style={styles.contactText}>{provider.phone}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Tankua charges a 5% service fee. The provider receives 95% of the base price.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={t('continue')}
          onPress={handleContinue}
          disabled={!selectedProvider}
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONTS.sizes.md,
    color: COLORS.gray,
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.gray,
    marginBottom: SPACING.xl,
  },
  providersList: {
    gap: SPACING.md,
  },
  providerCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.medium,
  },
  providerCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}05`,
  },
  logoContainer: {
    marginRight: SPACING.md,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.lightGray,
  },
  logoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerInfo: {
    flex: 1,
  },
  providerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  providerName: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.secondary,
    flex: 1,
  },
  providerDescription: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    marginBottom: SPACING.sm,
    lineHeight: 18,
  },
  providerDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  tripsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  tripsText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
  },
  contactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  contactText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.secondary,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: FONTS.sizes.md,
    color: COLORS.gray,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: `${COLORS.primary}10`,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.xl,
  },
  infoText: {
    flex: 1,
    marginLeft: SPACING.md,
    fontSize: FONTS.sizes.sm,
    color: COLORS.secondary,
    lineHeight: 20,
  },
  footer: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  button: {
    width: '100%',
  },
});

export default SelectProviderScreen;

