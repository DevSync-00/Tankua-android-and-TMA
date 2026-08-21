import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { useAuth } from '../contexts/AuthContext';
import { useFeedback } from '../contexts/FeedbackContext';
import GoogleIcon from '../components/auth/GoogleIcon';

const TelegramIcon = ({ size = 12, color = '#1a85c0' }) => (
  <Svg width={size} height={size} viewBox="0 0 640 640">
    <Path
      d="M320 72C183 72 72 183 72 320C72 457 183 568 320 568C457 568 568 457 568 320C568 183 457 72 320 72zM435 240.7C431.3 279.9 415.1 375.1 406.9 419C403.4 437.6 396.6 443.8 390 444.4C375.6 445.7 364.7 434.9 350.7 425.7C328.9 411.4 316.5 402.5 295.4 388.5C270.9 372.4 286.8 363.5 300.7 349C304.4 345.2 367.8 287.5 369 282.3C369.2 281.6 369.3 279.2 367.8 277.9C366.3 276.6 364.2 277.1 362.7 277.4C360.5 277.9 325.6 300.9 258.1 346.5C248.2 353.3 239.2 356.6 231.2 356.4C222.3 356.2 205.3 351.4 192.6 347.3C177.1 342.3 164.7 339.6 165.8 331C166.4 326.5 172.5 322 184.2 317.3C256.5 285.8 304.7 265 328.8 255C397.7 226.4 412 221.4 421.3 221.2C423.4 221.2 427.9 221.7 430.9 224.1C432.9 225.8 434.1 228.2 434.4 230.8C434.9 234 435 237.3 434.8 240.6z"
      fill={color}
    />
  </Svg>
);

// ─── Menu section definition ─────────────────────────────────────────────────

const MENU_SECTIONS = [
  {
    title: 'Account',
    items: [
      {
        id: 'account',
        icon: 'person-outline',
        label: 'My Account',
        sublabel: 'Edit your personal details',
        screen: 'MyAccount',
      },
      {
        id: 'saved',
        icon: 'heart-outline',
        label: 'Saved Destinations',
        sublabel: 'Your bookmarked places',
        screen: 'SavedDestinations',
      },
    ],
  },
  {
    title: 'Travel',
    items: [
      {
        id: 'suggest',
        icon: 'map-outline',
        label: 'Suggest a Trip',
        sublabel: 'Recommend a new route',
        screen: 'SuggestRoute',
      },
      {
        id: 'friends',
        icon: 'people-outline',
        label: 'Close Friends',
        sublabel: 'Travel with your circle',
        screen: 'CloseFriends',
      },
      {
        id: 'refer',
        icon: 'share-social-outline',
        label: 'Refer a Friend',
        sublabel: 'Invite friends and earn rewards',
        screen: 'ReferFriend',
      },
    ],
  },
  {
    title: 'Perks',
    items: [
      {
        id: 'rewards',
        icon: 'gift-outline',
        label: 'Rewards',
        sublabel: 'Your points and benefits',
        screen: 'Rewards',
      },
      {
        id: 'coupons',
        icon: 'pricetag-outline',
        label: 'Coupons',
        sublabel: 'Discounts and promo codes',
        screen: 'Coupons',
      },
      {
        id: 'payment',
        icon: 'card-outline',
        label: 'Payment Methods',
        sublabel: 'Manage your payment options',
        screen: 'PaymentMethods',
      },
    ],
  },
  {
    title: 'Support',
    items: [
      {
        id: 'notifications',
        icon: 'notifications-outline',
        label: 'Notifications',
        sublabel: 'See your activity',
        screen: 'Notifications',
      },
      {
        id: 'notificationSettings',
        icon: 'settings-outline',
        label: 'Notification Settings',
        sublabel: 'Manage push preferences',
        screen: 'NotificationPreferences',
      },
      {
        id: 'help',
        icon: 'help-circle-outline',
        label: 'Help Center',
        sublabel: 'FAQs and support',
        screen: 'HelpCenter',
      },
    ],
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const Avatar = ({ user }) => {
  const photoUrl = user?.profile_photo_url || user?.telegram_photo_url || user?.photo_url;
  const initials = (user?.name || 'U')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (photoUrl) {
    return (
      <Image
        source={{ uri: photoUrl }}
        style={styles.avatarImage}
        resizeMode="cover"
      />
    );
  }

  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.primaryDark]}
      style={styles.avatarImage}
    >
      <Text style={styles.avatarInitials}>{initials}</Text>
    </LinearGradient>
  );
};

