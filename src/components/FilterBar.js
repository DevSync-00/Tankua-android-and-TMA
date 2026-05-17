import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../config/theme';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'apps-outline' },
  { id: 'religious', label: 'Religious Heritage', icon: 'book-outline' },
  { id: 'historical', label: 'Historical', icon: 'library-outline' },
  { id: 'nature', label: 'Nature', icon: 'leaf-outline' },
  { id: 'adventure', label: 'Adventure', icon: 'bicycle-outline' },
  { id: 'cultural', label: 'Cultural', icon: 'people-outline' },
  { id: 'monument', label: 'Monuments', icon: 'location-outline' },
  { id: 'park', label: 'Parks', icon: 'tree-outline' },
  { id: 'museum', label: 'Museums', icon: 'library-outline' },
];

const FilterBar = ({ selectedCategory, onCategoryChange, regions = [], selectedRegion, onRegionChange, showFilters, onToggleFilters }) => {
  return (
    <View style={styles.container}>
      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryContainer}
      >
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && styles.categoryButtonActive
            ]}
            onPress={() => onCategoryChange(category.id)}
          >
            <Ionicons 
              name={category.icon} 
              size={18} 
              color={selectedCategory === category.id ? COLORS.white : COLORS.primary} 
            />
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category.id && styles.categoryTextActive
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Advanced Filters Toggle */}
      {regions.length > 0 && (
        <TouchableOpacity 
          style={styles.filterToggle}
          onPress={onToggleFilters}
        >
          <Ionicons 
            name={showFilters ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color={COLORS.primary} 
          />
          <Text style={styles.filterToggleText}>
            {showFilters ? 'Hide Filters' : 'More Filters'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Region Filter (shown when filters are expanded) */}
      {showFilters && regions.length > 0 && (
        <View style={styles.regionContainer}>
          <Text style={styles.filterLabel}>Region:</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.regionScroll}
            bounces={false}
            overScrollMode="never"
          >
            <TouchableOpacity
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
            </TouchableOpacity>
            {regions.map((region) => (
              <TouchableOpacity
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
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoryContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.lightGray,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: {
    marginLeft: SPACING.xs,
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  filterToggleText: {
    marginLeft: SPACING.xs,
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  regionContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  filterLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    marginBottom: SPACING.xs,
    fontWeight: '500',
  },
  regionScroll: {
    paddingVertical: SPACING.xs,
  },
  regionButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    marginRight: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.lightGray,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  regionButtonActive: {
    backgroundColor: `${COLORS.primary}20`,
    borderColor: COLORS.primary,
  },
  regionText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.secondary,
  },
  regionTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default FilterBar;
