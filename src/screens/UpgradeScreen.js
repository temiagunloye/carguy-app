// src/screens/UpgradeScreen.js

import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useCarContext } from "../services/carContext";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Get started with basic features",
    features: [
      { text: "1 vehicle", included: true },
      { text: "Dealer images only", included: true },
      { text: "Basic inventory tracking", included: true },
      { text: "Custom car photos", included: false },
      { text: "Build history", included: false },
      { text: "Multiple vehicles", included: false },
      { text: "Priority support", included: false },
    ],
    color: "#666",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$9.99",
    period: "/month",
    description: "Perfect for car enthusiasts",
    features: [
      { text: "1 vehicle", included: true },
      { text: "Custom car photos", included: true },
      { text: "Full inventory tracking", included: true },
      { text: "Build history & timeline", included: true },
      { text: "Export data", included: true },
      { text: "Multiple vehicles", included: false },
      { text: "Priority support", included: false },
    ],
    color: "#4a9eff",
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: "$19.99",
    period: "/month",
    description: "For serious collectors",
    features: [
      { text: "Unlimited vehicles", included: true },
      { text: "Custom car photos", included: true },
      { text: "Full inventory tracking", included: true },
      { text: "Build history & timeline", included: true },
      { text: "Export data", included: true },
      { text: "Priority support", included: true },
      { text: "Early access to features", included: true },
    ],
    color: "#ffc107",
    popular: false,
  },
];

export default function UpgradeScreen({ navigation }) {
  const { plan: currentPlan } = useCarContext();
  const [selectedPlan, setSelectedPlan] = useState("pro");

  const handleSubscribe = (planId) => {
    if (planId === currentPlan) {
      Alert.alert("Current Plan", "You're already on this plan!");
      return;
    }

    if (planId === "free") {
      Alert.alert(
        "Downgrade",
        "Are you sure you want to downgrade to the Free plan? You'll lose access to premium features.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Downgrade", style: "destructive", onPress: () => {
            // TODO: Implement downgrade logic
            Alert.alert("Success", "Your plan has been updated to Free.");
          }},
        ]
      );
      return;
    }

    // For demo purposes, show a mock purchase flow
    Alert.alert(
      "Subscribe",
      `Subscribe to ${planId === "pro" ? "Pro" : "Premium"} plan?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Subscribe", onPress: () => {
          // TODO: Implement actual IAP/subscription logic
          Alert.alert(
            "Demo Mode",
            "In the full app, this would connect to Apple/Google subscription services. For now, your plan has been updated!",
            [{ text: "OK", onPress: () => navigation.goBack() }]
          );
        }},
      ]
    );
  };

  const renderPlanCard = (plan) => {
    const isCurrentPlan = currentPlan === plan.id;
    const isSelected = selectedPlan === plan.id;

    return (
      <TouchableOpacity
        key={plan.id}
        style={[
          styles.planCard,
          isSelected && styles.planCardSelected,
          isSelected && { borderColor: plan.color },
        ]}
        onPress={() => setSelectedPlan(plan.id)}
      >
        {plan.popular && (
          <View style={[styles.popularBadge, { backgroundColor: plan.color }]}>
            <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
          </View>
        )}

        {isCurrentPlan && (
          <View style={styles.currentBadge}>
            <Text style={styles.currentBadgeText}>CURRENT</Text>
          </View>
        )}

        <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
        
        <View style={styles.priceRow}>
          <Text style={styles.planPrice}>{plan.price}</Text>
          <Text style={styles.planPeriod}>{plan.period}</Text>
        </View>
        
        <Text style={styles.planDescription}>{plan.description}</Text>

        <View style={styles.featuresContainer}>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Text style={[
                styles.featureIcon,
                { color: feature.included ? "#4caf50" : "#444" }
              ]}>
                {feature.included ? "✓" : "✗"}
              </Text>
              <Text style={[
                styles.featureText,
                { color: feature.included ? "#ccc" : "#555" }
              ]}>
                {feature.text}
              </Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.selectButton,
            isCurrentPlan && styles.selectButtonDisabled,
            isSelected && !isCurrentPlan && { backgroundColor: plan.color },
          ]}
          onPress={() => handleSubscribe(plan.id)}
          disabled={isCurrentPlan}
        >
          <Text style={[
            styles.selectButtonText,
            isSelected && !isCurrentPlan && { color: "#000" },
          ]}>
            {isCurrentPlan ? "Current Plan" : plan.id === "free" ? "Downgrade" : "Subscribe"}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Choose Your Plan</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Intro */}
        <Text style={styles.introText}>
          Unlock premium features to get the most out of your car build experience.
        </Text>

        {/* Plans */}
        {PLANS.map(renderPlanCard)}

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
          
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Can I cancel anytime?</Text>
            <Text style={styles.faqAnswer}>
              Yes! You can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>What happens to my data if I downgrade?</Text>
            <Text style={styles.faqAnswer}>
              Your data is always safe. If you downgrade, you'll keep all your existing data but won't be able to add more vehicles beyond the plan limit.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Is there a free trial?</Text>
            <Text style={styles.faqAnswer}>
              New users get a 7-day free trial of Pro features when they sign up!
            </Text>
          </View>
        </View>

        {/* Terms */}
        <Text style={styles.termsText}>
          By subscribing, you agree to our Terms of Service and Privacy Policy. Subscriptions automatically renew unless cancelled.
        </Text>

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
  scrollContent: {
    paddingHorizontal: 16,
  },
  introText: {
    color: "#888",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  planCard: {
    backgroundColor: "#181818",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#282828",
    position: "relative",
  },
  planCardSelected: {
    borderWidth: 2,
  },
  popularBadge: {
    position: "absolute",
    top: -12,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: "#000",
    fontSize: 10,
    fontWeight: "700",
  },
  currentBadge: {
    position: "absolute",
    top: -12,
    left: 20,
    backgroundColor: "#333",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  currentBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  planName: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
  },
  planPrice: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "700",
  },
  planPeriod: {
    color: "#888",
    fontSize: 16,
    marginLeft: 4,
  },
  planDescription: {
    color: "#888",
    fontSize: 14,
    marginBottom: 20,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  featureIcon: {
    fontSize: 16,
    width: 24,
  },
  featureText: {
    fontSize: 14,
  },
  selectButton: {
    backgroundColor: "#282828",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  selectButtonDisabled: {
    backgroundColor: "#1a1a1a",
  },
  selectButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  faqSection: {
    marginTop: 24,
    marginBottom: 24,
  },
  faqTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },
  faqItem: {
    backgroundColor: "#181818",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  faqQuestion: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  faqAnswer: {
    color: "#888",
    fontSize: 14,
    lineHeight: 20,
  },
  termsText: {
    color: "#555",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
});


