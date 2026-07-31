import { supabase } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@tankua_close_friends';

/**
 * Service to manage Close Friends table in Supabase & fallback to local storage
 * Supports Telegram Username search & Telegram Direct Invite/Chat links
 */
export const closeFriendsService = {
  /**
   * Fetch close friends for a user
   */
  async getCloseFriends(userId) {
    if (!userId) {
      return this.getLocalCloseFriends();
    }

    try {
      const { data, error } = await supabase
        .from('close_friends')
        .select(`
          id,
          created_at,
          friend:users!close_friends_friend_id_fkey (
            id,
            full_name,
            name,
            phone,
            phone_number,
            telegram_username,
            username,
            avatar_url
          )
        `)
        .eq('user_id', userId);

      if (error) {
        console.warn('Supabase fetch close_friends warning:', error.message);
        return this.getLocalCloseFriends();
      }

      if (data && data.length > 0) {
        const formatted = data.map((item) => ({
          id: item.friend?.id || item.id,
          name: item.friend?.full_name || item.friend?.name || 'Tankua User',
          phone: item.friend?.phone || item.friend?.phone_number || 'N/A',
          telegramUsername: item.friend?.telegram_username || item.friend?.username || null,
          avatarUrl: item.friend?.avatar_url || null,
          trips: Math.floor(Math.random() * 4) + 1,
        }));
        await this.setLocalCloseFriends(formatted);
        return formatted;
      }
    } catch (e) {
      console.warn('Error connecting to Supabase close_friends, loading fallback:', e);
    }

    return this.getLocalCloseFriends();
  },

  /**
   * Search for a registered user by Telegram Username or Phone Number
   */
  async searchUser(query) {
    if (!query || String(query).trim().length < 3) return null;
    const cleanQuery = String(query).trim().replace(/^@/, '');

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, name, phone, phone_number, telegram_username, username, avatar_url')
        .or(`telegram_username.ilike.%${cleanQuery}%,username.ilike.%${cleanQuery}%,phone.eq.${cleanQuery},phone_number.eq.${cleanQuery},full_name.ilike.%${cleanQuery}%`)
        .limit(1)
        .single();

      if (!error && data) {
        return {
          id: data.id,
          name: data.full_name || data.name || 'Tankua Member',
          phone: data.phone || data.phone_number || 'N/A',
          telegramUsername: data.telegram_username || data.username || cleanQuery,
          avatarUrl: data.avatar_url,
        };
      }
    } catch (e) {
      console.log('User search notice:', e.message);
    }

    return null;
  },

  // Backward compatibility alias
  async searchUserByPhone(query) {
    return this.searchUser(query);
  },

  /**
   * Add a close friend
   */
  async addCloseFriend(userId, friendObj) {
    let newFriend = {
      id: friendObj.id || String(Date.now()),
      name: friendObj.name || 'Close Friend',
      phone: friendObj.phone || 'N/A',
      telegramUsername: friendObj.telegramUsername || null,
      trips: 1,
    };

    if (userId && friendObj.id) {
      try {
        const { error } = await supabase
          .from('close_friends')
          .insert([{ user_id: userId, friend_id: friendObj.id }]);

        if (error && !error.message?.includes('duplicate key')) {
          console.warn('Supabase add close_friends error:', error.message);
        }
      } catch (e) {
        console.warn('Error inserting into Supabase close_friends:', e);
      }
    }

    // Always update local cache
    const current = await this.getLocalCloseFriends();
    if (!current.some((f) => f.id === newFriend.id || (newFriend.telegramUsername && f.telegramUsername === newFriend.telegramUsername))) {
      const updated = [newFriend, ...current];
      await this.setLocalCloseFriends(updated);
      return updated;
    }
    return current;
  },

  /**
   * Remove a close friend
   */
  async removeCloseFriend(userId, friendId) {
    if (userId && friendId) {
      try {
        await supabase
          .from('close_friends')
          .delete()
          .eq('user_id', userId)
          .eq('friend_id', friendId);
      } catch (e) {
        console.warn('Error deleting from Supabase close_friends:', e);
      }
    }

    const current = await this.getLocalCloseFriends();
    const updated = current.filter((f) => f.id !== friendId);
    await this.setLocalCloseFriends(updated);
    return updated;
  },

  // Local AsyncStorage Helpers
  async getLocalCloseFriends() {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) return JSON.parse(json);
    } catch (e) {}
    // Default initial mock friends with Telegram handles
    return [
      { id: '1', name: 'John Doe', phone: '0912345678', telegramUsername: 'johndoe_travel', trips: 5 },
      { id: '2', name: 'Jane Smith', phone: '0918765432', telegramUsername: 'janesmith_eth', trips: 3 },
    ];
  },

  async setLocalCloseFriends(list) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {}
  },
};