const MenuRow = ({ item, onPress, isLast }) => (
  <>
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.65}
    >
      <View style={styles.menuIconWrap}>
        <Ionicons name={item.icon} size={20} color={COLORS.iconPrimary} />
      </View>
      <View style={styles.menuTextWrap}>
        <Text style={styles.menuLabel}>{item.label}</Text>
        {item.sublabel ? (
          <Text style={styles.menuSublabel}>{item.sublabel}</Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.grayLight} />
    </TouchableOpacity>
    {!isLast && <View style={styles.rowDivider} />}
  </>
);

// ─── Main screen ──────────────────────────────────────────────────────────────

const ProfileScreen = ({ navigation }) => {
  const { user, authProvider, logout } = useAuth();
  const { confirm } = useFeedback();
  const isGoogleUser = authProvider === 'google';

  const handleLogout = () => {
    confirm({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      confirmText: 'Sign Out',
      cancelText: 'Cancel',
      variant: 'danger',
    }).then((ok) => {
      if (ok) logout();
    });
  };

  const navigate = (screen) => navigation.navigate(screen);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Page title ───────────────────────────────────────────────── */}
        <Text style={styles.pageTitle}>Profile</Text>

        {/* ── Hero card ────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.heroCard}
          activeOpacity={0.85}
          onPress={() => navigate('MyAccount')}
        >
          <View style={styles.heroLeft}>
            <View style={styles.avatarWrap}>
              <Avatar user={user} />
            </View>
            <View style={styles.heroText}>
              <Text style={styles.heroName} numberOfLines={1}>
                {user?.name || 'Traveler'}
              </Text>
              <Text style={styles.heroSub} numberOfLines={1}>
                {user?.telegram_username
                  ? `@${user.telegram_username}`
                  : user?.email || 'Tap to complete profile'}
              </Text>
              <View style={[styles.providerBadge, isGoogleUser && styles.googleBadge]}>
                {isGoogleUser ? (
                  <GoogleIcon size={12} />
                ) : (
                  <TelegramIcon size={12} color="#1a85c0" />
                )}
                <Text style={[styles.providerBadgeText, isGoogleUser && styles.googleBadgeText]}>
                  {isGoogleUser ? 'Google' : 'Telegram'}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.editChip}>
            <Ionicons name="pencil" size={14} color={COLORS.primary} />
            <Text style={styles.editChipText}>Edit</Text>
          </View>
        </TouchableOpacity>

        {/* ── Menu sections ────────────────────────────────────────────── */}
        {MENU_SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, idx) => (
                <MenuRow
                  key={item.id}
                  item={item}
                  onPress={() => navigate(item.screen)}
                  isLast={idx === section.items.length - 1}
                />
              ))}
            </View>
          </View>
        ))}

        {/* ── Sign out ─────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Tankua · v1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  scroll: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 120, // clear the floating tab bar
  },

  // Page title
  pageTitle: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: FONTS.weights.black,
    color: COLORS.secondary,
    letterSpacing: -0.5,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },

  // Hero card
  heroCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
  },
  heroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarWrap: {
    marginRight: SPACING.md,
  },
  avatarImage: {
    width: 68,
    height: 68,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarInitials: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
  },
  heroText: {
    flex: 1,
    gap: 3,
  },
  heroName: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.secondary,
  },
  heroSub: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    fontWeight: FONTS.weights.medium,
  },
  providerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: '#229ED915',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    gap: 4,
  },
  providerBadgeText: {
    fontSize: FONTS.sizes.xs,
    color: '#1a85c0',
    fontWeight: FONTS.weights.semibold,
  },
  googleBadge: {
    backgroundColor: '#4285F415',
  },
  googleBadgeText: {
    color: '#3c4043',
  },
  editChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${COLORS.primary}18`,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    marginLeft: SPACING.sm,
  },
  editChipText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: FONTS.weights.bold,
  },

  // Sections
  section: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.bold,
    color: COLORS.grayLight,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs + 2,
    marginLeft: SPACING.xs,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.small,
  },

  // Menu rows
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: `${COLORS.iconPrimary}12`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  menuTextWrap: {
    flex: 1,
  },
  menuLabel: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.secondary,
    marginBottom: 1,
  },
  menuSublabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.grayLight,
    fontWeight: FONTS.weights.regular,
  },
  rowDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginLeft: 38 + SPACING.md + SPACING.md, // align under text
  },

  // Sign out
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: `${COLORS.error}10`,
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.md + 2,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: `${COLORS.error}20`,
  },
  signOutText: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
    color: COLORS.error,
  },

  // Footer
  version: {
    textAlign: 'center',
    fontSize: FONTS.sizes.xs,
    color: COLORS.grayLight,
    marginBottom: SPACING.md,
  },
});

export default ProfileScreen;
