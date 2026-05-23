import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Flag } from 'react-native-country-picker-modal';
import { authStyles } from './authTheme';
import CountryPickerSheet from './CountryPickerSheet';

const PhoneCountryInput = ({
  countryCode,
  callingCode,
  onSelectCountry,
  value,
  onChangeText,
  placeholder,
}) => {
  const [pickerVisible, setPickerVisible] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <>
      <View style={[authStyles.phoneInput, focused && styles.focused]}>
        <Pressable
          style={styles.codeButton}
          onPress={() => setPickerVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Choose country code"
        >
          <Flag countryCode={countryCode} withEmoji flagSize={22} />
          <Text style={styles.callingCode}>+{callingCode}</Text>
          <Ionicons name="chevron-down" size={14} color="#7D848D" />
        </Pressable>

        <View style={authStyles.phoneDivider} />

        <TextInput
          style={authStyles.phoneInputField}
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

      <CountryPickerSheet
        visible={pickerVisible}
        countryCode={countryCode}
        onClose={() => setPickerVisible(false)}
        onSelect={onSelectCountry}
      />
    </>
  );
};

const styles = StyleSheet.create({
  focused: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.45)',
  },
  codeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 4,
  },
  callingCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B1E28',
  },
});

export default PhoneCountryInput;
