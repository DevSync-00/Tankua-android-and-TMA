import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import Loader from '../components/Loader';

const RewardsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [points, setPoints] = useState(0);
  const [rewardsHistory, setRewardsHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRewards();
  }, [user]);

  const loadRewards = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Load current points balance
      const { data: pointsData, error: pointsError } = await supabase
        .from('rewards_points')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (pointsError && pointsError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw pointsError;
      }

      setPoints(pointsData?.current_points || 0);

      // Load transaction history
      const { data: historyData, error: historyError } = await supabase
        .from('rewards_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (historyError) throw historyError;
      setRewardsHistory(historyData || []);
    } catch (error) {
      console.error('Error loading rewards:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
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
          <Text style={styles.title}>Rewards</Text>
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
        <Text style={styles.title}>Rewards</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadRewards();
            }}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Points Card */}
        <View style={styles.pointsCard}>
          <View style={styles.pointsHeader}>
            <Ionicons name="trophy" size={32} color={COLORS.primary} />
            <Text style={styles.pointsLabel}>Your Points</Text>
          </View>
          <Text style={styles.pointsValue}>{points}</Text>
          <Text style={styles.pointsSubtext}>
            {points >= 100 ? 'You can redeem rewards!' : `${100 - points} points until next reward`}
          </Text>
        </View>

        {/* How It Works */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How Rewards Work</Text>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.infoText}>Earn 10 points for every trip booking</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.infoText}>Earn 50 points for each referral</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.infoText}>Redeem 100 points for 50 ETB discount</Text>
          </View>
        </View>

        {/* Rewards History */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Rewards History</Text>
          {rewardsHistory.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyHistoryText}>No rewards history yet</Text>
            </View>
          ) : (
            rewardsHistory.map((item) => (
              <View key={item.id} style={styles.historyItem}>
                <View style={styles.historyLeft}>
                  <View style={[
                    styles.historyIcon,
                    { backgroundColor: item.type === 'earned' ? `${COLORS.success}15` : item.type === 'redeemed' ? `${COLORS.primary}15` : `${COLORS.gray}15` }
                  ]}>
                    <Ionicons
                      name={item.type === 'earned' ? 'add-circle' : item.type === 'redeemed' ? 'remove-circle' : 'time-outline'}
                      size={24}
                      color={item.type === 'earned' ? COLORS.success : item.type === 'redeemed' ? COLORS.primary : COLORS.gray}
                    />
                  </View>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyDescription}>{item.description}</Text>
                    <Text style={styles.historyDate}>{formatDate(item.created_at)}</Text>
                  </View>
                </View>
                <Text style={[
                  styles.historyAmount,
                  { color: item.type === 'earned' ? COLORS.success : item.type === 'redeemed' ? COLORS.primary : COLORS.gray }
                ]}>
                  {item.type === 'earned' ? '+' : '-'}{Math.abs(item.amount)}
                </Text>
              </View>
            ))
          )}
        </View>
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
  pointsCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
  },
  pointsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  pointsLabel: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.gray,
  },
  pointsValue: {
    fontSize: FONTS.sizes.xxxl * 1.5,
    fontWeight: FONTS.weights.black,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  pointsSubtext: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  infoTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.secondary,
    marginBottom: SPACING.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  infoText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    flex: 1,
  },
  historySection: {
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.secondary,
    marginBottom: SPACING.md,
  },
  emptyHistory: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.gray,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  historyInfo: {
    flex: 1,
  },
  historyDescription: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.medium,
    color: COLORS.secondary,
    marginBottom: SPACING.xs / 2,
  },
  historyDate: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.grayLight,
  },
  historyAmount: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
  },
});

export default RewardsScreen;
