import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';

const HelpCenterScreen = ({ navigation }) => {
  const [expandedSection, setExpandedSection] = useState(null);

  const faqSections = [
    {
      id: 'booking',
      title: 'Booking & Trips',
      icon: 'calendar-outline',
      questions: [
        {
          q: 'How do I book a trip?',
          a: 'Select your destination, choose a date and provider, select your pickup station, and complete payment. You\'ll receive a confirmation with a QR code.',
        },
        {
          q: 'Can I cancel my booking?',
          a: 'Yes, you can cancel your booking from the Trips tab. Cancellation policies may vary by provider.',
        },
        {
          q: 'What happens if I miss my trip?',
          a: 'Contact support immediately. Refund policies depend on the provider and timing of cancellation.',
        },
      ],
    },
    {
      id: 'payment',
      title: 'Payment & Refunds',
      icon: 'card-outline',
      questions: [
        {
          q: 'What payment methods are accepted?',
          a: 'We accept mobile money (M-Pesa, Telebirr), bank transfers, and credit/debit cards.',
        },
        {
          q: 'How do I get a refund?',
          a: 'Refunds are processed automatically for cancellations. Contact support if you have issues.',
        },
        {
          q: 'When will I receive my refund?',
          a: 'Refunds are typically processed within 5-7 business days to your original payment method.',
        },
      ],
    },
    {
      id: 'account',
      title: 'Account & Profile',
      icon: 'person-outline',
      questions: [
        {
          q: 'How do I update my profile?',
          a: 'Go to Profile > My Account to update your name, phone number, email, and emergency contact.',
        },
        {
          q: 'How do I change my phone number?',
          a: 'Update your phone number in My Account. You may need to verify the new number.',
        },
      ],
    },
    {
      id: 'support',
      title: 'Support & Contact',
      icon: 'help-circle-outline',
      questions: [
        {
          q: 'How do I contact support?',
          a: 'You can reach us through the Help section in the app or email support@tankua.com',
        },
        {
          q: 'What are your support hours?',
          a: 'Our support team is available 24/7 to assist you with any issues.',
        },
      ],
    },
  ];

  const toggleSection = (sectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Help Center</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introCard}>
          <Ionicons name="help-circle" size={48} color={COLORS.primary} />
          <Text style={styles.introTitle}>How can we help you?</Text>
          <Text style={styles.introText}>
            Find answers to common questions or contact our support team
          </Text>
        </View>

        {faqSections.map((section) => (
          <View key={section.id} style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection(section.id)}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeaderLeft}>
                <View style={styles.sectionIcon}>
                  <Ionicons name={section.icon} size={24} color={COLORS.primary} />
                </View>
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
              <Ionicons
                name={expandedSection === section.id ? 'chevron-up' : 'chevron-down'}
                size={24}
                color={COLORS.gray}
              />
            </TouchableOpacity>

            {expandedSection === section.id && (
              <View style={styles.questionsContainer}>
                {section.questions.map((item, index) => (
                  <View key={index} style={styles.questionItem}>
                    <Text style={styles.question}>{item.q}</Text>
                    <Text style={styles.answer}>{item.a}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        <View style={styles.contactCard}>
          <Ionicons name="mail-outline" size={32} color={COLORS.primary} />
          <Text style={styles.contactTitle}>Still need help?</Text>
          <Text style={styles.contactText}>
            Contact our support team at support@tankua.com
          </Text>
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
  introCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
  },
  introTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.secondary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  introText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.gray,
    textAlign: 'center',
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
    color: COLORS.secondary,
  },
  questionsContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  questionItem: {
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  question: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.secondary,
    marginBottom: SPACING.sm,
  },
  answer: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    lineHeight: 20,
  },
  contactCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginTop: SPACING.md,
    ...SHADOWS.medium,
  },
  contactTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.secondary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  contactText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.gray,
    textAlign: 'center',
  },
});

export default HelpCenterScreen;
