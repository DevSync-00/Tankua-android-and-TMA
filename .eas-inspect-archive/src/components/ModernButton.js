import React from 'react';
import { Text, StyleSheet, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';

const ModernButton = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon = null,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  style = {},
  textStyle = {},
  fullWidth = false,
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.button];

    // Size variants
    switch (size) {
      case 'small':
        baseStyle.push(styles.buttonSmall);
        break;
      case 'large':
        baseStyle.push(styles.buttonLarge);
        break;
      default:
        baseStyle.push(styles.buttonMedium);
    }

    // Variant styles
    switch (variant) {
      case 'outline':
        baseStyle.push(styles.buttonOutline);
        break;
      case 'ghost':
        baseStyle.push(styles.buttonGhost);
        break;
      case 'secondary':
        baseStyle.push(styles.buttonSecondary);
        break;
      case 'danger':
        baseStyle.push(styles.buttonDanger);
        break;
      default:
        baseStyle.push(styles.buttonPrimary);
    }

    if (disabled) {
      baseStyle.push(styles.buttonDisabled);
    }

    if (fullWidth) {
      baseStyle.push(styles.buttonFullWidth);
    }

    return [...baseStyle, style];
  };

  const getTextStyle = () => {
    const baseStyle = [styles.buttonText];

    switch (size) {
      case 'small':
        baseStyle.push(styles.textSmall);
        break;
      case 'large':
        baseStyle.push(styles.textLarge);
        break;
      default:
        baseStyle.push(styles.textMedium);
    }

    switch (variant) {
      case 'outline':
        baseStyle.push(styles.textOutline);
        break;
      case 'ghost':
        baseStyle.push(styles.textGhost);
        break;
      case 'secondary':
        baseStyle.push(styles.textSecondary);
        break;
      case 'danger':
        baseStyle.push(styles.textDanger);
        break;
      default:
        baseStyle.push(styles.textPrimary);
    }

    if (disabled) {
      baseStyle.push(styles.textDisabled);
    }

    return [...baseStyle, textStyle];
  };

  const renderIcon = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? COLORS.primary : COLORS.white}
        />
      );
    }

    if (icon) {
      return (
        <Ionicons
          name={icon}
          size={size === 'small' ? 16 : size === 'large' ? 24 : 18}
          color={
            variant === 'outline' || variant === 'ghost'
              ? COLORS.primary
              : variant === 'danger'
              ? COLORS.white
              : COLORS.white
          }
        />
      );
    }

    return null;
  };

  const renderContent = () => (
    <View style={styles.contentContainer}>
      {icon && iconPosition === 'left' && renderIcon()}
      {loading && !icon && <ActivityIndicator size="small" color={COLORS.white} />}
      <Text style={getTextStyle()}>{title}</Text>
      {icon && iconPosition === 'right' && renderIcon()}
    </View>
  );

  if (variant === 'primary' && !disabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={getButtonStyle()}
      >
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  buttonFullWidth: {
    alignSelf: 'stretch',
  },
  buttonSmall: {
    minHeight: 36,
  },
  buttonMedium: {
    minHeight: 44,
  },
  buttonLarge: {
    minHeight: 52,
  },
  buttonPrimary: {
    ...SHADOWS.small,
  },
  buttonSecondary: {
    backgroundColor: COLORS.secondary,
    ...SHADOWS.small,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  buttonGhost: {
    backgroundColor: `${COLORS.primary}15`,
  },
  buttonDanger: {
    backgroundColor: COLORS.error,
    ...SHADOWS.small,
  },
  buttonDisabled: {
    backgroundColor: COLORS.borderLight,
    borderColor: COLORS.borderLight,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    gap: SPACING.sm,
  },
  buttonText: {
    textAlign: 'center',
    fontWeight: FONTS.weights.black,
  },
  textSmall: {
    fontSize: FONTS.sizes.sm,
  },
  textMedium: {
    fontSize: FONTS.sizes.md,
  },
  textLarge: {
    fontSize: FONTS.sizes.lg,
  },
  textPrimary: {
    color: COLORS.white,
  },
  textSecondary: {
    color: COLORS.white,
  },
  textOutline: {
    color: COLORS.primary,
  },
  textGhost: {
    color: COLORS.primary,
  },
  textDanger: {
    color: COLORS.white,
  },
  textDisabled: {
    color: COLORS.gray,
  },
});

export default ModernButton;
