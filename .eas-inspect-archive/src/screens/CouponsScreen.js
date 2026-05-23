import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import Loader from '../components/Loader';
import ModernButton from '../components/ModernButton';

const CouponsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .gte('valid_until', now)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error('Error loading coupons:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCopyCode = (code) => {
    // In a real app, copy to clipboard
    Alert.alert('Copied!', `Coupon code "${code}" copied to clipboard`);
  };

  const formatDiscount = (coupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}% OFF`;
    }
    return `${coupon.discount_value} ETB OFF`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.secondary} />
          </TouchableOpacity>
          <Text style={styles.title}>Coupons</Text>
          <View style={styles.placeholder} />
        </View>
        <Loader />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Coupons</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadCoupons();
            }}
            tintColor={COLORS.primary}
          />
        }
      >
        {coupons.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="pricetag-outline" size={64} color={COLORS.grayLight} />
            <Text style={styles.emptyText}>No coupons available</Text>
            <Text style={styles.emptySubtext}>
              Check back later for special offers and discounts
            </Text>
          </View>
        ) : (
          coupons.map((coupon) => (
            <View key={coupon.id} style={styles.couponCard}>
              <View style={styles.couponHeader}>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{formatDiscount(coupon)}</Text>
                </View>
                <View style={styles.couponInfo}>
                  <Text style={styles.couponName}>{coupon.name}</Text>
                  {coupon.description && (
                    <Text style={styles.couponDescription}>{coupon.description}</Text>
                  )}
                </View>
              </View>
              
              <View style={styles.couponCodeContainer}>
                <View style={styles.codeBox}>
                  <Text style={styles.codeText}>{coupon.code}</Text>
                </View>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => handleCopyCode(coupon.code)}
                >
                  <Ionicons name="copy-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.copyText}>Copy</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.couponFooter}>
                <View style={styles.validityInfo}>
                  <Ionicons name="calendar-outline" size={16} color={COLORS.gray} />
                  <Text style={styles.validityText}>
                    Valid until {formatDate(coupon.valid_until)}
                  </Text>
                </View>
                {coupon.min_booking_amount > 0 && (
                  <Text style={styles.minAmountText}>
                    Min. order: {coupon.min_booking_amount} ETB
                  </Text>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backButton: {
    padding: SPACING.xs,
  },
  title: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.secondary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl + SPACING.xxl,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyText: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.secondary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    fontSize: FONTS.sizes.md,
    color: COLORS.gray,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  couponCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  couponHeader: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  discountBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginRight: SPACING.md,
    justifyContent: 'center',
  },
  discountText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
  },
  couponInfo: {
    flex: 1,
  },
  couponName: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.secondary,
    marginBottom: SPACING.xs,
  },
  couponDescription: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    lineHeight: 18,
  },
  couponCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  codeBox: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
  },
  codeText: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
    color: COLORS.secondary,
    letterSpacing: 2,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
  },
  copyText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    color: COLORS.primary,
  },
  couponFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: SPACING.sm,
  },
  validityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    gap: SPACING.xs,
  },
  validityText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
  },
  minAmountText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.grayLight,
  },
});

export default CouponsScreen;
