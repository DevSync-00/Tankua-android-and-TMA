import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CountryPicker, { Flag } from 'react-native-country-picker-modal';
import { AUTH_COLORS, AUTH_LAYOUT } from './authTheme';

const PhoneCountryInput = ({
  countryCode,
  callingCode,
  onSelectCountry,
  value,
  onChangeText,
  placeholder,
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.wrapper, focused && styles.wrapperFocused]}>
      <CountryPicker
        countryCode={countryCode}
        withFilter
        withFlag
        withEmoji
        withCallingCode
        onSelect={onSelectCountry}
        containerButtonStyle={styles.pickerContainer}
        renderFlagButton={({ countryCode: code, onOpen }) => (
          <Pressable
            style={styles.countryButton}
            onPress={onOpen}
            accessibilityRole="button"
            accessibilityLabel="Select country code"
          >
            <Flag countryCode={code} withEmoji flagSize={24} />
            <Text style={styles.callingCode}>+{callingCode}</Text>
            <Ionicons name="chevron-down" size={16} color={AUTH_COLORS.textMuted} />
          </Pressable>
        )}
      />

      <View style={styles.divider} />

      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChangeText}
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        autoComplete="tel"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: AUTH_LAYOUT.inputHeight,
    backgroundColor: AUTH_COLORS.inputBackground,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingRight: 14,
    marginTop: 24,
  },
  wrapperFocused: {
    borderColor: 'rgba(255, 184, 0, 0.55)',
    backgroundColor: '#FFFFFF',
  },
  pickerContainer: {
    padding: 0,
  },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 10,
    height: '100%',
    gap: 6,
  },
  callingCode: {
    fontSize: 16,
    fontWeight: '600',
    color: AUTH_COLORS.text,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: '#E5E7EB',
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: AUTH_COLORS.text,
    paddingVertical: 0,
  },
});

export default PhoneCountryInput;
