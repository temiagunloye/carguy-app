// src/features/carScan/CarScanIntroScreen.js
// Introduction screen explaining the purpose of the 10-photo scan

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function CarScanIntroScreen({ navigation, route }) {
  const { carId, buildId, isOnboarding } = route.params || {};

  const handleContinue = () => {
    navigation.replace("CarScanCapture", { carId, buildId, isOnboarding });
  };

  const handleSkip = () => {
    // Allow skipping and going straight to main app
    if (isOnboarding) {
      navigation.reset({
        index: 0,
        routes: [{ name: "MainTabs" }],
      });
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip}>
          <Ionicons name="close" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>10-Angle Car Scan</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="camera-outline" size={64} color="#22c55e" />
        </View>

        {/* Title */}
        <Text style={styles.title}>Why 10 Photos?</Text>

        {/* Purpose Explanation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Create a 360° View</Text>
          <Text style={styles.sectionText}>
            We capture 10 specific angles of your car to create a realistic 3D model. This allows you to:
          </Text>
        </View>

        {/* Benefits List */}
        <View style={styles.benefitsList}>
          <View style={styles.benefitItem}>
            <Ionicons name="cube-outline" size={24} color="#22c55e" style={styles.benefitIcon} />
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Visualize Parts</Text>
              <Text style={styles.benefitText}>
                See how new parts will look on your car before buying
              </Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <Ionicons name="eye-outline" size={24} color="#22c55e" style={styles.benefitIcon} />
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Realistic Rendering</Text>
              <Text style={styles.benefitText}>
                Get accurate part placement and fitment visualization
              </Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <Ionicons name="build-outline" size={24} color="#22c55e" style={styles.benefitIcon} />
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Build Planning</Text>
              <Text style={styles.benefitText}>
                Plan your modifications and see the final result
              </Text>
            </View>
          </View>
        </View>

        {/* What You'll Capture */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What You'll Capture</Text>
          <Text style={styles.sectionText}>
            We'll guide you through 10 angles:
          </Text>
          <View style={styles.anglesList}>
            <Text style={styles.angleItem}>• Front views (driver, passenger, center)</Text>
            <Text style={styles.angleItem}>• Rear views (driver, passenger, center)</Text>
            <Text style={styles.angleItem}>• Full side views (both sides)</Text>
            <Text style={styles.angleItem}>• Low angle views (front & rear)</Text>
          </View>
        </View>

        {/* Note */}
        <View style={styles.noteBox}>
          <Ionicons name="information-circle-outline" size={20} color="#4a9eff" />
          <Text style={styles.noteText}>
            You can save your progress at any time. You don't need all 10 photos to get started, but more photos = better visualization!
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleContinue}
          >
            <Text style={styles.primaryButtonText}>Start Photo Capture</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleSkip}
          >
            <Text style={styles.secondaryButtonText}>Skip for Now</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 40,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
  },
  sectionText: {
    color: "#a0a0a0",
    fontSize: 15,
    lineHeight: 22,
  },
  benefitsList: {
    marginBottom: 32,
  },
  benefitItem: {
    flexDirection: "row",
    backgroundColor: "#0a0a0a",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  benefitIcon: {
    marginRight: 16,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  benefitText: {
    color: "#a0a0a0",
    fontSize: 14,
    lineHeight: 20,
  },
  anglesList: {
    marginTop: 12,
    paddingLeft: 8,
  },
  angleItem: {
    color: "#a0a0a0",
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 4,
  },
  noteBox: {
    flexDirection: "row",
    backgroundColor: "#0a0a0a",
    borderRadius: 8,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "#1a1a1a30",
  },
  noteText: {
    flex: 1,
    color: "#a0a0a0",
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
  },
  buttons: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#22c55e",
    paddingVertical: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#0a0a0a",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  secondaryButtonText: {
    color: "#a0a0a0",
    fontSize: 16,
  },
});

