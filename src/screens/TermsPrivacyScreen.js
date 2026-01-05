// src/screens/TermsPrivacyScreen.js

import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const TABS = ["Terms of Service", "Privacy Policy"];

export default function TermsPrivacyScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Legal</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab, index) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === index && styles.tabActive]}
            onPress={() => setActiveTab(index)}
          >
            <Text style={[styles.tabText, activeTab === index && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {activeTab === 0 ? (
          // Terms of Service
          <View style={styles.section}>
            <Text style={styles.lastUpdated}>Last updated: December 2024</Text>

            <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
            <Text style={styles.sectionText}>
              By accessing and using That Car Guy App ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the App.
            </Text>

            <Text style={styles.sectionTitle}>2. Description of Service</Text>
            <Text style={styles.sectionText}>
              That Car Guy App provides a platform for automotive enthusiasts to manage their vehicle inventory, track modifications, and explore potential upgrades. The service includes free and premium subscription tiers with varying features.
            </Text>

            <Text style={styles.sectionTitle}>3. User Accounts</Text>
            <Text style={styles.sectionText}>
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information when creating your account.
            </Text>

            <Text style={styles.sectionTitle}>4. Subscription & Payments</Text>
            <Text style={styles.sectionText}>
              Premium features require a paid subscription. Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period. Refunds are subject to the policies of the App Store or Google Play Store.
            </Text>

            <Text style={styles.sectionTitle}>5. User Content</Text>
            <Text style={styles.sectionText}>
              You retain ownership of content you upload to the App. By uploading content, you grant us a license to use, store, and display that content in connection with providing the service.
            </Text>

            <Text style={styles.sectionTitle}>6. Prohibited Conduct</Text>
            <Text style={styles.sectionText}>
              You agree not to: (a) violate any laws; (b) upload harmful or inappropriate content; (c) attempt to gain unauthorized access to the service; (d) interfere with other users' enjoyment of the App.
            </Text>

            <Text style={styles.sectionTitle}>7. Limitation of Liability</Text>
            <Text style={styles.sectionText}>
              The App is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the service.
            </Text>

            <Text style={styles.sectionTitle}>8. Changes to Terms</Text>
            <Text style={styles.sectionText}>
              We may modify these terms at any time. Continued use of the App after changes constitutes acceptance of the new terms.
            </Text>
          </View>
        ) : (
          // Privacy Policy
          <View style={styles.section}>
            <Text style={styles.lastUpdated}>Last updated: December 2024</Text>

            <Text style={styles.sectionTitle}>1. Information We Collect</Text>
            <Text style={styles.sectionText}>
              We collect information you provide directly, including: account information (email, name), vehicle data (make, model, year, photos), and parts/modifications you add to the App.
            </Text>

            <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
            <Text style={styles.sectionText}>
              We use your information to: provide and improve the service, personalize your experience, communicate with you about your account, and analyze usage patterns to enhance the App.
            </Text>

            <Text style={styles.sectionTitle}>3. Data Storage & Security</Text>
            <Text style={styles.sectionText}>
              Your data is stored securely using industry-standard encryption. We use Firebase services for authentication and data storage, which comply with major security standards.
            </Text>

            <Text style={styles.sectionTitle}>4. Data Sharing</Text>
            <Text style={styles.sectionText}>
              We do not sell your personal information. We may share data with: service providers who help operate the App, law enforcement when required by law, and in connection with a business transfer.
            </Text>

            <Text style={styles.sectionTitle}>5. Your Rights</Text>
            <Text style={styles.sectionText}>
              You have the right to: access your data, correct inaccurate data, delete your account and associated data, and export your data (available for Pro and Premium users).
            </Text>

            <Text style={styles.sectionTitle}>6. Cookies & Analytics</Text>
            <Text style={styles.sectionText}>
              We use analytics tools to understand how users interact with the App. This helps us improve the user experience and fix issues.
            </Text>

            <Text style={styles.sectionTitle}>7. Children's Privacy</Text>
            <Text style={styles.sectionText}>
              The App is not intended for children under 13. We do not knowingly collect information from children under 13.
            </Text>

            <Text style={styles.sectionTitle}>8. Contact Us</Text>
            <Text style={styles.sectionText}>
              If you have questions about this Privacy Policy, please contact us at privacy@thatcarguy.app.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
  },
  backButton: {
    width: 60,
  },
  backButtonText: {
    color: "#4a9eff",
    fontSize: 16,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#282828",
  },
  tabActive: {
    borderBottomColor: "#4a9eff",
  },
  tabText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "500",
  },
  tabTextActive: {
    color: "#4a9eff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {},
  lastUpdated: {
    color: "#666",
    fontSize: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 8,
  },
  sectionText: {
    color: "#aaa",
    fontSize: 14,
    lineHeight: 22,
  },
});


