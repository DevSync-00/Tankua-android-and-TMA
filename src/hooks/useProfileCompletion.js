import { useMemo, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';

/**
 * Custom memoized hook to validate user profile completion state.
 * Required fields:
 * 1. Personal: name (Full Name)
 * 2. Contact: phone_number & emergency_contact
 * 3. Location: city (or location)
 *
 * Automatically syncs persistent notification to NotificationsScreen if profile is incomplete.
 */
export const useProfileCompletion = () => {
  const { user, updateProfile } = useAuth();

  const completionStatus = useMemo(() => {
    if (!user) {
      return {
        isComplete: true,
        completionPercentage: 100,
        missingFields: [],
        firstMissingField: null,
      };
    }

    // Skip validation if already marked complete on database
    if (user.is_profile_complete) {
      return {
        isComplete: true,
        completionPercentage: 100,
        missingFields: [],
        firstMissingField: null,
      };
    }

    const missing = [];

    // 1. Personal Info check (name only)
    if (!user.name || user.name.trim() === '' || user.name === 'Telegram User') {
      missing.push({ key: 'name', label: 'Full Name', category: 'Personal' });
    }

    // 2. Contact Info check (phone_number & emergency_contact)
    if (!user.phone_number || user.phone_number.trim() === '') {
      missing.push({ key: 'phone_number', label: 'Phone Number', category: 'Contact' });
    }

    if (!user.emergency_contact || user.emergency_contact.trim() === '') {
      missing.push({ key: 'emergency_contact', label: 'Emergency Phone Number', category: 'Contact' });
    }

    // 3. Location check (city or location)
    const hasCity = (user.city && user.city.trim() !== '') || (user.location && user.location.trim() !== '');
    if (!hasCity) {
      missing.push({ key: 'city', label: 'City Location', category: 'Location' });
    }

    const totalFields = 4;
    const completedCount = totalFields - missing.length;
    const percentage = Math.round((completedCount / totalFields) * 100);
    const isComplete = missing.length === 0;

    return {
      isComplete,
      completionPercentage: percentage,
      missingFields: missing,
      firstMissingField: missing[0]?.key || null,
    };
  }, [user]);

  // Effect 1: Auto-set is_profile_complete = true when all fields are filled
  useEffect(() => {
    if (user && !user.is_profile_complete && completionStatus.isComplete) {
      updateProfile({ is_profile_complete: true })
        .then(() => {
          // Clear any unread profile completion notifications
          return supabase
            .from('notifications')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .eq('recipient_id', user.id)
            .eq('action_type', 'navigate_profile');
        })
        .catch((err) => {
          console.error('Failed to auto-set is_profile_complete:', err);
        });
    }
  }, [user, completionStatus.isComplete, updateProfile]);

  // Effect 2: Sync notification to NotificationsScreen if profile is incomplete
  useEffect(() => {
    if (user?.id && !user.is_profile_complete && !completionStatus.isComplete) {
      const syncNotification = async () => {
        try {
          // Check if unread profile completion notification already exists
          const { data: existing } = await supabase
            .from('notifications')
            .select('id')
            .eq('recipient_id', user.id)
            .eq('action_type', 'navigate_profile')
            .eq('is_read', false)
            .limit(1);

          if (!existing || existing.length === 0) {
            await supabase.from('notifications').insert([
              {
                recipient_type: 'user',
                recipient_id: user.id,
                title: 'Complete Your Profile',
                message: 'Your profile is missing required details. Tap here to set up your account and unlock all features.',
                type: 'reminder',
                action_type: 'navigate_profile',
                target_field: completionStatus.firstMissingField || 'name',
                is_read: false,
                created_at: new Date().toISOString(),
              },
            ]);
          }
        } catch (err) {
          console.warn('[ProfileCompletion] Failed to sync profile completion notification:', err?.message || err);
        }
      };

      syncNotification();
    }
  }, [user?.id, user?.is_profile_complete, completionStatus.isComplete, completionStatus.firstMissingField]);

  return completionStatus;
};
