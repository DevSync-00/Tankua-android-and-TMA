import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import ModernButton from '../components/ModernButton';
import Loader from '../components/Loader';

const PaymentMethodsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'mobile_money',
    provider: 'telebirr',
    name: '',
    account_number: '',
  });

  useEffect(() => {
    loadPaymentMethods();
  }, [user]);

  const loadPaymentMethods = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('saved_payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (error) {
      console.error('Error loading payment methods:', error);
      Alert.alert('Error', 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMethod = () => {
    setFormData({
      type: 'mobile_money',
      provider: 'telebirr',
      name: '',
      account_number: '',
    });
    setShowAddModal(true);
  };

  const handleSaveMethod = async () => {
    if (!formData.name || !formData.account_number) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Validate phone number format (basic validation)
    if (formData.type === 'mobile_money' && !/^(\+251|0)?9\d{8}$/.test(formData.account_number.replace(/\s/g, ''))) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    try {
      const maskedNumber = formData.type === 'mobile_money' 
        ? `****${formData.account_number.slice(-4)}`
        : `****${formData.account_number.slice(-4)}`;

      const { error } = await supabase
        .from('saved_payment_methods')
        .insert({
          user_id: user.id,
          type: formData.type,
          provider: formData.provider,
          name: formData.name,
          account_number: formData.account_number,
          masked_number: maskedNumber,
          is_default: paymentMethods.length === 0, // First method is default
        });

      if (error) throw error;

      Alert.alert('Success', 'Payment method added successfully');
      setShowAddModal(false);
      loadPaymentMethods();
    } catch (error) {
      console.error('Error saving payment method:', error);
      Alert.alert('Error', 'Failed to save payment method');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      // First, unset all defaults
      await supabase
        .from('saved_payment_methods')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('is_default', true);

      // Then set the selected one as default
      const { error } = await supabase
        .from('saved_payment_methods')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;

      loadPaymentMethods();
    } catch (error) {
      console.error('Error setting default:', error);
      Alert.alert('Error', 'Failed to set default payment method');
    }
  };

  const handleDelete = async (id) => {
    Alert.alert(
      'Delete Payment Method',
      'Are you sure you want to remove this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('saved_payment_methods')
                .update({ is_active: false })
                .eq('id', id);

              if (error) throw error;

              loadPaymentMethods();
            } catch (error) {
              console.error('Error deleting payment method:', error);
              Alert.alert('Error', 'Failed to delete payment method');
            }
          },
        },
      ]
    );
  };

  const getPaymentIcon = (type) => {
    switch (type) {
      case 'mobile_money':
        return 'phone-portrait';
      case 'card':
        return 'card';
      case 'bank':
        return 'business';
      default:
        return 'wallet';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.secondary} />
          </TouchableOpacity>
          <Text style={styles.title}>Payment Methods</Text>
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
        <Text style={styles.title}>Payment Methods</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {paymentMethods.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="card-outline" size={64} color={COLORS.grayLight} />
            <Text style={styles.emptyText}>No payment methods</Text>
            <Text style={styles.emptySubtext}>
              Add a payment method to make booking easier
            </Text>
          </View>
        ) : (
          paymentMethods.map((method) => (
            <View key={method.id} style={styles.methodCard}>
              <View style={styles.methodLeft}>
                <View style={styles.methodIcon}>
                  <Ionicons
                    name={getPaymentIcon(method.type)}
                    size={24}
                    color={COLORS.primary}
                  />
                </View>
                <View style={styles.methodInfo}>
                  <View style={styles.methodHeader}>
                    <Text style={styles.methodName}>{method.name}</Text>
                    {method.is_default && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultText}>Default</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.methodNumber}>{method.masked_number || method.account_number}</Text>
                </View>
              </View>
              <View style={styles.methodActions}>
                {!method.is_default && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleSetDefault(method.id)}
                  >
                    <Ionicons name="star-outline" size={20} color={COLORS.gray} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDelete(method.id)}
                >
                  <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <ModernButton
          title="Add Payment Method"
          onPress={handleAddMethod}
          variant="primary"
          size="large"
          icon="add"
          iconPosition="left"
          style={styles.addButton}
        />
      </SafeAreaView>

      {/* Add Payment Method Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Payment Method</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Display Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="e.g., My Telebirr"
                  placeholderTextColor={COLORS.grayLight}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Type *</Text>
                <View style={styles.typeButtons}>
                  {['mobile_money', 'card', 'bank_account'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeButton,
                        formData.type === type && styles.typeButtonActive,
                      ]}
                      onPress={() => setFormData({ ...formData, type })}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          formData.type === type && styles.typeButtonTextActive,
                        ]}
                      >
                        {type === 'mobile_money' ? 'Mobile Money' : type === 'card' ? 'Card' : 'Bank Account'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {formData.type === 'mobile_money' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Provider *</Text>
                  <View style={styles.typeButtons}>
                    {['telebirr', 'chapa', 'm_pesa'].map((provider) => (
                      <TouchableOpacity
                        key={provider}
                        style={[
                          styles.typeButton,
                          formData.provider === provider && styles.typeButtonActive,
                        ]}
                        onPress={() => setFormData({ ...formData, provider })}
                      >
                        <Text
                          style={[
                            styles.typeButtonText,
                            formData.provider === provider && styles.typeButtonTextActive,
                          ]}
                        >
                          {provider.charAt(0).toUpperCase() + provider.slice(1).replace('_', ' ')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  {formData.type === 'mobile_money' ? 'Phone Number *' : formData.type === 'card' ? 'Card Number *' : 'Account Number *'}
                </Text>
                <TextInput
                  style={styles.input}
                  value={formData.account_number}
                  onChangeText={(text) => setFormData({ ...formData, account_number: text })}
                  placeholder={formData.type === 'mobile_money' ? '+251 9XX XXX XXXX' : 'Enter number'}
                  placeholderTextColor={COLORS.grayLight}
                  keyboardType={formData.type === 'mobile_money' ? 'phone-pad' : 'numeric'}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <ModernButton
                title="Cancel"
                onPress={() => setShowAddModal(false)}
                variant="outline"
                size="large"
                style={styles.modalButton}
              />
              <ModernButton
                title="Save"
                onPress={handleSaveMethod}
                variant="primary"
                size="large"
                style={styles.modalButton}
              />
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
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  methodInfo: {
    flex: 1,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  methodName: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
    color: COLORS.secondary,
  },
  defaultBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    marginLeft: SPACING.sm,
  },
  defaultText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.white,
    fontWeight: FONTS.weights.bold,
  },
  methodNumber: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
  },
  methodActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    padding: SPACING.sm,
  },
  footer: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  addButton: {
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.secondary,
  },
  modalBody: {
    padding: SPACING.md,
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.secondary,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONTS.sizes.md,
    color: COLORS.secondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  typeButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  typeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeButtonText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.secondary,
  },
  typeButtonTextActive: {
    color: COLORS.white,
    fontWeight: FONTS.weights.bold,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  modalButton: {
    flex: 1,
  },
});

export default PaymentMethodsScreen;
