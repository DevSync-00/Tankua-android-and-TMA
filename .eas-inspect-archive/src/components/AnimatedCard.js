import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { COLORS, BORDER_RADIUS, SHADOWS, ANIMATIONS } from '../config/theme';

const AnimatedCard = ({ 
  children, 
  onPress, 
  style,
  delay = 0,
  variant = 'default',
  interactive = true,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateY: translateY.value },
      ],
      opacity: opacity.value,
    };
  });

  const handlePressIn = () => {
    if (interactive) {
      scale.value = withSpring(0.96, ANIMATIONS.spring);
    }
  };

  const handlePressOut = () => {
    if (interactive) {
      scale.value = withSpring(1, ANIMATIONS.spring);
    }
  };

  const cardStyle = [
    styles.card,
    styles[`card_${variant}`],
    style,
  ];

  if (onPress) {
    return (
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
          <Animated.View style={cardStyle}>
            {children}
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[animatedStyle, cardStyle]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.white,
    ...SHADOWS.medium,
  },
  card_default: {
    backgroundColor: COLORS.white,
  },
  card_glass: {
    backgroundColor: COLORS.cardBackgroundGlass,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  card_gradient: {
    backgroundColor: COLORS.primary,
  },
});

export default AnimatedCard;
