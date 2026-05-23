import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';

const CATEGORIES = [
  { id: 'sacred', label: 'Sacred Sites', icon: 'star-outline', color: '#FF6B6B' },
  { id: 'nature', label: 'Nature', icon: 'leaf-outline', color: '#10B981' },
  { id: 'city', label: 'City Life', icon: 'business-outline', color: '#3B82F6' },
  { id: 'historical', label: 'Historical', icon: 'library-outline', color: '#8B5CF6' },
  { id: 'adventure', label: 'Adventure', icon: 'bicycle-outline', color: '#F59E0B' },
  { id: 'cultural', label: 'Cultural', icon: 'people-outline', color: '#EC4899' },
];

const CategoryRibbon = ({ onCategoryPress, selectedCategory }) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CATEGORIES.map((category) => {
          const isSelected = selectedCategory === category.id;
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                isSelected && styles.categoryChipSelected,
              ]}
              onPress={() => onCategoryPress?.(category.id)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconContainer,
                  isSelected && { backgroundColor: `${category.color}20` },
                ]}
              >
                <Ionicons
                  name={category.icon}
                  size={18}
                  color={isSelected ? category.color : COLORS.gray}
                />
              </View>
              <Text
                style={[
                  styles.categoryLabel,
                  isSelected && { color: category.color, fontWeight: FONTS.weights.bold },
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.sm,
  },
  scrollContent: {
    paddingLeft: SPACING.sm,
    paddingRight: SPACING.lg,
    paddingVertical: SPACING.xs,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  categoryChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}08`,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.secondary,
    fontWeight: FONTS.weights.medium,
    marginLeft: SPACING.sm,
  },
});

export default CategoryRibbon;
