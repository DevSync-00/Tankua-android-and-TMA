import React, { useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { getPlaceTypeLabel, resolvePlaceMarker } from '../utils/placeTypeResolver';
import PlaceTypeIcon from './map/PlaceTypeIcon';

const DestinationCard = ({ destination, onPress, variant = 'list' }) => {
  const imageUri = destination.images && destination.images.length > 0
    ? destination.images[0]
    : 'https://via.placeholder.com/400x300?text=Destination';

  const markerConfig = useMemo(() => resolvePlaceMarker(destination), [destination]);
  const placeLabel = useMemo(() => getPlaceTypeLabel(destination), [destination]);

  if (variant === 'grid') {
    return (
      <TouchableOpacity style={styles.gridCard} onPress={onPress} activeOpacity={0.8}>
        <Image source={{ uri: imageUri }} style={styles.gridImage} />
        <View style={styles.gridContent}>
          <View style={styles.gridHeader}>
            <PlaceTypeIcon destination={destination} size={14} color={markerConfig.color} markerConfig={markerConfig} />
            <Text style={styles.gridCategory}>{placeLabel}</Text>
          </View>
          <Text style={styles.gridName} numberOfLines={2}>{destination.name}</Text>
          <View style={styles.gridFooter}>
            <Ionicons name="location-outline" size={14} color={COLORS.gray} />
            <Text style={styles.gridLocation}>{destination.city || 'Unknown'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.listCard} onPress={onPress} activeOpacity={0.8}>
      <Image source={{ uri: imageUri }} style={styles.listImage} />
      <View style={styles.listContent}>
        <View style={styles.listHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: `${markerConfig.color}18` }]}>
            <PlaceTypeIcon destination={destination} size={12} color={markerConfig.color} markerConfig={markerConfig} />
            <Text style={[styles.categoryText, { color: markerConfig.color }]}>{placeLabel}</Text>
          </View>
        </View>
        <Text style={styles.listName} numberOfLines={1}>{destination.name}</Text>
        <Text style={styles.listDescription} numberOfLines={2}>
          {destination.description || ''}
        </Text>
        <View style={styles.listFooter}>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={16} color={COLORS.gray} />
            <Text style={styles.listLocation}>{destination.city || 'Unknown'}</Text>
          </View>
          {destination.distance && (
            <Text style={styles.distance}>{destination.distance} km</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  listCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  listImage: {
    width: 120,
    height: 120,
    backgroundColor: COLORS.lightGray,
  },
  listContent: {
    flex: 1,
    padding: SPACING.md,
    justifyContent: 'space-between',
  },
  listHeader: {
    marginBottom: SPACING.xs,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  categoryText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  listName: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: SPACING.xs,
  },
  listDescription: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    lineHeight: 18,
  },
  listFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listLocation: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    marginLeft: SPACING.xs,
  },
  distance: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  gridCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    margin: SPACING.xs,
    ...SHADOWS.medium,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  gridImage: {
    width: '100%',
    height: 150,
    backgroundColor: COLORS.lightGray,
  },
  gridContent: {
    padding: SPACING.md,
  },
  gridHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  gridCategory: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  gridName: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: SPACING.xs,
    height: 40,
  },
  gridFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridLocation: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    marginLeft: SPACING.xs,
  },
});

export default DestinationCard;
