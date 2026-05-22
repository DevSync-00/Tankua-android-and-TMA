import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { useAuth } from '../contexts/AuthContext';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  
  // Calculate bottom padding to account for tab bar (70px height + bottom inset + padding)
  const tabBarHeight = 70;
  const tabBarBottomPadding = Math.max(insets.bottom, SPACING.md);
  const tabBarTopPadding = SPACING.sm;
  const totalTabBarSpace = tabBarHeight + tabBarBottomPadding + tabBarTopPadding + SPACING.md;

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', onPress: logout, style: 'destructive' },
      ]
    );
  };

  const menuItems = [
    {
      id: 'account',
      icon: 'person-outline',
      label: 'My Account',
      onPress: () => navigation.navigate('MyAccount'),
    },
    {
      id: 'help',
      icon: 'help-circle-outline',
      label: 'Help Center',
      onPress: () => navigation.navigate('HelpCenter'),
    },
    {
      id: 'notifications',
      icon: 'notifications-outline',
      label: 'Notifications',
      onPress: () => navigation.navigate('Notifications'),
    },
    {
      id: 'payment',
      icon: 'card-outline',
      label: 'Payment Methods',
      onPress: () => navigation.navigate('PaymentMethods'),
    },
    {
      id: 'coupons',
      icon: 'pricetag-outline',
      label: 'Coupons',
      onPress: () => navigation.navigate('Coupons'),
    },
    {
      id: 'earned',
      icon: 'gift-outline',
      label: 'Rewards',
      onPress: () => navigation.navigate('Rewards'),
    },
    {
      id: 'refer',
      icon: 'share-social-outline',
      label: 'Refer a Friend',
      onPress: () => navigation.navigate('ReferFriend'),
    },
    {
      id: 'suggest',
      icon: 'bus-outline',
      label: 'Suggest a Trip',
      onPress: () => navigation.navigate('SuggestRoute'),
    },
    {
      id: 'friends',
      icon: 'people-outline',
      label: 'Close Friends',
      onPress: () => navigation.navigate('CloseFriends'),
    },
    {
      id: 'logout',
      icon: 'log-out-outline',
      label: 'Sign Out',
      onPress: handleLogout,
      destructive: true,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        contentContainerStyle={[styles.content, { paddingBottom: totalTabBarSpace }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={COLORS.white} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email || user?.phone_number}</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <React.Fragment key={item.id}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.menuLeft}>
                <View style={[
                  styles.iconContainer,
                  item.destructive && styles.iconContainerDestructive
                ]}>
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color={item.destructive ? COLORS.error : COLORS.iconPrimary}
                  />
                  </View>
                  <Text style={[
                    styles.menuLabel,
                    item.destructive && styles.menuLabelDestructive
                  ]}>
                    {item.label}
                  </Text>
                </View>
                <Ionicons
                  name={item.external ? 'open-outline' : 'chevron-forward'}
                  size={20}
                  color={COLORS.grayLight}
                />
              </TouchableOpacity>
              {index < menuItems.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
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
  content: {
    paddingBottom: SPACING.md,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  title: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: FONTS.weights.black,
    color: COLORS.secondary,
    letterSpacing: -0.5,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.medium,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.secondary,
    marginBottom: SPACING.xs / 2,
  },
  userEmail: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    fontWeight: FONTS.weights.medium,
  },
  menuCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.small,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: `${COLORS.iconPrimary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  iconContainerDestructive: {
    backgroundColor: `${COLORS.error}15`,
  },
  menuLabel: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.secondary,
    flex: 1,
  },
  menuLabelDestructive: {
    color: COLORS.error,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginLeft: SPACING.lg + 40 + SPACING.md,
    marginRight: SPACING.lg,
  },
});

export default ProfileScreen;
