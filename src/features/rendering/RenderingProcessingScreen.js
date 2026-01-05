// src/features/rendering/RenderingProcessingScreen.js
// 3D Reconstruction Processing Screen - Calls Cloud Function for real photogrammetry

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useCarContext } from "../../services/carContext";
import { getKiriStatusDisplay } from "../../services/kiri";

export default function RenderingProcessingScreen({ navigation, route }) {
  const { carId, buildId, photoSet } = route.params || {};
  const { activeCar, demoMode, setActiveCarState } = useCarContext();

  // Read KIRI status from activeCar (updated in real-time by startKiriScan callback)
  const kiriStatus = activeCar?.kiriStatus || 'idle';
  const kiriProgress = activeCar?.kiriProgress || 0;
  const kiriViewerUrl = activeCar?.kiriViewerUrl;
  const kiriError = activeCar?.kiriError;

  const statusDisplay = getKiriStatusDisplay(kiriStatus);

  const isProcessing = kiriStatus === 'uploading' || kiriStatus === 'processing';
  const isComplete = kiriStatus === 'complete';
  const hasError = kiriStatus === 'error';

  const handleContinue = () => {
    if (isComplete && kiriViewerUrl) {
      // Navigate to 3D model viewer
      navigation.navigate("ModelViewer", {
        viewerUrl: kiriViewerUrl,
        carName: activeCar?.nickname || `${activeCar?.year} ${activeCar?.make} ${activeCar?.model}`,
      });
    } else {
      // Go to home
      navigation.reset({
        index: 0,
        routes: [{ name: "MainTabs" }],
      });
    }
  };



  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 24 }} />
        <Text style={styles.headerTitle}>3D Model Generation</Text>
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
            {isProcessing && <View style={styles.blurOverlay} />}
            {isProcessing && (
              <View style={styles.carFocus}>
                <ActivityIndicator color="#22c55e" size="large" />
              </View>
            )}
          </View>
        )}

        {/* Status Display */}
        <View style={styles.statusContainer}>
          {isProcessing && (
            <>
              <View style={styles.statusHeader}>
                <Ionicons name={statusDisplay.icon} size={32} color={statusDisplay.color} />
                <Text style={[styles.statusText, { color: statusDisplay.color }]}>
                  {statusDisplay.text}
                </Text>
              </View>

              {/* Progress Bar */}
              {kiriProgress > 0 && (
                <View style={styles.progressSection}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${kiriProgress}%` }]} />
                  </View>
                  <Text style={styles.progressText}>{kiriProgress}%</Text>
                </View>
              )}

              {kiriStatus === 'uploading' && (
                <Text style={styles.statusSubtext}>
                  Uploading your 10 photos to KIRI Engine...
                </Text>
              )}

              {kiriStatus === 'processing' && (
                <>
                  <Text style={styles.statusSubtext}>
                    KIRI is generating your 3D model. This typically takes 5-15 minutes.
                  </Text>
                  <ActivityIndicator color="#4a9eff" size="large" style={{ marginTop: 20 }} />
                </>
              )}
            </>
          )}

          {isComplete && kiriViewerUrl && (
            <>
              <View style={styles.successHeader}>
                <Ionicons name="checkmark-circle" size={64} color="#22c55e" />
                <Text style={styles.successTitle}>3D Model Ready!</Text>
                <Text style={styles.successSubtext}>
                  Your car has been reconstructed in 3D
                </Text>
              </View>

              <TouchableOpacity
                style={styles.viewModelButton}
                onPress={() => {
                  navigation.navigate('ModelViewer', {
                    viewerUrl: kiriViewerUrl,
                    carName: activeCar?.nickname || `${activeCar?.year} ${activeCar?.make} ${activeCar?.model}`,
                  });
                }}
              >
                <Ionicons name="cube" size={24} color="#fff" style={{ marginRight: 10 }} />
                <Text style={styles.viewModelButtonText}>View 3D Model</Text>
              </TouchableOpacity>
            </>
          )}

          {hasError && (
            <>
              <Ionicons name="alert-circle" size={48} color="#ef4444" />
              <Text style={styles.errorText}>3D Generation Failed</Text>
              {kiriError && <Text style={styles.errorSubtext}>{kiriError}</Text>}
              <Text style={styles.errorSubtext}>You can still view your car with 2D photos</Text>
            </>
          )}
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#4a9eff" />
          <Text style={styles.infoText}>
            {isComplete
              ? "Your 3D model is ready! Tap 'View 3D Model' to explore it."
              : isProcessing
                ? "KIRI Engine is processing your photos. This typically takes 5-15 minutes."
                : "Your 10-angle scan has been uploaded to KIRI Engine for 3D reconstruction."}
          </Text>
        </View>



        {/* Continue Button */}
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>
            {isComplete ? 'Continue to Garage' : 'Continue to App'}
          </Text>
          <Ionicons
            name={isComplete ? 'checkmark' : 'arrow-forward'}
            size={20}
            color="#fff"
          />
        </TouchableOpacity>
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
    backgroundColor: "#4a9eff",
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
  generateButton: {
    backgroundColor: "#22c55e",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  generateButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  errorBox: {
    flexDirection: "row",
    backgroundColor: "#ef444415",
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#ef444430",
    alignItems: "center",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
});

