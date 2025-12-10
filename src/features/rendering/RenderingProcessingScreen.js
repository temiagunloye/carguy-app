// src/features/rendering/RenderingProcessingScreen.js
// Placeholder screen for 360° rendering processing

import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useCarContext } from "../../services/carContext";

export default function RenderingProcessingScreen({ navigation, route }) {
  const { carId, buildId, photoSet } = route.params || {};
  const { activeCar, demoMode, setActiveCarState } = useCarContext();
  const [processing, setProcessing] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate rendering process
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setProcessing(false);
          return 100;
        }
        return prev + 10;
      });
    }, 500);

    // Complete after 5 seconds
    setTimeout(() => {
      clearInterval(interval);
      setProcessing(false);
      setProgress(100);
      
      // Update car with rendering status
      if (demoMode && activeCar && carId === activeCar.id) {
        const updatedCar = {
          ...activeCar,
          rendering: {
            status: "READY",
            renderUrl: null, // Placeholder - would be actual 3D model URL
            progress: 100,
          },
        };
        setActiveCarState(updatedCar);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleContinue = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "MainTabs" }],
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 24 }} />
        <Text style={styles.headerTitle}>Creating 360° View</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Car Preview */}
        {activeCar?.imageUrl && (
          <View style={styles.carPreview}>
            <Image
              source={{ uri: activeCar.imageUrl }}
              style={styles.carImage}
              resizeMode="cover"
            />
            <View style={styles.blurOverlay} />
            <View style={styles.carFocus}>
              <Ionicons name="car-outline" size={64} color="#22c55e" />
            </View>
          </View>
        )}

        {/* Processing Status */}
        <View style={styles.statusContainer}>
          {processing ? (
            <>
              <ActivityIndicator color="#22c55e" size="large" />
              <Text style={styles.statusTitle}>Processing Your Car</Text>
              <Text style={styles.statusSubtitle}>
                Creating realistic 360° rendering...
              </Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.progressText}>{progress}%</Text>
            </>
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={64} color="#22c55e" />
              <Text style={styles.statusTitle}>Rendering Complete!</Text>
              <Text style={styles.statusSubtitle}>
                Your car is ready for part visualization
              </Text>
            </>
          )}
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#4a9eff" />
          <Text style={styles.infoText}>
            The background has been blurred to focus on your car. You can now visualize parts on your build.
          </Text>
        </View>

        {/* Continue Button */}
        {!processing && (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Continue to App</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        )}
      </View>
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
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 32,
    alignItems: "center",
  },
  carPreview: {
    width: "100%",
    height: 300,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 32,
    position: "relative",
  },
  carImage: {
    width: "100%",
    height: "100%",
  },
  blurOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  carFocus: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -32 }, { translateY: -32 }],
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    borderRadius: 32,
    padding: 16,
  },
  statusContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  statusTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  statusSubtitle: {
    color: "#a0a0a0",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 24,
  },
  progressBar: {
    width: 200,
    height: 4,
    backgroundColor: "#1a1a1a",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#22c55e",
  },
  progressText: {
    color: "#a0a0a0",
    fontSize: 13,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#0a0a0a",
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  infoText: {
    flex: 1,
    color: "#a0a0a0",
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
  },
  continueButton: {
    backgroundColor: "#22c55e",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  continueButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});

