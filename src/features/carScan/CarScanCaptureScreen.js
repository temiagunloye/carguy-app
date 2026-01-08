// src/features/carScan/CarScanCaptureScreen.js
// AR-style guided 10-angle car photo capture

import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useCarContext } from "../../services/carContext";
import { createOrUpdateCarDoc } from "../../services/cars";
import { generateCarModel } from "../../services/cloudFunctions";
import { uploadAllCarPhotos } from "../../services/photoUpload";
import { CAR_SCAN_SHOTS } from "./carScanConfig";
import CarScanGlareTipModal from "./CarScanGlareTipModal";
import { resumeIncompleteCarScanSession, saveCarScanShot, startCarScanSession } from "./carScanStorage";

export default function CarScanCaptureScreen({ navigation, route }) {
  const { carId, buildId, isOnboarding } = route.params || {};
  const { activeCar, demoMode, setActiveCarState, user } = useCarContext();
  const [currentShotIndex, setCurrentShotIndex] = useState(0);
  const [session, setSession] = useState(null);
  const [shots, setShots] = useState({});
  const [loading, setLoading] = useState(true);
  const [showGlareTip, setShowGlareTip] = useState(false);
  const [processing, setProcessing] = useState(false);

  const currentShot = CAR_SCAN_SHOTS[currentShotIndex];
  const progress = ((currentShotIndex + 1) / CAR_SCAN_SHOTS.length) * 100;
  const isComplete = Object.keys(shots).length === CAR_SCAN_SHOTS.length;

  // Simplified shot title for display
  const getShotDisplayTitle = (shot) => {
    const simpleTitles = {
      'driver_front': 'Front - Driver Side',
      'passenger_front': 'Front - Passenger Side',
      'driver_rear': 'Rear - Driver Side',
      'passenger_rear': 'Rear - Passenger Side',
      'full_driver_side': 'Full Driver Side',
      'full_passenger_side': 'Full Passenger Side',
      'front_center': 'Front Center',
      'rear_center': 'Rear Center',
      'front_low': 'Front Low',
      'rear_low': 'Rear Low',
    };
    return simpleTitles[shot.id] || shot.title;
  };

  useEffect(() => {
    initializeSession();
  }, [carId]);

  const initializeSession = async () => {
    if (!carId) {
      Alert.alert("Error", "No car ID provided");
      navigation.goBack();
      return;
    }

    setLoading(true);
    try {
      // Try to resume incomplete session
      let existingSession = await resumeIncompleteCarScanSession(carId);

      if (!existingSession) {
        // Start new session
        existingSession = await startCarScanSession(carId);
      }

      setSession(existingSession);

      // Load existing shots
      const existingShots = {};
      existingSession.shots.forEach(shot => {
        existingShots[shot.id] = shot;
      });
      setShots(existingShots);

      // Find first incomplete shot
      const firstIncomplete = CAR_SCAN_SHOTS.findIndex(shot => !existingShots[shot.id]);
      if (firstIncomplete >= 0) {
        setCurrentShotIndex(firstIncomplete);
      }
    } catch (error) {
      console.error("Error initializing session:", error);
      Alert.alert("Error", "Could not start scan session");
    } finally {
      setLoading(false);
    }
  };

  const handleCapturePhoto = async (fromCamera = false) => {
    try {
      let result;

      if (fromCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Required", "Camera access is needed.");
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [16, 9],
          quality: 0.9,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Required", "Photo library access is needed.");
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          aspect: [16, 9],
          quality: 0.9,
        });
      }

      if (!result.canceled && result.assets?.[0]?.uri) {
        const asset = result.assets[0];

        const shot = {
          id: currentShot.id,
          label: currentShot.label,
          imageUri: asset.uri,
          width: asset.width,
          height: asset.height,
          createdAt: new Date().toISOString(),
        };

        // Save shot
        await saveCarScanShot(session.sessionId, shot);

        // Update local state
        setShots(prev => ({ ...prev, [currentShot.id]: shot }));

        // Move to next shot
        if (currentShotIndex < CAR_SCAN_SHOTS.length - 1) {
          setCurrentShotIndex(currentShotIndex + 1);
        }
        // Note: When all shots are complete, the Finish button will appear
        // User can click Finish to go to main photo selection
      }
    } catch (error) {
      console.error("Error capturing photo:", error);
      Alert.alert("Error", "Could not capture photo");
    }
  };

  const handleSkip = () => {
    if (currentShotIndex < CAR_SCAN_SHOTS.length - 1) {
      setCurrentShotIndex(currentShotIndex + 1);
    }
  };

  const handleRetake = () => {
    const newShots = { ...shots };
    delete newShots[currentShot.id];
    setShots(newShots);
  };

  if (loading || !session) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color="#fff" size="large" />
          <Text style={styles.loadingText}>Loading scan session...</Text>
        </View>
      </View>
    );
  }

  const hasCurrentShot = !!shots[currentShot.id];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Car Scan</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {currentShotIndex + 1} of {CAR_SCAN_SHOTS.length}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Current Shot Info */}
        <View style={styles.shotInfo}>
          <Text style={styles.shotTitle}>{getShotDisplayTitle(currentShot)}</Text>
          <Text style={styles.shotDescription}>
            Photo {currentShotIndex + 1} of {CAR_SCAN_SHOTS.length}
          </Text>

          {/* Hints */}
          <View style={styles.hintsContainer}>
            <View style={styles.hintRow}>
              <Ionicons name="resize-outline" size={16} color="#a0a0a0" />
              <Text style={styles.hintText}>{currentShot.distanceHint}</Text>
            </View>
            <View style={styles.hintRow}>
              <Ionicons name="phone-portrait-outline" size={16} color="#a0a0a0" />
              <Text style={styles.hintText}>{currentShot.heightHint}</Text>
            </View>
            <View style={styles.hintRow}>
              <Ionicons name="camera-outline" size={16} color="#a0a0a0" />
              <Text style={styles.hintText}>{currentShot.angleHint}</Text>
            </View>
          </View>
        </View>

        {/* Photo Preview or Placeholder */}
        {hasCurrentShot ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: shots[currentShot.id].imageUri }} style={styles.previewImage} />
            <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
              <Ionicons name="refresh-outline" size={20} color="#fff" />
              <Text style={styles.retakeButtonText}>Retake</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <Ionicons name="camera-outline" size={64} color="#666" />
            <Text style={styles.placeholderText}>Capture {currentShot.label}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={() => handleCapturePhoto(true)}
          >
            <Ionicons name="camera" size={24} color="#fff" />
            <Text style={styles.captureButtonText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.galleryButton}
            onPress={() => handleCapturePhoto(false)}
          >
            <Ionicons name="images-outline" size={20} color="#fff" />
            <Text style={styles.galleryButtonText}>From Gallery</Text>
          </TouchableOpacity>

          {!hasCurrentShot && !isComplete && (
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>Skip this angle</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Save Button - Always visible (can save with any number of photos, even 0) */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            Object.keys(shots).length === 0 && styles.saveButtonDisabled,
          ]}
          onPress={async () => {
            const shotArray = Object.values(shots);

            // Save photos to car/build (even if empty or partial)
            if (demoMode && activeCar && carId === activeCar.id) {
              const updatedCar = {
                ...activeCar,
                photoSet: {
                  buildId,
                  shots: shotArray,
                  createdAt: new Date().toISOString(),
                },
                builds: activeCar.builds?.map(b =>
                  b.id === buildId
                    ? { ...b, photoSet: { shots: shotArray } }
                    : b
                ) || [],
                rendering: {
                  status: shotArray.length >= 10 ? "PROCESSING" : "PENDING",
                  renderUrl: null,
                },
              };
              setActiveCarState(updatedCar);
            }

            // Navigate to rendering processing if 10 photos, otherwise to success
            if (isOnboarding) {
              if (shotArray.length >= 10) {
                // Navigate to rendering processing
                navigation.navigate("RenderingProcessing", {
                  carId,
                  buildId,
                  photoSet: { shots: shotArray },
                });
              } else {
                navigation.reset({
                  index: 0,
                  routes: [{ name: "MainTabs" }],
                });
                Alert.alert(
                  "Car Added!",
                  shotArray.length > 0
                    ? `Your car has been saved with ${shotArray.length} photo${shotArray.length > 1 ? 's' : ''}. Add more photos later for 360° rendering.`
                    : "Your car has been saved. You can add photos later for 360° rendering.",
                  [{ text: "OK" }]
                );
              }
            } else {
              navigation.goBack();
              Alert.alert("Success", "Photos saved!");
            }
          }}
          disabled={Object.keys(shots).length === 0}
        >
          <Ionicons name="save-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.saveButtonText}>
            {Object.keys(shots).length > 0
              ? `Save (${Object.keys(shots).length}/${CAR_SCAN_SHOTS.length})`
              : "Save (0 photos)"}
          </Text>
        </TouchableOpacity>

        {/* Finish Button - Only show when all photos are captured */}
        {isComplete && (
          <TouchableOpacity
            style={styles.finishButton}
            onPress={async () => {
              try {
                setProcessing(true);
                const allShots = Object.values(shots);

                // Validate count
                if (allShots.length !== 10) {
                  Alert.alert('Error', `Need 10 photos, have ${allShots.length}`);
                  setProcessing(false);
                  return;
                }

                // Build photo map
                const photoMap = {};
                allShots.forEach(shot => { photoMap[shot.id] = shot.imageUri; });

                // Get user & tier
                if (!user?.uid) {
                  Alert.alert('Error', 'Not authenticated');
                  setProcessing(false);
                  return;
                }
                const tier = activeCar?.tier || 'free';

                // Upload to Firebase Storage
                console.log('[Phase2] Uploading photos...');
                const { photoAngles, photoPaths } = await uploadAllCarPhotos(user.uid, carId, photoMap);

                // Update Firestore
                await createOrUpdateCarDoc(carId, {
                  userId: user.uid,
                  make: activeCar?.make || '',
                  model: activeCar?.model || '',
                  year: activeCar?.year || 2024,
                  trim: activeCar?.trim || null,
                  tier,
                  photoAngles,
                  renderStatus: 'draft',
                  renderError: null,
                  modelUrl: null,
                });


                // Create render job
                console.log('[Phase2] Creating render job...');
                const { jobId } = await generateCarModel({ carId, photoPaths });

                console.log('[Phase2] ✓ Render job created:', jobId);
                setProcessing(false);

                // Navigate to processing screen
                navigation.navigate('RenderProcessing', { jobId, carId });
              } catch (err) {
                console.error('[Phase2] Error:', err);
                setProcessing(false);
                Alert.alert('Upload Failed', err.message);
              }
            }}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.finishButtonText}>Finish</Text>
          </TouchableOpacity>
        )}

        {/* Processing State (Onboarding) */}
        {processing && (
          <View style={styles.completeContainer}>
            <ActivityIndicator color="#22c55e" size="large" />
            <Text style={styles.completeText}>Processing your car...</Text>
            <Text style={styles.processingSubtext}>Creating 360° rendering</Text>
          </View>
        )}

        {/* Completion Status */}
        {isComplete && !processing && !isOnboarding && (
          <View style={styles.completeContainer}>
            <Ionicons name="checkmark-circle" size={48} color="#22c55e" />
            <Text style={styles.completeText}>All angles captured!</Text>
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Glare Tip Modal */}
      <CarScanGlareTipModal
        visible={showGlareTip}
        onContinue={() => setShowGlareTip(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#a0a0a0",
    marginTop: 12,
    fontSize: 14,
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
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  progressBar: {
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
    fontSize: 12,
    textAlign: "center",
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  shotInfo: {
    marginTop: 20,
    marginBottom: 24,
  },
  shotTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  shotDescription: {
    color: "#a0a0a0",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  hintsContainer: {
    backgroundColor: "#0a0a0a",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  hintText: {
    color: "#a0a0a0",
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  previewContainer: {
    marginBottom: 24,
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: 240,
    borderRadius: 8,
    backgroundColor: "#0a0a0a",
  },
  retakeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  retakeButtonText: {
    color: "#fff",
    fontSize: 13,
    marginLeft: 6,
    fontWeight: "600",
  },
  placeholderContainer: {
    height: 240,
    backgroundColor: "#0a0a0a",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#1a1a1a",
    borderStyle: "dashed",
    marginBottom: 24,
  },
  placeholderText: {
    color: "#666",
    fontSize: 14,
    marginTop: 12,
  },
  actionsContainer: {
    gap: 12,
  },
  captureButton: {
    backgroundColor: "#22c55e",
    paddingVertical: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  captureButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  galleryButton: {
    backgroundColor: "#0a0a0a",
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  galleryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "500",
    marginLeft: 8,
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  skipButtonText: {
    color: "#666",
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: "#4a9eff",
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  finishButton: {
    backgroundColor: "#22c55e",
    paddingVertical: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  finishButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  completeContainer: {
    marginTop: 32,
    alignItems: "center",
    padding: 24,
    backgroundColor: "#0a0a0a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  completeText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 8,
  },
  processingSubtext: {
    color: "#a0a0a0",
    fontSize: 14,
    marginTop: 8,
  },
  doneButton: {
    backgroundColor: "#22c55e",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  doneButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});

