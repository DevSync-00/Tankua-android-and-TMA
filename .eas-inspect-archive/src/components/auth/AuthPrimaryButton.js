import React from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { COLORS } from '../../config/theme';
import { authStyles } from './authTheme';

const AuthPrimaryButton = ({ label, onPress, loading = false, disabled = false }) => (
  <Pressable
    style={({ pressed }) => [
      authStyles.primaryButton,
      (disabled || loading) && authStyles.primaryButtonDisabled,
      pressed && !disabled && !loading && { opacity: 0.92 },
    ]}
    onPress={onPress}
    disabled={disabled || loading}
  >
    {loading ? (
      <ActivityIndicator color={COLORS.white} />
    ) : (
      <Text style={authStyles.primaryButtonText}>{label}</Text>
    )}
  </Pressable>
);

export default AuthPrimaryButton;
