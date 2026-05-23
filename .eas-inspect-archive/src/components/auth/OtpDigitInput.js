import React, { useRef } from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import { AUTH_COLORS, AUTH_LAYOUT } from './authTheme';

const OtpDigitInput = ({ digits, onChangeDigits }) => {
  const refs = useRef([]);

  const updateAt = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    onChangeDigits(next);
    if (digit && index < 5) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index, key) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (text) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 6);
    if (!cleaned) return;
    const next = ['', '', '', '', '', ''];
    cleaned.split('').forEach((char, index) => {
      next[index] = char;
    });
    onChangeDigits(next);
    refs.current[Math.min(cleaned.length, 5)]?.focus();
  };

  return (
    <View style={styles.row}>
      {digits.map((digit, index) => (
        <Pressable
          key={String(index)}
          style={[styles.cell, digit ? styles.cellFilled : null]}
          onPress={() => refs.current[index]?.focus()}
        >
          <TextInput
            ref={(ref) => {
              refs.current[index] = ref;
            }}
            style={styles.input}
            value={digit}
            onChangeText={(value) => {
              if (value.length > 1) {
                handlePaste(value);
                return;
              }
              updateAt(index, value);
            }}
            onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
            keyboardType="number-pad"
            maxLength={6}
            selectTextOnFocus
            textContentType={index === 0 ? 'oneTimeCode' : 'none'}
            autoFocus={index === 0}
          />
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 8,
  },
  cell: {
    flex: 1,
    maxWidth: AUTH_LAYOUT.otpSize,
    height: AUTH_LAYOUT.otpSize + 10,
    borderRadius: 12,
    backgroundColor: AUTH_COLORS.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellFilled: {
    backgroundColor: '#F0F0F4',
  },
  input: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: AUTH_COLORS.text,
    padding: 0,
  },
});

export default OtpDigitInput;
