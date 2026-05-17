import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getAllCountries, Flag, FlagType } from 'react-native-country-picker-modal';
import { COLORS, FONTS, BORDER_RADIUS } from '../../config/theme';
import { AUTH_COLORS, AUTH_LAYOUT } from './authTheme';

const CountryPickerSheet = ({ visible, countryCode, onClose, onSelect }) => {
  const insets = useSafeAreaInsets();
  const [countries, setCountries] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!visible) return;
    setQuery('');
    getAllCountries(
      FlagType.EMOJI,
      'common',
      undefined,
      undefined,
      undefined,
      undefined,
      ['ET', 'US', 'GB', 'KE']
    )
      .then(setCountries)
      .catch(() => setCountries([]));
  }, [visible]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter((country) => {
      const name =
        typeof country.name === 'string'
          ? country.name
          : country.name?.common || '';
      const code = country.callingCode?.[0] || '';
      return (
        name.toLowerCase().includes(q) ||
        country.cca2.toLowerCase().includes(q) ||
        code.includes(q.replace('+', ''))
      );
    });
  }, [countries, query]);

  const preferred = useMemo(
    () => filtered.filter((c) => ['ET', 'US', 'GB', 'KE'].includes(c.cca2)),
    [filtered]
  );

  const rest = useMemo(
    () => filtered.filter((c) => !['ET', 'US', 'GB', 'KE'].includes(c.cca2)),
    [filtered]
  );

  const listData = useMemo(() => {
    if (!query.trim()) {
      return [
        ...(preferred.length ? [{ type: 'header', id: 'preferred' }] : []),
        ...preferred.map((c) => ({ type: 'country', country: c })),
        { type: 'header', id: 'all' },
        ...rest.map((c) => ({ type: 'country', country: c })),
      ];
    }
    return filtered.map((c) => ({ type: 'country', country: c }));
  }, [filtered, preferred, rest, query]);

  const handleSelect = (country) => {
    onSelect(country);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.handle} />

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Select country</Text>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={AUTH_COLORS.text} />
            </Pressable>
          </View>

          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color={AUTH_COLORS.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search country or code"
              placeholderTextColor="#9CA3AF"
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
          </View>

          <FlatList
            data={listData}
            keyExtractor={(item, index) =>
              item.type === 'header' ? item.id : `${item.country.cca2}-${index}`
            }
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.list}
            renderItem={({ item }) => {
              if (item.type === 'header') {
                return (
                  <Text style={styles.sectionLabel}>
                    {item.id === 'preferred' ? 'Suggested' : 'All countries'}
                  </Text>
                );
              }

              const country = item.country;
              const calling = country.callingCode?.[0] || '';
              const name =
                typeof country.name === 'string'
                  ? country.name
                  : country.name?.common || country.cca2;
              const selected = country.cca2 === countryCode;

              return (
                <Pressable
                  style={[styles.row, selected && styles.rowSelected]}
                  onPress={() => handleSelect(country)}
                >
                  <Flag countryCode={country.cca2} withEmoji flagSize={24} />
                  <Text style={styles.rowName} numberOfLines={1}>
                    {name}
                  </Text>
                  <Text style={styles.rowCode}>+{calling}</Text>
                  {selected ? (
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                  ) : null}
                </Pressable>
              );
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '78%',
    paddingTop: 8,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: AUTH_LAYOUT.screenPadding,
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: FONTS.weights.bold,
    color: AUTH_COLORS.text,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AUTH_COLORS.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: AUTH_LAYOUT.screenPadding,
    marginBottom: 8,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: AUTH_COLORS.inputBackground,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: AUTH_COLORS.text,
    paddingVertical: 0,
  },
  list: {
    paddingHorizontal: AUTH_LAYOUT.screenPadding,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: FONTS.weights.semibold,
    color: AUTH_COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 12,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: BORDER_RADIUS.md,
    gap: 12,
    marginBottom: 4,
  },
  rowSelected: {
    backgroundColor: COLORS.backgroundSecondary,
  },
  rowName: {
    flex: 1,
    fontSize: 16,
    color: AUTH_COLORS.text,
    fontWeight: FONTS.weights.medium,
  },
  rowCode: {
    fontSize: 15,
    color: AUTH_COLORS.textMuted,
    fontWeight: FONTS.weights.semibold,
    marginRight: 4,
  },
});

export default CountryPickerSheet;
