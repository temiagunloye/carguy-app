// src/screens/ProfileScreen.js

import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useCarContext } from "../services/carContext";
import { useTheme } from "../services/themeContext";

const PLAN_DETAILS = {
  free: {
    name: "Free",
    color: "#666",
    features: ["1 vehicle", "Dealer images only", "Basic inventory"],
  },
  pro: {
    name: "Pro",
    color: "#4a9eff",
    features: ["1 vehicle", "Custom car photos", "Full inventory", "Build history"],
  },
  premium: {
    name: "Premium",
    color: "#ffc107",
    features: ["Unlimited vehicles", "Custom car photos", "Full inventory", "Build history", "Priority support"],
  },
};

export default function ProfileScreen({ navigation }) {
  const { user, plan, activeCar } = useCarContext();
  const { theme, isDarkMode, setDarkMode } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const planInfo = PLAN_DETAILS[plan] || PLAN_DETAILS.free;

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              if (demoMode) {
                Alert.alert("Demo Mode", "You're in demo mode. No sign out needed.");
                return;
              }
              
              const { signOut } = await import("firebase/auth");
              const { auth } = await import("../services/firebaseConfig");
              if (auth) {
                await signOut(auth);
              }
            } catch (error) {
              console.error("Sign out error:", error);
              Alert.alert("Error", "Failed to sign out. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleUpgrade = () => {
    navigation.navigate("Upgrade");
  };

  const SettingsRow = ({ iconName, iconColor, title, subtitle, onPress, rightElement }) => (
    <TouchableOpacity style={[styles.settingsRow, { borderTopColor: theme.border }]} onPress={onPress} disabled={!onPress}>
      <View style={[styles.settingsIconContainer, { backgroundColor: theme.surfaceLight }]}>
        <Ionicons name={iconName} size={20} color={iconColor || "#ffffff"} />
      </View>
      <View style={styles.settingsTextContainer}>
        <Text style={[styles.settingsTitle, { color: theme.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingsSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>}
      </View>
      {rightElement || (onPress && <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />)}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Profile</Text>
        </View>

        {/* User Card */}
        <View style={[styles.userCard, { backgroundColor: theme.surface }]}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user?.email?.[0]?.toUpperCase() || user?.displayName?.[0]?.toUpperCase() || "D"}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: theme.text }]}>
              {user?.displayName || "Demo User"}
            </Text>
            <Text style={[styles.userEmail, { color: theme.textSecondary }]}>
              {user?.email || "demo@carguyapp.com"}
            </Text>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate("EditProfile")}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Plan Card */}
        <View style={[styles.planCard, { backgroundColor: theme.surface }]}>
          <View style={styles.planHeader}>
            <View>
              <Text style={styles.planLabel}>Current Plan</Text>
              <View style={styles.planNameRow}>
                <Text style={[styles.planName, { color: planInfo.color }]}>
                  {planInfo.name}
                </Text>
                <View style={[styles.planBadge, { backgroundColor: planInfo.color }]}>
                  <Text style={styles.planBadgeText}>{planInfo.name.toUpperCase()}</Text>
                </View>
              </View>
            </View>
            {plan !== "premium" && (
              <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
                <Text style={styles.upgradeButtonText}>Upgrade</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.planFeatures}>
            {planInfo.features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Active Car Summary */}
        {activeCar && (
          <View style={styles.carSummaryCard}>
            <Text style={styles.sectionTitle}>Active Vehicle</Text>
            <View style={styles.carSummaryContent}>
              <View style={styles.carImagePlaceholder}>
                <Text style={styles.carImageText}>🚗</Text>
              </View>
              <View style={styles.carDetails}>
                <Text style={styles.carName}>
                  {activeCar.year} {activeCar.make} {activeCar.model}
                </Text>
                <Text style={styles.carSpecs}>
                  {activeCar.paintColor} • {activeCar.drivetrain}
                </Text>
              </View>
              <Text style={styles.carChevron}>›</Text>
            </View>
          </View>
        )}

        {/* Settings Section */}
        <View style={[styles.settingsSection, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Settings</Text>

          <SettingsRow
            iconName="notifications-outline"
            iconColor="#f59e0b"
            title="Notifications"
            subtitle="Push notifications for updates"
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: "#1a1a1a", true: "#4a9eff" }}
                thumbColor="#fff"
              />
            }
          />

          <SettingsRow
            iconName="moon-outline"
            iconColor="#fbbf24"
            title="Dark Mode"
            subtitle={isDarkMode ? "Dark theme active" : "Light theme active"}
            rightElement={
              <Switch
                value={isDarkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: "#1a1a1a", true: "#4a9eff" }}
                thumbColor="#fff"
              />
            }
          />

          <SettingsRow
            iconName="car-outline"
            iconColor="#ef4444"
            title="Manage Vehicles"
            subtitle="Add or remove vehicles"
            onPress={() => navigation.navigate("InventoryTab")}
          />

          <SettingsRow
            iconName="card-outline"
            iconColor="#ffffff"
            title="Subscription"
            subtitle="Manage your plan"
            onPress={handleUpgrade}
          />

          <SettingsRow
            iconName="stats-chart-outline"
            iconColor="#3b82f6"
            title="Usage Stats"
            subtitle="View your app statistics"
            onPress={() => navigation.navigate("UsageStats")}
          />
        </View>

        {/* Support Section */}
        <View style={[styles.settingsSection, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Support</Text>

          <SettingsRow
            iconName="help-circle-outline"
            iconColor="#ef4444"
            title="Help Center"
            subtitle="FAQs and tutorials"
            onPress={() => navigation.navigate("HelpCenter")}
          />

          <SettingsRow
            iconName="chatbubble-outline"
            iconColor="#666666"
            title="Contact Us"
            subtitle="Get in touch with support"
            onPress={() => navigation.navigate("ContactUs")}
          />

          <SettingsRow
            iconName="star-outline"
            iconColor="#fbbf24"
            title="Rate the App"
            subtitle="Leave us a review"
            onPress={() => {
              Alert.alert(
                "Rate Us!",
                "Enjoying the app? We'd love your feedback on the App Store!",
                [
                  { text: "Maybe Later", style: "cancel" },
                  { text: "Rate Now", onPress: () => {} }
                ]
              );
            }}
          />

          <SettingsRow
            iconName="document-text-outline"
            iconColor="#d97706"
            title="Terms & Privacy"
            subtitle="Legal information"
            onPress={() => navigation.navigate("TermsPrivacy")}
          />
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.versionText}>That Car Guy App v1.0.0</Text>

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
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#181818",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 2,
  },
  userEmail: {
    color: "#888",
    fontSize: 14,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#252525",
  },
  editButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  planCard: {
    backgroundColor: "#181818",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  planLabel: {
    color: "#888",
    fontSize: 12,
    marginBottom: 4,
  },
  planNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  planName: {
    fontSize: 24,
    fontWeight: "700",
    marginRight: 8,
  },
  planBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  planBadgeText: {
    color: "#000",
    fontSize: 10,
    fontWeight: "700",
  },
  upgradeButton: {
    backgroundColor: "#4a9eff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  upgradeButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  planFeatures: {
    borderTopWidth: 1,
    borderTopColor: "#252525",
    paddingTop: 16,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  featureCheck: {
    color: "#22c55e",
    fontSize: 14,
    marginRight: 8,
    fontWeight: "700",
    fontWeight: "700",
  },
  featureText: {
    color: "#ccc",
    fontSize: 14,
  },
  carSummaryCard: {
    backgroundColor: "#181818",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  carSummaryContent: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  carImagePlaceholder: {
    width: 60,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#252525",
    justifyContent: "center",
    alignItems: "center",
  },
  carImageText: {
    fontSize: 20,
  },
  carDetails: {
    flex: 1,
    marginLeft: 12,
  },
  carName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  carSpecs: {
    color: "#888",
    fontSize: 13,
  },
  carChevron: {
    color: "#666",
    fontSize: 20,
  },
  settingsSection: {
    backgroundColor: "#181818",
    marginHorizontal: 16,
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#252525",
  },
  settingsIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#252525",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingsIcon: {
    fontSize: 18,
  },
  settingsTextContainer: {
    flex: 1,
  },
  settingsTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  settingsSubtitle: {
    color: "#888",
    fontSize: 13,
    marginTop: 2,
  },
  settingsChevron: {
    color: "#666",
    fontSize: 20,
  },
  signOutButton: {
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: "#0a0a0a",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ef4444",
    borderWidth: 1,
    borderColor: "#ff4444",
    marginBottom: 16,
  },
  signOutText: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "600",
  },
  versionText: {
    color: "#666666",
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
  },
});
