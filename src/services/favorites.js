import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';

const FAVORITES_KEY = 'favorite_destinations';

const currentUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};

const cache = async (ids) => {
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  return ids;
};

export const getFavorites = async () => {
  const userId = await currentUserId();
  if (userId) {
    const { data, error } = await supabase
      .from('user_favorites')
      .select('destination_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (!error) return cache((data || []).map(item => item.destination_id));
    console.warn('Cloud favorites unavailable, using cache:', error.message);
  }
  const stored = await AsyncStorage.getItem(FAVORITES_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const isFavorited = async (destinationId) => (await getFavorites()).includes(destinationId);

export const addFavorite = async (destinationId) => {
  const userId = await currentUserId();
  if (!userId) return false;
  const { error } = await supabase.from('user_favorites').upsert(
    { user_id: userId, destination_id: destinationId },
    { onConflict: 'user_id,destination_id' },
  );
  if (error) throw error;
  await cache([...new Set([...(await getFavorites()), destinationId])]);
  return true;
};

export const removeFavorite = async (destinationId) => {
  const userId = await currentUserId();
  if (!userId) return false;
  const { error } = await supabase.from('user_favorites').delete()
    .eq('user_id', userId).eq('destination_id', destinationId);
  if (error) throw error;
  await cache((await getFavorites()).filter(id => id !== destinationId));
  return true;
};

export const toggleFavorite = async (destinationId) => {
  const saved = await isFavorited(destinationId);
  if (saved) { await removeFavorite(destinationId); return false; }
  await addFavorite(destinationId); return true;
};
