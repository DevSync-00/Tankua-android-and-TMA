import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const VARIANT_CONFIG = {
  error: {
    bg: '#FEF2F2',
    border: '#FCA5A5',
    text: '#991B1B',
    iconColor: '#DC2626',
    iconName: 'alert-circle',
  },
  warning: {
    bg: '#FFFBEB',
    border: '#FDE68A',
    text: '#92400E',
    iconColor: '#D97706',
    iconName: 'warning',
  },
  success: {
    bg: '#ECFDF5',
    border: '#A7F3D0',
    text: '#065F46',
    iconColor: '#059669',
    iconName: 'checkmark-circle',
  },
  info: {
    bg: '#F0F9FF',
    border: '#BAE6FD',
    text: '#075985',
    iconColor: '#0284C7',
    iconName: 'information-circle',
  },
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 8,
  },
  iconWrapper: {
    marginRight: 10,
  },
  textWrapper: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  dismissBtn: {
    padding: 4,
    marginLeft: 8,
  },
});

export default function InlineBanner({
  variant = 'error',
  title,
  message,
  onDismiss,
  style,
}) {
  const config = VARIANT_CONFIG[variant] || VARIANT_CONFIG.error;
  const { iconName, bg, border, text, iconColor } = config;

  if (!message && !title) return null;

  return (
    <View style={[styles.banner, { backgroundColor: bg, borderColor: border }, style]} accessibilityRole="alert">
      <View style={styles.iconWrapper}>
        <Ionicons name={iconName} size={20} color={iconColor} />
      </View>
      <View style={styles.textWrapper}>
        {title ? <Text style={[styles.title, { color: text }]}>{title}</Text> : null}
        {message ? <Text style={[styles.message, { color: text }]}>{message}</Text> : null}
      </View>
      {onDismiss ? (
        <Pressable onPress={onDismiss} style={styles.dismissBtn} hitSlop={6}>
          <Ionicons name="close" size={16} color={iconColor} />
        </Pressable>
      ) : null}
    </View>
  );
}
