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
import { setBadgeCount } from '../services/notifications';
import Loader from '../components/Loader';

const NotificationsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, [user]);

  const loadNotifications = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_type', 'user')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);

      const unreadCount = (data || []).filter(n => !n.is_read).length;
      await setBadgeCount(unreadCount);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);
      
      let unreadCount = 0;
      setNotifications(prev => {
        const updated = prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n);
        unreadCount = updated.filter(n => !n.is_read).length;
        return updated;
      });
      
      await setBadgeCount(unreadCount);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking':
        return 'calendar-outline';
      case 'payment':
        return 'card-outline';
      case 'promotion':
        return 'gift-outline';
      case 'reminder':
        return 'alarm-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'booking':
        return COLORS.primaryDark;
      case 'payment':
        return COLORS.success;
      case 'promotion':
        return COLORS.accent;
      case 'reminder':
        return COLORS.warning;
      default:
        return COLORS.secondary;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Custom Header */}
        <View style={styles.customHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.customBackButton}>
            <Ionicons name="arrow-back" size={20} color={COLORS.secondary} />
          </TouchableOpacity>
          <Text style={styles.customHeaderTitle}>Notifications</Text>
          <View style={styles.customHeaderRight} />
        </View>
        <Loader />
      </SafeAreaView>
    );
  }

  const handleNotificationPress = async (notification) => {
    await markAsRead(notification.id);
    if (notification.type === 'profile_completion' || notification.action_type === 'navigate_profile') {
      navigation.navigate('MyAccount', { focusField: notification.target_field || 'name' });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Custom Header */}
      <View style={styles.customHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.customBackButton}>
          <Ionicons name="arrow-back" size={20} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.customHeaderTitle}>Notifications</Text>
        <View style={styles.customHeaderRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadNotifications();
            }}
            colors={[COLORS.primary]}
          />
        }
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="notifications-off-outline" size={48} color={COLORS.grayLight} />
            </View>
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySubtitle}>
              You're all caught up! We'll notify you when there are updates to your bookings or account.
            </Text>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            {notifications.map((notification) => {
              const isUnread = !notification.is_read;
              const iconColor = getNotificationColor(notification.type);
              
              return (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    styles.notificationCard,
                    isUnread && styles.unreadCard,
                  ]}
                  onPress={() => handleNotificationPress(notification)}
                  activeOpacity={0.8}
                >
                  <View style={[
                    styles.iconContainer,
                    { backgroundColor: `${iconColor}12` }
                  ]}>
                    <Ionicons
                      name={getNotificationIcon(notification.type)}
                      size={20}
                      color={iconColor}
                    />
                  </View>
                  
                  <View style={styles.notificationContent}>
                    <View style={styles.notificationHeader}>
                      <Text style={[styles.notificationTitle, isUnread && styles.unreadTitle]} numberOfLines={1}>
                        {notification.title}
                      </Text>
                      {isUnread && <View style={styles.unreadDot} />}
                    </View>
                    
                    <Text style={[styles.notificationMessage, isUnread && styles.unreadMessage]}>
                      {notification.message}
                    </Text>
                    
                    <Text style={styles.notificationTime}>
                      {formatDate(notification.created_at)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
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
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  customBackButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
  },
  customHeaderTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '800',
    color: COLORS.secondary,
    textAlign: 'center',
  },
  customHeaderRight: {
    width: 36,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    paddingHorizontal: SPACING.xl,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.small,
  },
  emptyText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.secondary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  notificationsList: {
    gap: SPACING.md,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.xs,
  },
  unreadCard: {
    borderColor: COLORS.borderDark,
    backgroundColor: COLORS.cardBackground,
    ...SHADOWS.small,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.secondary,
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '800',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  notificationMessage: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.grayDark,
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 6,
  },
  unreadMessage: {
    color: COLORS.secondary,
  },
  notificationTime: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray,
    fontWeight: '600',
  },
});

export default NotificationsScreen;
