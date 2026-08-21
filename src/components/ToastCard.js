import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const VARIANT_STYLES = {
  success: {
    bg: '#064E3B',
    border: '#10B981',
    iconColor: '#34D399',
    iconName: 'checkmark-circle',
  },
  error: {
    bg: '#4C1D95',
    border: '#EF4444',
    iconColor: '#F87171',
    iconName: 'alert-circle',
  },
  warning: {
    bg: '#78350F',
    border: '#F59E0B',
    iconColor: '#FBBF24',
    iconName: 'warning',
  },
  info: {
    bg: '#0C4A6E',
    border: '#0284C7',
    iconColor: '#38BDF8',
    iconName: 'information-circle',
  },
  neutral: {
    bg: '#1E293B',
    border: '#64748B',
    iconColor: '#94A3B8',
    iconName: 'notifications',
  },
};

const styles = StyleSheet.create({
  card: {
    width: width - 32,
    maxWidth: 440,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  message: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 8,
  },
});

export default function ToastCard({ toast, onClose }) {
  const { type = 'info', title, message } = toast;
  const config = VARIANT_STYLES[type] || VARIANT_STYLES.info;
  const { iconName, bg, border, iconColor } = config;

  const translateY = useRef(new Animated.Value(-60)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -40,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: bg,
          borderColor: border,
          transform: [{ translateY }],
          opacity,
        },
      ]}
      accessibilityRole="alert"
    >
      <View style={styles.iconContainer}>
        <Ionicons name={iconName} size={22} color={iconColor} />
      </View>
      <View style={styles.textContainer}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        <Text style={styles.message} numberOfLines={3}>
          {message}
        </Text>
      </View>
      <Pressable onPress={handleDismiss} style={styles.closeBtn} hitSlop={8}>
        <Ionicons name="close" size={18} color="#94A3B8" />
      </Pressable>
    </Animated.View>
  );
}
