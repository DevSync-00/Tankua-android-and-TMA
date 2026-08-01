import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { HOME_DESTINATION_CATEGORIES } from '../constants/destinationCategories';

const CATEGORIES = HOME_DESTINATION_CATEGORIES.map((label) => ({
  id: label.toLowerCase(),
  label,
}));

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
              <Text
                style={[
                  styles.categoryLabel,
                  isSelected && styles.categoryLabelSelected,
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
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  categoryChipSelected: {
    borderColor: COLORS.secondary,
    backgroundColor: COLORS.secondary,
  },
  categoryLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.secondary,
    fontWeight: FONTS.weights.medium,
  },
  categoryLabelSelected: {
    color: COLORS.white,
    fontWeight: FONTS.weights.bold,
  },
});

export default CategoryRibbon;
