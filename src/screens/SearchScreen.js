import React, { useEffect, useMemo, useState } from 'react';
import {
  Image, RefreshControl, SafeAreaView, ScrollView, StatusBar, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { getDestinations, getPlaceholderImage } from '../services/database';
import { deduplicateDestinations } from '../utils/destinationUtils';
import { SkeletonCard } from '../components/SkeletonLoader';

const CATEGORIES = ['All', 'Historical', 'Nature', 'Adventure', 'Religious', 'Hiking', 'Cultural'];
const SUGGESTIONS = ['Lalibela', 'Gondar', 'Nature', 'Adventure'];

function normalizeDestination(destination) {
  return {
    ...destination,
    description: destination.description || '',
    region: destination.region || '',
    city: destination.city || '',
    images: Array.isArray(destination.images) ? destination.images : [],
    tags: Array.isArray(destination.tags) ? destination.tags : [],
    category: destination.category || 'other',
    rating: Number(destination.rating || 0),
    price: Number(destination.price || 0),
  };
}

function ResultCard({ destination, onPress }) {
  const image = destination.images[0]
    || getPlaceholderImage(destination.id, destination.name, destination.category);
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.86}>
      <View style={styles.imageWrap}>
        <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{destination.category}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>{destination.name}</Text>
        <View style={styles.inline}>
          <Ionicons name="location-outline" size={13} color={COLORS.gray} />
          <Text style={styles.location} numberOfLines={1}>
            {destination.city || destination.region || 'Ethiopia'}
          </Text>
        </View>
        <View style={styles.cardFooter}>
          <View style={styles.inline}>
            <Ionicons name="star" size={13} color={COLORS.warning} />
            <Text style={styles.rating}>{destination.rating || 'New'}</Text>
          </View>
          {destination.price > 0 && (
            <Text style={styles.price}>From ETB {destination.price.toLocaleString()}</Text>
          )}
        </View>
      </View>
      <View style={styles.chevron}>
        <Ionicons name="chevron-forward" size={17} color={COLORS.gray} />
      </View>
    </TouchableOpacity>
  );
}

