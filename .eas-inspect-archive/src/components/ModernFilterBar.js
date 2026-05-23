import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';
import ModernButton from './ModernButton';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'apps-outline' },
  { id: 'religious', label: 'Religious Heritage', icon: 'book-outline' },
  { id: 'historical', label: 'Historical', icon: 'library-outline' },
  { id: 'nature', label: 'Nature', icon: 'leaf-outline' },
  { id: 'adventure', label: 'Adventure', icon: 'bicycle-outline' },
  { id: 'cultural', label: 'Cultural', icon: 'people-outline' },
];

const DISTANCE_RANGES = [
  { id: 'all', label: 'Any Distance' },
  { id: '0-50', label: '0-50 km' },
  { id: '50-100', label: '50-100 km' },
  { id: '100-200', label: '100-200 km' },
  { id: '200+', label: '200+ km' },
];

const RATING_OPTIONS = [
  { id: 'all', label: 'Any Rating' },
  { id: '4.5+', label: '4.5+ ⭐' },
  { id: '4.0+', label: '4.0+ ⭐' },
  { id: '3.5+', label: '3.5+ ⭐' },
];

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const ModernFilterBar = ({ 
  selectedCategory, 
  onCategoryChange, 
  regions = [], 
  selectedRegion, 
  onRegionChange, 
  showFilters, 
  onToggleFilters,
  scrollY = null,
  // Advanced filter props
  filters = {},
  onFiltersChange = () => {},
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [tempFilters, setTempFilters] = useState(filters);
  
  const filterHeight = useSharedValue(0);
  const filterOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (showFilters) {
      filterHeight.value = withTiming(60, { duration: 200 });
      filterOpacity.value = withTiming(1, { duration: 200 });
    } else {
      filterHeight.value = withTiming(0, { duration: 200 });
      filterOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [showFilters]);

  const filterAnimatedStyle = useAnimatedStyle(() => ({
    height: filterHeight.value,
    opacity: filterOpacity.value,
  }));

  const filterToggleStyle = useAnimatedStyle(() => {
    if (!scrollY) {
      return { opacity: 1, transform: [{ translateY: 0 }] };
    }
    const threshold = 30;
    const isScrolled = scrollY.value > threshold;
    
    return {
      opacity: withTiming(isScrolled ? 0 : 1, { duration: 200 }),
      transform: [
        {
          translateY: withTiming(isScrolled ? -40 : 0, { duration: 200 }),
        },
      ],
      maxHeight: withTiming(isScrolled ? 0 : 50, { duration: 200 }),
      overflow: 'hidden',
    };
  });

  const handleApplyFilters = () => {
    onFiltersChange(tempFilters);
    setShowAdvancedFilters(false);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      distance: 'all',
      rating: 'all',
      minPrice: '',
      maxPrice: '',
    };
    setTempFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const hasActiveFilters = filters.distance !== 'all' || 
    filters.rating !== 'all' || 
    filters.minPrice || 
    filters.maxPrice;

  return (
    <View style={styles.container}>
      {/* Category Filter - Scrollable Chips */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryContainer}
        bounces={false}
        overScrollMode="never"
      >
        {CATEGORIES.map((category) => {
          const isActive = selectedCategory === category.id;
          
          return (
            <AnimatedTouchable
              key={category.id}
              style={[
                styles.categoryChip,
                isActive && styles.categoryChipActive,
              ]}
              onPress={() => onCategoryChange(category.id)}
            >
              <Ionicons 
                name={category.icon} 
                size={16} 
                color={isActive ? COLORS.white : COLORS.primary} 
              />
              <Text
                style={[
                  styles.categoryText,
                  isActive && styles.categoryTextActive
                ]}
              >
                {category.label}
              </Text>
            </AnimatedTouchable>
          );
        })}
      </ScrollView>

      {/* Filter Actions Row */}
      <Animated.View style={filterToggleStyle}>
        <View style={styles.filterActionsRow}>
          {regions.length > 0 && (
            <TouchableOpacity 
              style={styles.filterToggle}
              onPress={onToggleFilters}
            >
              <Ionicons 
                name={showFilters ? 'chevron-up' : 'chevron-down'} 
                size={14} 
                color={COLORS.gray} 
              />
              <Text style={styles.filterToggleText}>
                {showFilters ? 'Less' : 'More'}
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.advancedFilterButton, hasActiveFilters && styles.advancedFilterButtonActive]}
            onPress={() => setShowAdvancedFilters(true)}
          >
            <Ionicons 
              name="options-outline" 
              size={16} 
              color={hasActiveFilters ? COLORS.white : COLORS.primary} 
            />
            <Text style={[styles.advancedFilterText, hasActiveFilters && styles.advancedFilterTextActive]}>
              Filters
            </Text>
            {hasActiveFilters && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>
                  {[filters.distance !== 'all', filters.rating !== 'all', filters.minPrice, filters.maxPrice].filter(Boolean).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Region Filter (animated) */}
      {regions.length > 0 && (
        <Animated.View style={[styles.regionContainer, filterAnimatedStyle]}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.regionScroll}
            bounces={false}
            overScrollMode="never"
          >
            <AnimatedTouchable
              style={[
                styles.regionButton,
                !selectedRegion && styles.regionButtonActive
              ]}
              onPress={() => onRegionChange(null)}
            >
              <Text
                style={[
                  styles.regionText,
                  !selectedRegion && styles.regionTextActive
                ]}
              >
                All Regions
              </Text>
            </AnimatedTouchable>
            {regions.map((region) => (
              <AnimatedTouchable
                key={region}
                style={[
                  styles.regionButton,
                  selectedRegion === region && styles.regionButtonActive
                ]}
                onPress={() => onRegionChange(region)}
              >
                <Text
                  style={[
                    styles.regionText,
                    selectedRegion === region && styles.regionTextActive
                  ]}
                >
                  {region}
                </Text>
              </AnimatedTouchable>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {/* Advanced Filters Modal */}
      <Modal
        visible={showAdvancedFilters}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAdvancedFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Advanced Filters</Text>
              <TouchableOpacity onPress={() => setShowAdvancedFilters(false)}>
                <Ionicons name="close" size={24} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Distance Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Distance</Text>
                <View style={styles.filterOptions}>
                  {DISTANCE_RANGES.map((range) => (
                    <TouchableOpacity
                      key={range.id}
                      style={[
                        styles.filterOption,
                        tempFilters.distance === range.id && styles.filterOptionActive
                      ]}
                      onPress={() => setTempFilters({ ...tempFilters, distance: range.id })}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        tempFilters.distance === range.id && styles.filterOptionTextActive
                      ]}>
                        {range.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Rating Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Minimum Rating</Text>
                <View style={styles.filterOptions}>
                  {RATING_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.filterOption,
                        tempFilters.rating === option.id && styles.filterOptionActive
                      ]}
                      onPress={() => setTempFilters({ ...tempFilters, rating: option.id })}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        tempFilters.rating === option.id && styles.filterOptionTextActive
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Price Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Price Range (ETB)</Text>
                <View style={styles.priceInputContainer}>
                  <View style={styles.priceInputWrapper}>
                    <Text style={styles.priceLabel}>Min</Text>
                    <TextInput
                      style={styles.priceInput}
                      placeholder="0"
                      placeholderTextColor={COLORS.gray}
                      keyboardType="numeric"
                      value={tempFilters.minPrice}
                      onChangeText={(text) => setTempFilters({ ...tempFilters, minPrice: text })}
                    />
                  </View>
                  <View style={styles.priceInputWrapper}>
                    <Text style={styles.priceLabel}>Max</Text>
                    <TextInput
                      style={styles.priceInput}
                      placeholder="Any"
                      placeholderTextColor={COLORS.gray}
                      keyboardType="numeric"
                      value={tempFilters.maxPrice}
                      onChangeText={(text) => setTempFilters({ ...tempFilters, maxPrice: text })}
                    />
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.resetButton}
                onPress={handleResetFilters}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              <ModernButton
                title="Apply Filters"
                onPress={handleApplyFilters}
                variant="primary"
                style={styles.applyButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    paddingTop: 0,
    paddingBottom: 0,
  },
  categoryContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    marginRight: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    minHeight: 40,
    ...SHADOWS.small,
    flexShrink: 0,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: {
    marginLeft: SPACING.xs / 2,
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  filterActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterToggleText: {
    marginLeft: 4,
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray,
    fontWeight: '500',
  },
  advancedFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  advancedFilterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  advancedFilterText: {
    marginLeft: 6,
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  advancedFilterTextActive: {
    color: COLORS.white,
  },
  filterBadge: {
    marginLeft: 6,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: FONTS.sizes.xs - 2,
    color: COLORS.primary,
    fontWeight: '700',
  },
  regionContainer: {
    overflow: 'hidden',
    paddingHorizontal: SPACING.md,
  },
  regionScroll: {
    paddingVertical: SPACING.xs / 2,
  },
  regionButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    marginRight: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
  },
  regionButtonActive: {
    backgroundColor: `${COLORS.primary}20`,
    borderColor: COLORS.primary,
  },
  regionText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  regionTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  // Modal styles
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  modalBody: {
    padding: SPACING.md,
  },
  filterSection: {
    marginBottom: SPACING.lg,
  },
  filterSectionTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: SPACING.sm,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  filterOption: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
  },
  filterOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterOptionText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  priceInputContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  priceInputWrapper: {
    flex: 1,
  },
  priceLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    marginBottom: SPACING.xs,
    fontWeight: '500',
  },
  priceInput: {
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    fontSize: FONTS.sizes.md,
    color: COLORS.secondary,
    backgroundColor: COLORS.white,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: SPACING.sm,
  },
  resetButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.gray,
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
  },
});

export default ModernFilterBar;
