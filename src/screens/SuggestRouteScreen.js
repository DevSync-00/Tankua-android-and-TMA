import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import ModernButton from '../components/ModernButton';

const SuggestRouteScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    description: '',
    frequency: 'weekly',
  });

  const handleSubmit = async () => {
    if (!user?.id) {
      Alert.alert('Sign in required', 'Please sign in to suggest a trip.');
      return;
    }

    if (!formData.origin || !formData.destination) {
      Alert.alert('Error', 'Please fill in origin and destination');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.from('route_suggestions').insert({
        user_id: user.id,
        origin: formData.origin.trim(),
        destination: formData.destination.trim(),
        frequency: formData.frequency,
        description: formData.description.trim() || null,
      });

      if (error) throw error;
      
      Alert.alert(
        'Thank You!',
        'Your route suggestion has been submitted. We\'ll review it and consider adding it to our routes.',
        [
          {
            text: 'OK',
            onPress: () => {
              setFormData({ origin: '', destination: '', description: '', frequency: 'weekly' });
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      Alert.alert('Error', 'Failed to submit suggestion. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Suggest a Trip</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Help us expand our routes! Suggest a new trip route you'd like to see.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Origin *</Text>
            <TextInput
              style={styles.input}
              value={formData.origin}
              onChangeText={(text) => setFormData({ ...formData, origin: text })}
              placeholder="e.g., Addis Ababa"
              placeholderTextColor={COLORS.grayLight}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Destination *</Text>
            <TextInput
              style={styles.input}
              value={formData.destination}
              onChangeText={(text) => setFormData({ ...formData, destination: text })}
              placeholder="e.g., Lalibela"
              placeholderTextColor={COLORS.grayLight}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Preferred Frequency</Text>
            <View style={styles.frequencyContainer}>
              {['daily', 'weekly', 'monthly'].map((freq) => (
                <TouchableOpacity
                  key={freq}
                  style={[
                    styles.frequencyButton,
                    formData.frequency === freq && styles.frequencyButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, frequency: freq })}
                >
                  <Text
                    style={[
                      styles.frequencyText,
                      formData.frequency === freq && styles.frequencyTextActive,
                    ]}
                  >
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Additional Details (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Tell us more about this route..."
              placeholderTextColor={COLORS.grayLight}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <ModernButton
          title="Submit Suggestion"
          onPress={handleSubmit}
          variant="primary"
          size="large"
          loading={loading}
          style={styles.submitButton}
        />
      </View>
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
    paddingBottom: SPACING.xl,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  infoText: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
    color: COLORS.secondary,
    lineHeight: 20,
  },
  form: {
    gap: SPACING.lg,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.secondary,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONTS.sizes.md,
    color: COLORS.secondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  textArea: {
    minHeight: 100,
    paddingTop: SPACING.md,
  },
  frequencyContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  frequencyButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  frequencyButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  frequencyText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
    color: COLORS.gray,
  },
  frequencyTextActive: {
    color: COLORS.white,
    fontWeight: FONTS.weights.bold,
  },
  footer: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  submitButton: {
    width: '100%',
  },
});

export default SuggestRouteScreen;
