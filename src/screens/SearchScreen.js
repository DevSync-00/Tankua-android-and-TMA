import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, FlatList, StatusBar, Image, Modal, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { getDestinations } from '../services/database';
import { deduplicateDestinations } from '../utils/destinationUtils';
import { SkeletonCard } from '../components/SkeletonLoader';

const CATEGORIES = [
  { id: 'sacred',     label: 'Sacred Sites', icon: 'star' },
  { id: 'historical', label: 'Historical',   icon: 'library' },
  { id: 'adventure',  label: 'Adventures',   icon: 'bicycle' },
  { id: 'nature',     label: 'Nature',       icon: 'leaf' },
  { id: 'city',       label: 'City',         icon: 'business' },
  { id: 'cultural',   label: 'Cultural',     icon: 'people' },
];

const SORT_OPTIONS = [
  { value: 'rating',   label: 'Highest Rated' },
  { value: 'distance', label: 'Nearest First' },
  { value: 'price',    label: 'Price: Low → High' },
  { value: 'name',     label: 'A – Z' },
];
const PRICE_RANGES = [
  { value: 'low',    label: 'Budget',   sub: '< 500 ETB' },
  { value: 'medium', label: 'Moderate', sub: '500–1500' },
  { value: 'high',   label: 'Premium',  sub: '1500+ ETB' },
];
const RATINGS   = [{ value: 0, label: 'Any' }, { value: 3, label: '3+' }, { value: 4, label: '4+' }, { value: 4.5, label: '4.5+' }];
const DISTANCES = [{ value: null, label: 'Any' }, { value: 100, label: '100 km' }, { value: 200, label: '200 km' }, { value: 500, label: '500 km' }];

function transformDest(d) {
  return {
    id: d.id, name: d.name, description: d.description || '',
    region: d.region || '', city: d.city || '', distance: d.distance || 0,
    images: d.images || [], tags: d.tags || [], category: d.category || 'other',
    rating: d.rating || 4.5, review_count: d.review_count || 0,
    price: d.price || null, estimated_duration: d.estimated_duration || null,
  };
}