export default function SearchScreen({ navigation }) {
  const [destinations, setDestinations] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const rows = await getDestinations({});
      setDestinations(deduplicateDestinations(rows.map(normalizeDestination)));
    } catch (error) {
      console.error('Could not load destinations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const cleanQuery = query.trim().toLowerCase();
  const filtered = useMemo(() => destinations.filter((destination) => {
    const categoryMatches = category === 'All'
      || destination.category.toLowerCase() === category.toLowerCase();
    const searchable = `${destination.name} ${destination.city} ${destination.region} ${destination.category}`.toLowerCase();
    return categoryMatches && (!cleanQuery || searchable.includes(cleanQuery));
  }), [destinations, category, cleanQuery]);

  const reset = () => {
    setQuery('');
    setCategory('All');
  };

  const filteredMode = Boolean(cleanQuery) || category !== 'All';

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={COLORS.primary} />}
      >
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>DISCOVER ETHIOPIA</Text>
          <Text style={styles.title}>Find a place you'll <Text style={styles.titleAccent}>love.</Text></Text>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={19} color={COLORS.gray} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
            placeholder="Search places or cities"
            placeholderTextColor={COLORS.grayLight}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} accessibilityLabel="Clear search">
              <Ionicons name="close" size={18} color={COLORS.gray} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {CATEGORIES.map((item) => {
            const selected = item === category;
            return (
              <TouchableOpacity
                key={item}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => setCategory(item)}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {!cleanQuery && (
          <View style={styles.suggestions}>
            <Text style={styles.tryText}>Try</Text>
            {SUGGESTIONS.map((item) => (
              <TouchableOpacity key={item} style={styles.suggestion} onPress={() => setQuery(item)}>
                <Text style={styles.suggestionText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle}>
            {filteredMode ? `${filtered.length} match${filtered.length === 1 ? '' : 'es'}` : 'Places for you'}
          </Text>
          <Text style={styles.resultSubtitle}>{filteredMode ? 'Filtered results' : 'Handpicked by Tankua'}</Text>
        </View>

        {loading ? [0, 1, 2, 3].map((item) => (
          <View key={item} style={styles.skeleton}><SkeletonCard width="100%" height={108} /></View>
        )) : filtered.length ? filtered.map((destination) => (
          <ResultCard
            key={destination.id}
            destination={destination}
            onPress={() => navigation.navigate('DestinationDetail', { destination })}
          />
        )) : (
          <View style={styles.empty}>
            <Ionicons name="compass-outline" size={54} color={COLORS.primary} />
            <Text style={styles.emptyTitle}>No journeys found</Text>
            <Text style={styles.emptyText}>Try another place, city, or experience.</Text>
            <TouchableOpacity style={styles.showAllButton} onPress={reset}>
              <Text style={styles.showAllText}>Show all places</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.backgroundSecondary },
  content: { paddingBottom: 110 },
  hero: { backgroundColor: COLORS.white, paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.md },
  eyebrow: { color: COLORS.primary, fontSize: 11, fontWeight: FONTS.weights.black, letterSpacing: 1.4, marginBottom: 6 },
  title: { color: COLORS.secondary, fontSize: 30, lineHeight: 37, fontWeight: FONTS.weights.black, letterSpacing: -0.7 },
  titleAccent: { color: COLORS.primary, fontStyle: 'italic' },
  searchBar: { marginHorizontal: SPACING.md, marginTop: SPACING.md, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.borderLight, borderRadius: BORDER_RADIUS.lg, paddingHorizontal: SPACING.md, height: 52, ...SHADOWS.small },
  searchInput: { flex: 1, color: COLORS.secondary, fontSize: FONTS.sizes.md, paddingVertical: 0 },
  chips: { paddingHorizontal: SPACING.md, paddingVertical: 14, gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.full },
  chipSelected: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  chipText: { color: COLORS.secondary, fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold },
  chipTextSelected: { color: COLORS.white, fontWeight: FONTS.weights.bold },
  suggestions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', paddingHorizontal: SPACING.md, gap: 7, marginBottom: SPACING.sm },
  tryText: { color: COLORS.gray, fontSize: FONTS.sizes.sm, marginRight: 2 },
  suggestion: { backgroundColor: `${COLORS.primary}14`, borderRadius: BORDER_RADIUS.full, paddingHorizontal: 11, paddingVertical: 6 },
  suggestionText: { color: COLORS.primary, fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.bold },
  resultHeader: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  resultTitle: { color: COLORS.secondary, fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.black },
  resultSubtitle: { color: COLORS.gray, fontSize: FONTS.sizes.sm, marginTop: 2 },
  card: { minHeight: 108, flexDirection: 'row', alignItems: 'center', marginHorizontal: SPACING.md, marginBottom: SPACING.sm, backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, borderWidth: 1, borderColor: COLORS.borderLight, overflow: 'hidden', ...SHADOWS.small },
  imageWrap: { width: 112, height: 108 },
  image: { width: '100%', height: '100%' },
  categoryBadge: { position: 'absolute', left: 7, bottom: 7, backgroundColor: 'rgba(5,15,28,.75)', borderRadius: BORDER_RADIUS.full, paddingHorizontal: 7, paddingVertical: 3 },
  categoryBadgeText: { color: COLORS.white, fontSize: 9, fontWeight: FONTS.weights.bold, textTransform: 'capitalize' },
  cardBody: { flex: 1, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  cardTitle: { color: COLORS.secondary, fontSize: FONTS.sizes.md, lineHeight: 20, fontWeight: FONTS.weights.bold, marginBottom: 5 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  location: { flexShrink: 1, color: COLORS.gray, fontSize: FONTS.sizes.xs },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  rating: { color: COLORS.secondary, fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.bold },
  price: { color: COLORS.primary, fontSize: 11, fontWeight: FONTS.weights.black },
  chevron: { paddingRight: SPACING.sm },
  skeleton: { marginHorizontal: SPACING.md, marginBottom: SPACING.sm },
  empty: { alignItems: 'center', paddingHorizontal: SPACING.xl, paddingVertical: 50 },
  emptyTitle: { color: COLORS.secondary, fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.black, marginTop: SPACING.md },
  emptyText: { color: COLORS.gray, fontSize: FONTS.sizes.md, textAlign: 'center', marginTop: 5 },
  showAllButton: { marginTop: SPACING.lg, backgroundColor: COLORS.secondary, borderRadius: BORDER_RADIUS.lg, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md },
  showAllText: { color: COLORS.white, fontWeight: FONTS.weights.bold },
});
