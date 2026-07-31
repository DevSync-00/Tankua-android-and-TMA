import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Linking,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { useAuth } from '../contexts/AuthContext';
import { closeFriendsService } from '../services/closeFriendsService';

const CloseFriendsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Toast Notification State
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  // Add Friend Modal State
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundUser, setFoundUser] = useState(null);

  // Remove Friend Confirmation Modal State
  const [friendToRemove, setFriendToRemove] = useState(null);

  useEffect(() => {
    loadFriends();
  }, [user]);

  const showToast = (message, type = 'info') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: 'info' }), 3000);
  };

  const loadFriends = async () => {
    setLoading(true);
    try {
      const data = await closeFriendsService.getCloseFriends(user?.id);
      setFriends(data || []);
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await closeFriendsService.getCloseFriends(user?.id);
      setFriends(data || []);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredFriends = friends.filter((friend) => {
    const q = searchQuery.toLowerCase().replace(/^@/, '');
    const nameMatch = friend.name?.toLowerCase().includes(q);
    const phoneMatch = friend.phone?.includes(q);
    const tgMatch = friend.telegramUsername?.toLowerCase().includes(q);
    return nameMatch || phoneMatch || tgMatch;
  });

  const handleSearchUser = async () => {
    if (!searchInput || searchInput.trim().length < 3) {
      showToast('Please enter at least 3 characters (username or phone).', 'error');
      return;
    }

    setSearching(true);
    try {
      const result = await closeFriendsService.searchUser(searchInput.trim());
      setFoundUser(result);
      if (!result) {
        showToast('No Tankua user found with that username or phone. You can invite them on Telegram!', 'warning');
      }
    } finally {
      setSearching(false);
    }
  };

  const handleConfirmAddFriend = async () => {
    const cleanHandle = searchInput.trim().replace(/^@/, '');
    const friendData = foundUser || {
      name: `@${cleanHandle}`,
      telegramUsername: cleanHandle,
      phone: searchInput.includes('09') || searchInput.includes('+') ? searchInput.trim() : 'N/A',
    };

    const updated = await closeFriendsService.addCloseFriend(user?.id, friendData);
    setFriends(updated);
    setIsAddModalVisible(false);
    setSearchInput('');
    setFoundUser(null);
    showToast(`${friendData.name} added to your close friends!`, 'success');
  };

  const handleConfirmRemoveFriend = async () => {
    if (!friendToRemove) return;
    const updated = await closeFriendsService.removeCloseFriend(user?.id, friendToRemove.id);
    setFriends(updated);
    showToast(`${friendToRemove.name} removed from your close friends.`, 'info');
    setFriendToRemove(null);
  };

  const handleOpenTelegramChat = (telegramUsername, friendName) => {
    if (telegramUsername) {
      const cleanHandle = String(telegramUsername).replace(/^@/, '');
      Linking.openURL(`https://t.me/${cleanHandle}`);
    } else {
      const shareMsg = `Hey ${friendName}! Join me on Tankua to book travel tickets & explore Ethiopia together: https://t.me/tankuabot`;
      Linking.openURL(`https://t.me/share/url?url=https://t.me/tankuabot&text=${encodeURIComponent(shareMsg)}`);
    }
  };

  const handleInviteTelegram = (inputVal) => {
    const handle = String(inputVal || '').trim().replace(/^@/, '');
    const shareMsg = `Hey! Join me on Tankua to book travel tickets & explore Ethiopia together: https://t.me/tankuabot`;
    if (handle && isNaN(handle)) {
      Linking.openURL(`https://t.me/${handle}`);
    } else {
      Linking.openURL(`https://t.me/share/url?url=https://t.me/tankuabot&text=${encodeURIComponent(shareMsg)}`);
    }
  };

  const handleCallFriend = (phone) => {
    if (phone && phone !== 'N/A') {
      Linking.openURL(`tel:${phone}`);
    } else {
      showToast('Phone number not available for this contact.', 'warning');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'F';
    const clean = name.replace(/^@/, '');
    const parts = clean.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Toast Notification Banner */}
      {toast.visible && (
        <View
          style={[
            styles.toastBanner,
            toast.type === 'error' && styles.toastError,
            toast.type === 'success' && styles.toastSuccess,
            toast.type === 'warning' && styles.toastWarning,
          ]}
        >
          <Ionicons
            name={
              toast.type === 'success'
                ? 'checkmark-circle'
                : toast.type === 'error'
                ? 'alert-circle'
                : 'information-circle'
            }
            size={20}
            color={COLORS.white}
          />
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.secondary} />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>Close Friends</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{friends.length}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.headerAddBtn}
          onPress={() => {
            setSearchInput('');
            setFoundUser(null);
            setIsAddModalVisible(true);
          }}
        >
          <Ionicons name="person-add" size={20} color={COLORS.secondary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, @username, or phone..."
            placeholderTextColor={COLORS.grayLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.gray} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading close friends...</Text>
          </View>
        ) : filteredFriends.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="paper-plane" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No friends match your search' : 'Your Telegram close circle is empty'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? 'Try searching with a Telegram handle like @username or phone number.'
                : 'Add friends by Telegram username or phone number to easily coordinate travel tickets and share trips!'}
            </Text>

            {!searchQuery && (
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={() => {
                  setSearchInput('');
                  setFoundUser(null);
                  setIsAddModalVisible(true);
                }}
              >
                <Ionicons name="person-add" size={18} color={COLORS.secondary} />
                <Text style={styles.emptyAddBtnText}>Add Telegram Friend</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredFriends.map((friend) => (
            <View key={friend.id} style={styles.friendCard}>
              <LinearGradient
                colors={['#0088CC', '#00A8E8']}
                style={styles.friendAvatarGradient}
              >
                <Text style={styles.avatarInitials}>{getInitials(friend.name)}</Text>
              </LinearGradient>

              <View style={styles.friendInfo}>
                <View style={styles.friendNameRow}>
                  <Text style={styles.friendName}>{friend.name}</Text>
                  <View style={styles.tgBadge}>
                    <Ionicons name="paper-plane" size={10} color="#0088CC" />
                    <Text style={styles.tgBadgeText}>Telegram</Text>
                  </View>
                </View>

                {friend.telegramUsername ? (
                  <Text style={styles.friendTgHandle}>@{friend.telegramUsername.replace(/^@/, '')}</Text>
                ) : (
                  <Text style={styles.friendPhone}>{friend.phone}</Text>
                )}

                <View style={styles.tripsBadge}>
                  <Ionicons name="bus" size={12} color={COLORS.secondary} />
                  <Text style={styles.tripsBadgeText}>{friend.trips || 1} trips together</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                {/* Direct Telegram Chat */}
                <TouchableOpacity
                  style={[styles.iconActionBtn, { backgroundColor: '#E0F2FE' }]}
                  onPress={() => handleOpenTelegramChat(friend.telegramUsername, friend.name)}
                >
                  <Ionicons name="paper-plane" size={16} color="#0284C7" />
                </TouchableOpacity>

                {/* Direct Call */}
                {friend.phone && friend.phone !== 'N/A' && (
                  <TouchableOpacity
                    style={[styles.iconActionBtn, { backgroundColor: '#EFF6FF' }]}
                    onPress={() => handleCallFriend(friend.phone)}
                  >
                    <Ionicons name="call" size={16} color="#2563EB" />
                  </TouchableOpacity>
                )}

                {/* Remove */}
                <TouchableOpacity
                  style={[styles.iconActionBtn, { backgroundColor: '#FEF2F2' }]}
                  onPress={() => setFriendToRemove(friend)}
                >
                  <Ionicons name="trash-outline" size={16} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Floating Add Friend Bar */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryAddBar}
          onPress={() => {
            setSearchInput('');
            setFoundUser(null);
            setIsAddModalVisible(true);
          }}
        >
          <Ionicons name="person-add-outline" size={20} color={COLORS.secondary} />
          <Text style={styles.primaryAddBarText}>Add Telegram Friend</Text>
        </TouchableOpacity>
      </View>

      {/* Add Friend Bottom Sheet Modal */}
      <Modal
        visible={isAddModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="paper-plane" size={22} color="#0088CC" />
                <Text style={styles.modalTitle}>Add Telegram Friend</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsAddModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color={COLORS.gray} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtext}>
              Search for registered Tankua members by Telegram @username or phone number.
            </Text>

            {/* Input Row */}
            <View style={styles.searchInputRow}>
              <Ionicons name="at" size={20} color="#0088CC" style={styles.inputIcon} />
              <TextInput
                style={styles.modalTextInput}
                placeholder="e.g. @john_doe or 0912345678"
                placeholderTextColor={COLORS.grayLight}
                autoCapitalize="none"
                value={searchInput}
                onChangeText={(text) => {
                  setSearchInput(text);
                  setFoundUser(null);
                }}
              />

              {searching ? (
                <ActivityIndicator size="small" color="#0088CC" />
              ) : (
                <TouchableOpacity style={styles.verifyBtn} onPress={handleSearchUser}>
                  <Text style={styles.verifyBtnText}>Search</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Search Results Preview */}
            {foundUser ? (
              <View style={styles.userFoundCard}>
                <LinearGradient
                  colors={['#0088CC', '#00A8E8']}
                  style={styles.foundAvatar}
                >
                  <Text style={styles.foundAvatarText}>{getInitials(foundUser.name)}</Text>
                </LinearGradient>
                <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                  <Text style={styles.foundUserName}>{foundUser.name}</Text>
                  {foundUser.telegramUsername ? (
                    <Text style={styles.foundUserHandle}>@{foundUser.telegramUsername.replace(/^@/, '')}</Text>
                  ) : (
                    <Text style={styles.foundUserPhone}>{foundUser.phone}</Text>
                  )}
                </View>
                <Ionicons name="checkmark-circle" size={24} color="#0088CC" />
              </View>
            ) : searchInput.length >= 3 && !searching ? (
              <View style={styles.notRegisteredBox}>
                <Text style={styles.notRegTitle}>Not found on Tankua yet</Text>
                <Text style={styles.notRegSub}>
                  Invite your friend via Telegram so they can join your close circle!
                </Text>
                <TouchableOpacity
                  style={styles.inviteTelegramBtn}
                  onPress={() => handleInviteTelegram(searchInput)}
                >
                  <Ionicons name="paper-plane" size={16} color={COLORS.white} />
                  <Text style={styles.inviteTelegramBtnText}>Invite on Telegram</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Actions */}
            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setIsAddModalVisible(false)}
              >
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmAddBtn,
                  (!searchInput || searchInput.trim().length < 3) && styles.disabledConfirmBtn,
                ]}
                disabled={!searchInput || searchInput.trim().length < 3}
                onPress={handleConfirmAddFriend}
              >
                <Text style={styles.confirmAddBtnText}>Add Friend</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Remove Friend Custom Modal */}
      <Modal
        visible={!!friendToRemove}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFriendToRemove(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.removeModalContent}>
            <View style={styles.removeIconCircle}>
              <Ionicons name="trash-outline" size={28} color={COLORS.error} />
            </View>

            <Text style={styles.removeTitle}>Remove Close Friend?</Text>
            <Text style={styles.removeSubtext}>
              Are you sure you want to remove <Text style={{ fontWeight: 'bold' }}>{friendToRemove?.name}</Text> from your close friends list?
            </Text>

            <View style={styles.removeActionRow}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setFriendToRemove(null)}
              >
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dangerRemoveBtn}
                onPress={handleConfirmRemoveFriend}
              >
                <Text style={styles.dangerRemoveBtnText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  toastBanner: {
    position: 'absolute',
    top: 50,
    left: SPACING.md,
    right: SPACING.md,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
    ...SHADOWS.medium,
  },
  toastSuccess: {
    backgroundColor: '#0284C7',
  },
  toastError: {
    backgroundColor: '#DC2626',
  },
  toastWarning: {
    backgroundColor: '#D97706',
  },
  toastText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.white,
    fontWeight: FONTS.weights.semibold,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: SPACING.xs,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.secondary,
  },
  countBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.bold,
    color: '#0284C7',
  },
  headerAddBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchSection: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    gap: SPACING.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
    color: COLORS.secondary,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  loadingText: {
    marginTop: SPACING.sm,
    color: COLORS.gray,
    fontSize: FONTS.sizes.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
    color: COLORS.secondary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.small,
  },
  emptyAddBtnText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    color: COLORS.secondary,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.small,
  },
  friendAvatarGradient: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  avatarInitials: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
  },
  friendInfo: {
    flex: 1,
  },
  friendNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  friendName: {
    fontSize: FONTS.sizes.sm + 1,
    fontWeight: FONTS.weights.bold,
    color: COLORS.secondary,
  },
  tgBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  tgBadgeText: {
    fontSize: 10,
    fontWeight: FONTS.weights.semibold,
    color: '#0284C7',
  },
  friendTgHandle: {
    fontSize: FONTS.sizes.xs + 1,
    color: '#0284C7',
    fontWeight: FONTS.weights.semibold,
    marginBottom: 4,
  },
  friendPhone: {
    fontSize: FONTS.sizes.xs + 1,
    color: COLORS.gray,
    marginBottom: 4,
  },
  tripsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tripsBadgeText: {
    fontSize: 11,
    color: COLORS.secondary,
    fontWeight: FONTS.weights.semibold,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  primaryAddBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.small,
  },
  primaryAddBarText: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
    color: COLORS.secondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: FONTS.sizes.md + 2,
    fontWeight: FONTS.weights.bold,
    color: COLORS.secondary,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSubtext: {
    fontSize: FONTS.sizes.xs + 1,
    color: COLORS.gray,
    marginBottom: SPACING.md,
    lineHeight: 18,
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.md,
  },
  inputIcon: {
    marginRight: SPACING.xs,
  },
  modalTextInput: {
    flex: 1,
    height: 44,
    fontSize: FONTS.sizes.sm + 1,
    color: COLORS.secondary,
  },
  verifyBtn: {
    backgroundColor: '#0088CC',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.sm,
  },
  verifyBtnText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
  },
  userFoundCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    padding: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  foundAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foundAvatarText: {
    fontSize: 12,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
  },
  foundUserName: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    color: COLORS.secondary,
  },
  foundUserHandle: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: FONTS.weights.semibold,
  },
  foundUserPhone: {
    fontSize: 11,
    color: COLORS.gray,
  },
  notRegisteredBox: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    padding: SPACING.sm + 4,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  notRegTitle: {
    fontSize: FONTS.sizes.xs + 1,
    fontWeight: FONTS.weights.bold,
    color: '#0369A1',
  },
  notRegSub: {
    fontSize: 11,
    color: '#0284C7',
    marginVertical: 4,
    lineHeight: 16,
  },
  inviteTelegramBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0088CC',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: 6,
  },
  inviteTelegramBtnText: {
    fontSize: 12,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: 4,
  },
  cancelModalBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#F1F5F9',
  },
  cancelModalBtnText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    color: COLORS.gray,
  },
  confirmAddBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
  },
  disabledConfirmBtn: {
    opacity: 0.5,
  },
  confirmAddBtnText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    color: COLORS.secondary,
  },
  removeModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.large,
  },
  removeIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  removeTitle: {
    fontSize: FONTS.sizes.md + 1,
    fontWeight: FONTS.weights.bold,
    color: COLORS.secondary,
    marginBottom: 4,
  },
  removeSubtext: {
    fontSize: FONTS.sizes.xs + 1,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 18,
  },
  removeActionRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    width: '100%',
  },
  dangerRemoveBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.error,
  },
  dangerRemoveBtnText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
  },
});

export default CloseFriendsScreen;