// ─── Discover card (horizontal scroll, image-dominant) ────────────────────────
const DiscoverCard = ({ item, onPress }) => {
  const img = item.images?.[0];
  const loc = item.city || item.region || '';
  return (
    <TouchableOpacity style={sC.discoverCard} onPress={onPress} activeOpacity={0.88}>
      {img
        ? <Image source={{ uri: img }} style={sC.discoverImg} resizeMode="cover" />
        : <View style={[sC.discoverImg, { backgroundColor: COLORS.backgroundGray, justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="image-outline" size={32} color={COLORS.grayLight} />
          </View>
      }
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.72)']} style={sC.discoverGrad} />
      {item.rating > 0 && (
        <View style={sC.ratingBadge}>
          <Ionicons name="star" size={11} color={COLORS.warning} />
          <Text style={sC.ratingText}>{item.rating.toFixed(1)}</Text>
        </View>
      )}
      <View style={sC.discoverMeta}>
        <Text style={sC.discoverName} numberOfLines={1}>{item.name}</Text>
        {loc ? <Text style={sC.discoverLoc} numberOfLines={1}>{loc}</Text> : null}
      </View>
    </TouchableOpacity>
  );
};

// ─── Deal card (horizontal list row) ──────────────────────────────────────────
const DealCard = ({ item, onPress }) => {
  const img = item.images?.[0];
  return (
    <TouchableOpacity style={sC.dealCard} onPress={onPress} activeOpacity={0.85}>
      {img
        ? <Image source={{ uri: img }} style={sC.dealImg} resizeMode="cover" />
        : <View style={[sC.dealImg, { backgroundColor: COLORS.backgroundGray, justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="image-outline" size={22} color={COLORS.grayLight} />
          </View>
      }
      <View style={sC.dealBody}>
        <Text style={sC.dealName} numberOfLines={1}>{item.name}</Text>
        <Text style={sC.dealSub} numberOfLines={1}>{item.description || (item.city || item.region || '')}</Text>
        {item.price
          ? <Text style={sC.dealPrice}>{item.price.toLocaleString()} ETB</Text>
          : null}
      </View>
      <TouchableOpacity style={sC.bookBtn} onPress={onPress} activeOpacity={0.85}>
        <Text style={sC.bookBtnText}>View</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

// ─── Search result card (full-width list) ─────────────────────────────────────
const ResultCard = ({ item, onPress }) => {
  const img = item.images?.[0];
  const loc = item.city || item.region || '';
  return (
    <TouchableOpacity style={sC.resultCard} onPress={onPress} activeOpacity={0.85}>
      {img
        ? <Image source={{ uri: img }} style={sC.resultImg} resizeMode="cover" />
        : <View style={[sC.resultImg, { backgroundColor: COLORS.backgroundGray, justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="image-outline" size={28} color={COLORS.grayLight} />
          </View>
      }
      <View style={sC.resultBody}>
        <Text style={sC.resultName} numberOfLines={1}>{item.name}</Text>
        {loc ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 4 }}>
            <Ionicons name="location-outline" size={12} color={COLORS.grayLight} />
            <Text style={sC.resultLoc} numberOfLines={1}>{loc}</Text>
          </View>
        ) : null}
        {item.rating > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Ionicons name="star" size={12} color={COLORS.warning} />
            <Text style={sC.resultRating}>{item.rating.toFixed(1)}</Text>
          </View>
        )}
      </View>
      {item.price ? <Text style={sC.resultPrice}>{item.price.toLocaleString()} ETB</Text> : null}
    </TouchableOpacity>
  );
};

// ─── Filters sheet ────────────────────────────────────────────────────────────
const Pill = ({ label, sub, active, onPress }) => (
  <TouchableOpacity style={[sC.pill, active && sC.pillActive]} onPress={onPress} activeOpacity={0.75}>
    <Text style={[sC.pillLabel, active && sC.pillLabelActive]}>{label}</Text>
    {sub ? <Text style={[sC.pillSub, active && sC.pillSubActive]}>{sub}</Text> : null}
  </TouchableOpacity>
);

const FiltersSheet = ({ visible, onClose, sortBy, setSortBy, priceRange, setPriceRange, minRating, setMinRating, maxDistance, setMaxDistance, onReset }) => (
  <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
    <View style={sC.overlay}>
      <View style={sC.sheet}>
        <View style={sC.sheetHandle} />
        <View style={sC.sheetHead}>
          <Text style={sC.sheetTitle}>Filters</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={22} color={COLORS.secondary} />
          </TouchableOpacity>
        </View>
        <ScrollView style={{ paddingHorizontal: SPACING.lg }} showsVerticalScrollIndicator={false}>
          <Text style={sC.fLabel}>Sort By</Text>
          {SORT_OPTIONS.map(o => (
            <TouchableOpacity key={o.value} style={[sC.fRow, sortBy === o.value && sC.fRowActive]} onPress={() => setSortBy(o.value)}>
              <Text style={[sC.fRowText, sortBy === o.value && sC.fRowTextActive]}>{o.label}</Text>
              {sortBy === o.value && <Ionicons name="checkmark" size={16} color={COLORS.primary} />}
            </TouchableOpacity>
          ))}
          <Text style={[sC.fLabel, { marginTop: SPACING.lg }]}>Price Range</Text>
          <View style={sC.pillRow}>{PRICE_RANGES.map(r => <Pill key={r.value} label={r.label} sub={r.sub} active={priceRange === r.value} onPress={() => setPriceRange(priceRange === r.value ? null : r.value)} />)}</View>
          <Text style={[sC.fLabel, { marginTop: SPACING.lg }]}>Min Rating</Text>
          <View style={sC.pillRow}>{RATINGS.map(r => <Pill key={r.value} label={r.label} active={minRating === r.value} onPress={() => setMinRating(r.value)} />)}</View>
          <Text style={[sC.fLabel, { marginTop: SPACING.lg }]}>Max Distance</Text>
          <View style={sC.pillRow}>{DISTANCES.map(d => <Pill key={d.value ?? 'any'} label={d.label} active={maxDistance === d.value} onPress={() => setMaxDistance(d.value)} />)}</View>
          <View style={{ height: SPACING.xl }} />
        </ScrollView>
        <View style={sC.sheetFoot}>
          <TouchableOpacity style={sC.resetBtn} onPress={onReset}><Text style={sC.resetBtnText}>Reset</Text></TouchableOpacity>
          <TouchableOpacity style={sC.applyBtn} onPress={onClose}><Text style={sC.applyBtnText}>Apply</Text></TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

// ─── Main screen ──────────────────────────────────────────────────────────────
const SearchScreen = ({ navigation }) => {
  const [query,        setQuery]        = useState('');
  const [category,     setCategory]     = useState(null);
  const [discover,     setDiscover]     = useState([]);
  const [deals,        setDeals]        = useState([]);
  const [results,      setResults]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [showFilters,  setShowFilters]  = useState(false);
  const [sortBy,       setSortBy]       = useState('rating');
  const [priceRange,   setPriceRange]   = useState(null);
  const [minRating,    setMinRating]    = useState(0);
  const [maxDistance,  setMaxDistance]  = useState(null);

  const isSearching = query.trim().length > 0 || category !== null;
  const filterCount = [minRating > 0, priceRange !== null, maxDistance !== null, sortBy !== 'rating'].filter(Boolean).length;

  const applySort = useCallback((list) => {
    let out = [...list];
    if (minRating > 0) out = out.filter(d => (d.rating || 0) >= minRating);
    if (maxDistance)   out = out.filter(d => (d.distance || 0) <= maxDistance);
    if (priceRange) out = out.filter(d => {
      const p = d.price || 0;
      if (priceRange === 'low')    return p < 500;
      if (priceRange === 'medium') return p >= 500 && p < 1500;
      return p >= 1500;
    });
    out.sort((a, b) => {
      if (sortBy === 'distance') return (a.distance || 0) - (b.distance || 0);
      if (sortBy === 'price')    return (a.price || 0) - (b.price || 0);
      if (sortBy === 'name')     return (a.name || '').localeCompare(b.name || '');
      return (b.rating || 0) - (a.rating || 0);
    });
    return out;
  }, [minRating, maxDistance, priceRange, sortBy]);

  useEffect(() => { loadHome(); }, []);
  useEffect(() => { if (isSearching) loadSearch(); }, [query, category, sortBy, priceRange, minRating, maxDistance]);

  const loadHome = async () => {
    try {
      setLoading(true);
      const raw = await getDestinations({});
      const all = deduplicateDestinations(raw.map(transformDest));
      const top = [...all].sort((a, b) => (b.rating || 0) - (a.rating || 0));
      setDiscover(top.slice(0, 8));
      setDeals(top.filter(d => d.price).slice(0, 6));
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const loadSearch = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (category)     filters.category = category;
      if (query.trim()) filters.search   = query.trim();
      const raw = await getDestinations(filters);
      setResults(applySort(deduplicateDestinations(raw.map(transformDest))));
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const onRefresh = () => { setRefreshing(true); isSearching ? loadSearch() : loadHome(); };
  const handleReset = () => { setSortBy('rating'); setPriceRange(null); setMinRating(0); setMaxDistance(null); };
  const handleClear = () => { setQuery(''); setCategory(null); handleReset(); };
  const goTo = (item) => navigation.navigate('DestinationDetail', { destination: item });

  return (
    <SafeAreaView style={sC.screen} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* ── Sticky header ── */}
      <View style={sC.header}>
        <Text style={sC.appName}>Explore</Text>
        <TouchableOpacity style={sC.bellBtn} onPress={() => navigation.navigate('Notifications')}>
          <Ionicons name="notifications-outline" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
      </View>

      {/* ── Search bar ── */}
      <View style={sC.searchWrap}>
        <View style={sC.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.grayLight} style={{ marginRight: SPACING.sm }} />
          <TextInput
            style={sC.searchInput}
            placeholder="Where to?"
            placeholderTextColor={COLORS.grayLight}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoCorrect={false}
          />
          {(query.length > 0 || category) && (
            <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={COLORS.grayLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={sC.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* ── Categories ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sC.catRow}>
          {CATEGORIES.map(cat => {
            const active = category === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[sC.catItem, active && sC.catItemActive]}
                onPress={() => setCategory(active ? null : cat.id)}
                activeOpacity={0.75}
              >
                <View style={[sC.catIcon, active && sC.catIconActive]}>
                  <Ionicons name={cat.icon} size={22} color={active ? COLORS.white : COLORS.secondary} />
                </View>
                <Text style={[sC.catLabel, active && sC.catLabelActive]}>{cat.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {isSearching ? (
          /* ── Search results ── */
          <>
            <View style={sC.sectionHead}>
              <Text style={sC.sectionTitle}>
                {loading ? 'Searching…' : `${results.length} Result${results.length !== 1 ? 's' : ''}`}
              </Text>
              <TouchableOpacity
                style={[sC.filterBtn, filterCount > 0 && sC.filterBtnOn]}
                onPress={() => setShowFilters(true)}
              >
                <Ionicons name="options-outline" size={14} color={filterCount > 0 ? COLORS.white : COLORS.secondary} />
                <Text style={[sC.filterBtnText, filterCount > 0 && { color: COLORS.white }]}>
                  {filterCount > 0 ? `Filters · ${filterCount}` : 'Filters'}
                </Text>
              </TouchableOpacity>
            </View>
            {loading
              ? [0,1,2,3].map(i => <View key={i} style={{ paddingHorizontal: SPACING.md, marginBottom: SPACING.sm }}><SkeletonCard width="100%" height={80} /></View>)
              : results.length === 0
                ? <View style={sC.emptyWrap}><Ionicons name="search-outline" size={48} color={COLORS.grayLight} /><Text style={sC.emptyTitle}>No results</Text><Text style={sC.emptySub}>Try different keywords or clear filters.</Text></View>
                : results.map(item => <ResultCard key={item.id} item={item} onPress={() => goTo(item)} />)
            }
          </>
        ) : (
          /* ── Home discovery ── */
          <>
            {/* Discover */}
            <View style={sC.sectionHead}>
              <Text style={sC.sectionTitle}>Discover</Text>
              <TouchableOpacity><Text style={sC.viewAll}>View all</Text></TouchableOpacity>
            </View>
            {loading
              ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sC.discoverRow}>{[0,1,2].map(i => <View key={i} style={{ marginRight: SPACING.md }}><SkeletonCard width={200} height={200} /></View>)}</ScrollView>
              : <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sC.discoverRow}>
                  {discover.map(item => <DiscoverCard key={item.id} item={item} onPress={() => goTo(item)} />)}
                </ScrollView>
            }

            {/* Special Deals */}
            <View style={sC.sectionHead}>
              <Text style={sC.sectionTitle}>Special Deals</Text>
              <TouchableOpacity><Text style={sC.viewAll}>View all</Text></TouchableOpacity>
            </View>
            {loading
              ? [0,1].map(i => <View key={i} style={{ paddingHorizontal: SPACING.md, marginBottom: SPACING.sm }}><SkeletonCard width="100%" height={80} /></View>)
              : deals.length > 0
                ? deals.map(item => <DealCard key={item.id} item={item} onPress={() => goTo(item)} />)
                : <View style={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.md }}>
                    {discover.slice(0, 4).map(item => <DealCard key={item.id} item={item} onPress={() => goTo(item)} />)}
                  </View>
            }
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <FiltersSheet
        visible={showFilters} onClose={() => setShowFilters(false)}
        sortBy={sortBy} setSortBy={setSortBy}
        priceRange={priceRange} setPriceRange={setPriceRange}
        minRating={minRating} setMinRating={setMinRating}
        maxDistance={maxDistance} setMaxDistance={setMaxDistance}
        onReset={handleReset}
      />
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const sC = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.backgroundSecondary },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, paddingBottom: SPACING.xs,
    backgroundColor: COLORS.white },
  appName: { fontSize: FONTS.sizes.xxxl, fontWeight: FONTS.weights.black, color: COLORS.secondary, letterSpacing: -0.8 },
  bellBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center', alignItems: 'center' },

  // Search
  searchWrap: { backgroundColor: COLORS.white, paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md, paddingTop: SPACING.xs },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.lg, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2,
    borderWidth: 1, borderColor: COLORS.borderLight },
  searchInput: { flex: 1, fontSize: FONTS.sizes.md, color: COLORS.secondary, padding: 0 },

  scroll: { paddingBottom: 20 },

  // Categories
  catRow: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, gap: SPACING.md,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  catItem: { alignItems: 'center', gap: 6, minWidth: 60 },
  catItemActive: {},
  catIcon: { width: 52, height: 52, borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundSecondary, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.borderLight },
  catIconActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catLabel: { fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.semibold,
    color: COLORS.secondary, textAlign: 'center' },
  catLabelActive: { color: COLORS.primary, fontWeight: FONTS.weights.bold },

  // Section
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingTop: SPACING.lg, paddingBottom: SPACING.sm },
  sectionTitle: { fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.black,
    color: COLORS.secondary, letterSpacing: -0.3 },
  viewAll: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold, color: COLORS.primary },

  // Filter btn
  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.backgroundSecondary, paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2, borderRadius: BORDER_RADIUS.full,
    borderWidth: 1, borderColor: COLORS.borderLight },
  filterBtnOn: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  filterBtnText: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, color: COLORS.secondary },

  // Discover card
  discoverRow: { paddingHorizontal: SPACING.md, gap: SPACING.md },
  discoverCard: { width: 200, height: 200, borderRadius: BORDER_RADIUS.xl, overflow: 'hidden',
    ...SHADOWS.medium },
  discoverImg: { width: '100%', height: '100%' },
  discoverGrad: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 90 },
  ratingBadge: { position: 'absolute', top: SPACING.sm, left: SPACING.sm,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full },
  ratingText: { fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.bold, color: COLORS.white },
  discoverMeta: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: SPACING.md },
  discoverName: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.black, color: COLORS.white,
    marginBottom: 2 },
  discoverLoc: { fontSize: FONTS.sizes.xs, color: 'rgba(255,255,255,0.8)' },

  // Deal card
  dealCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md, marginBottom: SPACING.sm, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm, ...SHADOWS.small, borderWidth: 1, borderColor: COLORS.borderLight },
  dealImg: { width: 68, height: 68, borderRadius: BORDER_RADIUS.md },
  dealBody: { flex: 1, paddingHorizontal: SPACING.md },
  dealName: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.secondary,
    marginBottom: 2 },
  dealSub: { fontSize: FONTS.sizes.xs, color: COLORS.gray, marginBottom: 4 },
  dealPrice: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.black, color: COLORS.primary },
  bookBtn: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.md },
  bookBtnText: { fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.black, color: COLORS.white },

  // Result card
  resultCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md, marginBottom: SPACING.sm, borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden', ...SHADOWS.small, borderWidth: 1, borderColor: COLORS.borderLight },
  resultImg: { width: 90, height: 80 },
  resultBody: { flex: 1, padding: SPACING.md },
  resultName: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.secondary, marginBottom: 3 },
  resultLoc: { fontSize: FONTS.sizes.xs, color: COLORS.grayLight },
  resultRating: { fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.bold, color: COLORS.secondary },
  resultPrice: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.black, color: COLORS.primary,
    paddingRight: SPACING.md },

  // Empty
  emptyWrap: { alignItems: 'center', paddingVertical: SPACING.xxl * 2, gap: SPACING.sm, paddingHorizontal: SPACING.xl },
  emptyTitle: { fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.black, color: COLORS.secondary, marginTop: SPACING.md },
  emptySub: { fontSize: FONTS.sizes.md, color: COLORS.gray, textAlign: 'center' },

  // Filters sheet
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '82%' },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border,
    alignSelf: 'center', marginTop: SPACING.sm },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  sheetTitle: { fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.black, color: COLORS.secondary },
  fLabel: { fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.black, color: COLORS.grayLight,
    letterSpacing: 0.8, marginBottom: SPACING.sm, marginTop: SPACING.md },
  fRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: SPACING.md, paddingHorizontal: SPACING.md, borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xs, backgroundColor: COLORS.backgroundSecondary },
  fRowActive: { backgroundColor: `${COLORS.primary}15`, borderWidth: 1, borderColor: COLORS.primary },
  fRowText: { fontSize: FONTS.sizes.md, color: COLORS.secondary, fontWeight: FONTS.weights.medium },
  fRowTextActive: { color: COLORS.primary, fontWeight: FONTS.weights.bold },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  pill: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundSecondary, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  pillActive: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  pillLabel: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, color: COLORS.secondary },
  pillLabelActive: { color: COLORS.white },
  pillSub: { fontSize: 10, color: COLORS.grayLight, marginTop: 1 },
  pillSubActive: { color: 'rgba(255,255,255,0.65)' },
  sheetFoot: { flexDirection: 'row', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    gap: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  resetBtn: { flex: 1, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.backgroundSecondary, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  resetBtnText: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.secondary },
  applyBtn: { flex: 2, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.secondary, alignItems: 'center' },
  applyBtnText: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.white },
});

export default SearchScreen;
