// src/screens/AddCarScreen.js

import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useCarContext } from "../services/carContext";
import {
  saveCarForUser,
  setActiveCar,
  uploadCarImage
} from "../services/carService";
import {
  canAddCar,
  getPlanConfig,
  getPlanLimitMessage,
} from "../services/plans";

// NOTE: This is a DEMO simulation. Real AI detection would use:
// - Google Cloud Vision API
// - OpenAI Vision API
// - Custom trained car recognition model
// For now, we show placeholder data to demonstrate the concept

export default function AddCarScreen({ navigation }) {
  const { user, plan, refreshActiveCar, demoMode, addDemoCar, setActiveCarState, demoCars } = useCarContext();
  const [renderStatus, setRenderStatus] = useState({ status: 'idle', previewUrl: null });

  // Get current car count for plan enforcement
  const currentCarCount = demoMode ? (demoCars || []).length : 0;

  const [step, setStep] = useState(1); // 1: Basic Info (nickname/model/year), 2: 10-Photo Capture, 3: Success
  const [nickname, setNickname] = useState("");
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [trim, setTrim] = useState("");
  const [drivetrain, setDrivetrain] = useState("");
  const [mileage, setMileage] = useState("");
  const [paintColor, setPaintColor] = useState("");
  const [localImageUri, setLocalImageUri] = useState(null);
  const [localImages, setLocalImages] = useState({
    front: null,
    side: null,
    rear: null,
  });
  const [saving, setSaving] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [detectionConfidence, setDetectionConfidence] = useState(null);
  const [savedCarId, setSavedCarId] = useState(null);
  const [savedBuildId, setSavedBuildId] = useState(null);

  // Check if user can upload multiple photos
  const canUploadMultiplePhotos = plan === "pro" || plan === "premium";

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Camera access is needed to take photos.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setLocalImageUri(result.assets[0].uri);
        setDetectionConfidence(null);
      }
    } catch (e) {
      Alert.alert("Error", "Could not open camera: " + e.message);
    }
  };

  const handleChoosePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Photo library access is needed.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setLocalImageUri(result.assets[0].uri);
        setDetectionConfidence(null);
      }
    } catch (e) {
      Alert.alert("Error", "Could not open photo library: " + e.message);
    }
  };

  // AI Detection - DEMO MODE
  // In production, this would call a real AI service
  const handleAIDetect = async () => {
    if (!localImageUri) {
      Alert.alert("No Photo", "Please upload a photo first.");
      return;
    }

    setDetecting(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    setDetecting(false);

    // Show demo message - let user fill in details
    Alert.alert(
      "AI Detection (Demo)",
      "In the full version, AI will automatically identify your car's make, model, year, and more from your photo.\n\nFor now, please enter your car details manually.",
      [
        {
          text: "Enter Details",
          onPress: () => setStep(2)
        }
      ]
    );
  };

  // Step 1: Handle basic info and transition to 10-photo flow
  const handleContinueToPhotos = async () => {
    if (!nickname.trim() || !year || !make || !model) {
      Alert.alert("Missing Info", "Please enter Nickname, Year, Make, and Model to continue.");
      return;
    }

    if (!localImageUri) {
      Alert.alert("Main Photo Required", "Please add a main photo before continuing.");
      return;
    }

    // Check plan limits before adding car
    const planConfig = getPlanConfig(plan || 'free');
    if (!canAddCar(plan || 'free', currentCarCount)) {
      Alert.alert(
        "Plan Limit Reached",
        getPlanLimitMessage(plan || 'free', 'car'),
        [
          { text: "Cancel", style: "cancel" },
          { text: "Upgrade", onPress: () => navigation.navigate("Upgrade") },
        ]
      );
      return;
    }

    try {
      setSaving(true);

      const carData = {
        nickname: nickname.trim(),
        year,
        make,
        model,
        trim,
        drivetrain,
        mileage,
        paintColor,
        imageUrl: localImageUri, // Original hero photo
        images: null,
        dealerImageUrl: null,
        aiDetected: false,
        aiConfidence: null,
        // Initialize rendering fields
        renderingPreviewUrl: null,
        renderMeshUrl: null,
        renderJobStatus: 'idle',
        renderLastUpdatedAt: null,
        anglePhotos: {
          front34: null,
          rear34: null,
          side: null,
          front: null,
          rear: null,
          roof: null,
          driverSide45: null,
          passengerSide45: null,
          lowFront: null,
          lowRear: null,
        },
      };

      let carId;
      let buildId;

      // Check if in demo mode
      if (demoMode) {
        // Save car locally
        const newCar = addDemoCar(carData);
        carId = newCar.id;

        // Create default build for this car
        const defaultBuild = {
          id: `build_${Date.now()}`,
          vehicleId: carId,
          name: nickname.trim() || "Main build",
          isActive: true,
          createdAt: new Date().toISOString(),
          parts: [],
          folders: [],
          photoSet: null, // Will be populated after 10 photos
          rendering: {
            status: "PENDING",
            renderUrl: null,
          },
        };

        // Add build to car
        const updatedCar = {
          ...newCar,
          builds: [defaultBuild],
          activeBuildId: defaultBuild.id,
        };
        setActiveCarState(updatedCar);
        buildId = defaultBuild.id;
      } else if (user) {
        // Firebase mode
        carId = await saveCarForUser({
          uid: user.uid,
          data: carData,
        });

        // Create default build
        const { createBuild, setActiveBuild } = await import("../services/buildService");
        buildId = await createBuild(user.uid, carId, nickname.trim() || "Main build");
        await setActiveBuild(user.uid, buildId);

        await setActiveCar(user.uid, carId);
        await refreshActiveCar();
      }

      setSavedCarId(carId);
      setSavedBuildId(buildId);
      setSaving(false);

      // Auto-transition directly to 10-photo capture
      navigation.navigate("CarScanCapture", {
        carId,
        buildId,
        isOnboarding: true,
      });
    } catch (e) {
      console.error("Save error:", e);
      setSaving(false);
      Alert.alert("Error", "Failed to save car. Please try again.");
    }
  };

  // Legacy handleSave - kept for backward compatibility
  const handleSave = async () => {
    if (!year || !make || !model) {
      Alert.alert("Missing Info", "Please enter at least Year, Make, and Model.");
      return;
    }

    try {
      setSaving(true);

      const carData = {
        nickname,
        year,
        make,
        model,
        trim,
        drivetrain,
        mileage,
        paintColor,
        imageUrl: localImageUri || localImages.front || localImages.side || localImages.rear,
        images: canUploadMultiplePhotos ? {
          front: localImages.front,
          side: localImages.side,
          rear: localImages.rear,
        } : null,
        dealerImageUrl: null,
        aiDetected: detectionConfidence ? true : false,
        aiConfidence: detectionConfidence,
      };

      // Check if in demo mode
      if (demoMode) {
        const newCar = addDemoCar(carData);
        setSavedCarId(newCar.id);
        setSaving(false);
        setStep(3);
        return;
      }

      // If not demo mode, try Firebase
      if (user) {
        let carId = await saveCarForUser({
          uid: user.uid,
          data: carData,
        });

        // Upload image if selected
        if (localImageUri) {
          try {
            const imageUrl = await uploadCarImage(user.uid, carId, localImageUri);
            await saveCarForUser({
              uid: user.uid,
              carId,
              data: { ...carData, imageUrl },
            });
          } catch (uploadError) {
            console.log("Image upload failed, using local URI:", uploadError);
          }
        }

        await setActiveCar(user.uid, carId);
        await refreshActiveCar();
        setSavedCarId(carId);
      } else {
        // Fallback to local
        const newCar = addDemoCar(carData);
        setSavedCarId(newCar.id);
      }

      setSaving(false);
      setStep(3);
    } catch (e) {
      console.error("Save error:", e);
      // Fallback to demo mode save
      const carData = {
        nickname, year, make, model, trim, drivetrain, mileage, paintColor,
        imageUrl: localImageUri,
      };
      const newCar = addDemoCar(carData);
      setSavedCarId(newCar.id);
      setSaving(false);
      setStep(3);
    }
  };

  // Photo upload handlers for multiple views
  const handleUploadPhoto = async (view, fromCamera = false) => {
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
          quality: 0.8,
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
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets?.[0]?.uri) {
        if (canUploadMultiplePhotos) {
          setLocalImages({ ...localImages, [view]: result.assets[0].uri });
          // Also set main image if it's the first one
          if (!localImageUri) {
            setLocalImageUri(result.assets[0].uri);
          }
        } else {
          setLocalImageUri(result.assets[0].uri);
        }
      }
    } catch (e) {
      Alert.alert("Error", "Could not select image.");
    }
  };

  // Step 1: Basic Info (Nickname, Model, Year) - NEW FLOW
  const renderStep1 = () => {
    return (
      <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepTitle}>Add Your Car</Text>
          <Text style={styles.stepSubtitle}>
            We'll save your car and create a 360° view for your builds.
          </Text>
        </View>

        {/* Browse Library Option */}
        <TouchableOpacity
          style={styles.browseButton}
          onPress={() => navigation.navigate('BrowseStandardCars')}
        >
          <Ionicons name="search" size={24} color="#fff" style={{ marginRight: 12 }} />
          <View>
            <Text style={styles.browseButtonText}>Browse Car Library</Text>
            <Text style={styles.browseButtonSubtext}>Find your car model (Porsche 911, M3, etc)</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR ADD MANUALLY</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Basic Info Form */}
        <View style={styles.formSection}>
          <Text style={styles.label}>Nickname *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Weekend GTI, My Daily"
            placeholderTextColor="#666"
            value={nickname}
            onChangeText={setNickname}
          />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Year *</Text>
              <TextInput
                style={styles.input}
                placeholder="2023"
                placeholderTextColor="#666"
                value={year}
                onChangeText={setYear}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Make *</Text>
              <TextInput
                style={styles.input}
                placeholder="BMW"
                placeholderTextColor="#666"
                value={make}
                onChangeText={setMake}
              />
            </View>
          </View>

          <Text style={styles.label}>Model *</Text>
          <TextInput
            style={styles.input}
            placeholder="M4"
            placeholderTextColor="#666"
            value={model}
            onChangeText={setModel}
          />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Trim</Text>
              <TextInput
                style={styles.input}
                placeholder="Competition"
                placeholderTextColor="#666"
                value={trim}
                onChangeText={setTrim}
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Drivetrain</Text>
              <TextInput
                style={styles.input}
                placeholder="RWD/AWD"
                placeholderTextColor="#666"
                value={drivetrain}
                onChangeText={setDrivetrain}
              />
            </View>
          </View>

          <Text style={styles.label}>Paint Color</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Nardo Grey"
            placeholderTextColor="#666"
            value={paintColor}
            onChangeText={setPaintColor}
          />
        </View>

        {/* Main Photo Upload Section */}
        <View style={styles.section}>
          <Text style={styles.label}>Main Photo *</Text>
          <Text style={styles.sectionSubtext}>
            This will be your car's hero image on the home screen.
          </Text>

          {localImageUri ? (
            <View style={styles.mainPhotoPreview}>
              <Image source={{ uri: localImageUri }} style={styles.mainPhotoImage} />
              <View style={styles.mainPhotoOverlay}>
                <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
                <Text style={styles.mainPhotoLabel}>Main Photo Set</Text>
              </View>
              <TouchableOpacity
                style={styles.changeMainPhotoButton}
                onPress={() => {
                  Alert.alert("Change Main Photo", "", [
                    { text: "Take Photo", onPress: handleTakePhoto },
                    { text: "Choose from Gallery", onPress: handleChoosePhoto },
                    { text: "Cancel", style: "cancel" },
                  ]);
                }}
              >
                <Ionicons name="camera-outline" size={18} color="#fff" />
                <Text style={styles.changeMainPhotoText}>Change Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.mainPhotoPlaceholder}>
              <Ionicons name="image-outline" size={48} color="#666" />
              <Text style={styles.mainPhotoPlaceholderTitle}>Add Your Car's Main Photo</Text>
              <Text style={styles.mainPhotoPlaceholderText}>
                This photo will appear on your home screen
              </Text>

              <View style={styles.mainPhotoButtons}>
                <TouchableOpacity style={styles.mainPhotoButton} onPress={handleTakePhoto}>
                  <Ionicons name="camera-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.mainPhotoButtonText}>Take Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.mainPhotoButton} onPress={handleChoosePhoto}>
                  <Ionicons name="images-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.mainPhotoButtonText}>From Gallery</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[styles.continueButton, (!nickname.trim() || !year || !make || !model) && styles.continueButtonDisabled]}
          onPress={handleContinueToPhotos}
          disabled={!nickname.trim() || !year || !make || !model || saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.continueButtonText}>Continue to Photo Capture</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };

  // Legacy Step 1: Photo Upload (kept for backward compatibility)
  const renderStep1Legacy = () => {
    const hasAnyPhoto = localImageUri || Object.values(localImages).some(img => img);

    return (
      <View style={styles.stepContainer}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepTitle}>Scan Your Car</Text>
          <Text style={styles.stepSubtitle}>
            {canUploadMultiplePhotos
              ? "Upload photos from different angles (Pro/Premium feature)"
              : "Take or upload a photo of your car"}
          </Text>
        </View>

        {/* Multi-Photo Upload (Pro/Premium) */}
        {canUploadMultiplePhotos ? (
          <View style={styles.multiPhotoSection}>
            {/* Front/3-4 View */}
            <View style={styles.photoSlot}>
              <Text style={styles.photoSlotLabel}>Front / 3/4 View</Text>
              {localImages.front ? (
                <View style={styles.photoSlotPreview}>
                  <Image source={{ uri: localImages.front }} style={styles.photoSlotImage} />
                  <TouchableOpacity
                    style={styles.photoSlotRemove}
                    onPress={() => setLocalImages({ ...localImages, front: null })}
                  >
                    <Ionicons name="close" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.photoSlotEmpty}
                  onPress={() => Alert.alert("Select Source", "", [
                    { text: "Camera", onPress: () => handleUploadPhoto("front", true) },
                    { text: "Gallery", onPress: () => handleUploadPhoto("front", false) },
                    { text: "Cancel", style: "cancel" },
                  ])}
                >
                  <Ionicons name="camera-outline" size={32} color="#666" />
                  <Text style={styles.photoSlotText}>Add Photo</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Side View */}
            <View style={styles.photoSlot}>
              <Text style={styles.photoSlotLabel}>Side View</Text>
              {localImages.side ? (
                <View style={styles.photoSlotPreview}>
                  <Image source={{ uri: localImages.side }} style={styles.photoSlotImage} />
                  <TouchableOpacity
                    style={styles.photoSlotRemove}
                    onPress={() => setLocalImages({ ...localImages, side: null })}
                  >
                    <Ionicons name="close" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.photoSlotEmpty}
                  onPress={() => Alert.alert("Select Source", "", [
                    { text: "Camera", onPress: () => handleUploadPhoto("side", true) },
                    { text: "Gallery", onPress: () => handleUploadPhoto("side", false) },
                    { text: "Cancel", style: "cancel" },
                  ])}
                >
                  <Ionicons name="camera-outline" size={32} color="#666" />
                  <Text style={styles.photoSlotText}>Add Photo</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Rear View */}
            <View style={styles.photoSlot}>
              <Text style={styles.photoSlotLabel}>Rear View</Text>
              {localImages.rear ? (
                <View style={styles.photoSlotPreview}>
                  <Image source={{ uri: localImages.rear }} style={styles.photoSlotImage} />
                  <TouchableOpacity
                    style={styles.photoSlotRemove}
                    onPress={() => setLocalImages({ ...localImages, rear: null })}
                  >
                    <Ionicons name="close" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.photoSlotEmpty}
                  onPress={() => Alert.alert("Select Source", "", [
                    { text: "Camera", onPress: () => handleUploadPhoto("rear", true) },
                    { text: "Gallery", onPress: () => handleUploadPhoto("rear", false) },
                    { text: "Cancel", style: "cancel" },
                  ])}
                >
                  <Ionicons name="camera-outline" size={32} color="#666" />
                  <Text style={styles.photoSlotText}>Add Photo</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.multiPhotoHint}>
              <Text style={styles.multiPhotoHintText}>
                Tip: Upload all 3 views for the best part visualization experience
              </Text>
            </View>
          </View>
        ) : (
          /* Single Photo Upload (Free) */
          <>
            {localImageUri ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: localImageUri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.changePhotoButton}
                  onPress={() => setLocalImageUri(null)}
                >
                  <Text style={styles.changePhotoText}>✕ Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.scanArea}>
                <View style={styles.scanFrame}>
                  <Ionicons name="car-outline" size={48} color="#666" />
                  <Text style={styles.scanText}>Position your car in frame</Text>
                </View>
              </View>
            )}

            <View style={styles.photoButtons}>
              <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
                <Ionicons name="camera-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.photoButtonText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoButton} onPress={handleChoosePhoto}>
                <Ionicons name="images-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.photoButtonText}>From Gallery</Text>
              </TouchableOpacity>
            </View>

            {/* Upgrade Prompt */}
            <TouchableOpacity
              style={styles.upgradePrompt}
              onPress={() => navigation.navigate("Upgrade")}
            >
              <Ionicons name="star-outline" size={24} color="#22c55e" />
              <View style={styles.upgradePromptText}>
                <Text style={styles.upgradePromptTitle}>Upgrade to Pro/Premium</Text>
                <Text style={styles.upgradePromptSubtitle}>Upload 3 views for better part visualization</Text>
              </View>
              <Text style={styles.upgradePromptArrow}>→</Text>
            </TouchableOpacity>
          </>
        )}

        {/* AI Detection Button */}
        {localImageUri && (
          <TouchableOpacity
            style={styles.aiButton}
            onPress={handleAIDetect}
            disabled={detecting}
          >
            {detecting ? (
              <View style={styles.aiButtonContent}>
                <ActivityIndicator color="#fff" style={{ marginRight: 10 }} />
                <Text style={styles.aiButtonText}>Analyzing Image...</Text>
              </View>
            ) : (
              <View style={styles.aiButtonContent}>
                <Ionicons name="sparkles-outline" size={24} color="#fff" style={{ marginRight: 8 }} />
                <View>
                  <Text style={styles.aiButtonText}>Auto-Detect Car</Text>
                  <Text style={styles.aiButtonSubtext}>Coming Soon • Demo Preview</Text>
                </View>
                <View style={styles.demoBadge}>
                  <Text style={styles.demoBadgeText}>DEMO</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Manual Entry Option */}
        {hasAnyPhoto && (
          <TouchableOpacity
            style={styles.manualButton}
            onPress={() => setStep(2)}
          >
            <Text style={styles.manualButtonText}>Enter Details Manually →</Text>
          </TouchableOpacity>
        )}

        {/* Skip Photo Option */}
        {!hasAnyPhoto && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => setStep(2)}
          >
            <Text style={styles.skipButtonText}>Skip photo for now →</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Step 2: Car Details
  const renderStep2 = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Car Details</Text>
        <Text style={styles.stepSubtitle}>
          {detectionConfidence
            ? `AI detected with ${detectionConfidence}% confidence - verify below`
            : "Enter your car's information"}
        </Text>
      </View>

      {/* Mini Image Preview */}
      {localImageUri && (
        <View style={styles.miniPreview}>
          <Image source={{ uri: localImageUri }} style={styles.miniPreviewImage} />
          {detectionConfidence && (
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>AI {detectionConfidence}%</Text>
            </View>
          )}
        </View>
      )}

      {/* Form Fields */}
      <View style={styles.formSection}>
        <Text style={styles.label}>Nickname (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. My Daily, Weekend Warrior"
          placeholderTextColor="#666"
          value={nickname}
          onChangeText={setNickname}
        />

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Year *</Text>
            <TextInput
              style={styles.input}
              placeholder="2023"
              placeholderTextColor="#666"
              value={year}
              onChangeText={setYear}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Make *</Text>
            <TextInput
              style={styles.input}
              placeholder="BMW"
              placeholderTextColor="#666"
              value={make}
              onChangeText={setMake}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Model *</Text>
            <TextInput
              style={styles.input}
              placeholder="M4"
              placeholderTextColor="#666"
              value={model}
              onChangeText={setModel}
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Trim</Text>
            <TextInput
              style={styles.input}
              placeholder="Competition"
              placeholderTextColor="#666"
              value={trim}
              onChangeText={setTrim}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Drivetrain</Text>
            <TextInput
              style={styles.input}
              placeholder="RWD/AWD"
              placeholderTextColor="#666"
              value={drivetrain}
              onChangeText={setDrivetrain}
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Mileage</Text>
            <TextInput
              style={styles.input}
              placeholder="15000"
              placeholderTextColor="#666"
              value={mileage}
              onChangeText={setMileage}
              keyboardType="numeric"
            />
          </View>
        </View>

        <Text style={styles.label}>Paint Color</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Nardo Grey"
          placeholderTextColor="#666"
          value={paintColor}
          onChangeText={setPaintColor}
        />
      </View>

      {/* Navigation Buttons */}
      <View style={styles.navButtons}>
        <TouchableOpacity
          style={styles.backStepButton}
          onPress={() => setStep(1)}
        >
          <Text style={styles.backStepButtonText}>← Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Car →</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  // Step 3: Success - Try Parts
  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.successContainer}>
        <Text style={styles.successIcon}>✅</Text>
        <Text style={styles.successTitle}>Car Added!</Text>
        <Text style={styles.successSubtitle}>
          {year} {make} {model} is now in your garage
        </Text>

        {localImageUri && (
          <Image source={{ uri: localImageUri }} style={styles.successImage} />
        )}

        {/* Action Buttons */}
        <View style={styles.successActions}>
          <TouchableOpacity
            style={styles.primaryAction}
            onPress={() => navigation.navigate("TryMods")}
          >
            <Text style={styles.primaryActionIcon}>🔮</Text>
            <View>
              <Text style={styles.primaryActionText}>Try Parts on Your Car</Text>
              <Text style={styles.primaryActionSubtext}>Visualize mods before buying</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() => navigation.navigate("AddPart")}
          >
            <Text style={styles.secondaryActionIcon}>📦</Text>
            <Text style={styles.secondaryActionText}>Add Parts to Inventory</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() => navigation.navigate("CarDetail", { car: { id: savedCarId, year, make, model, trim, drivetrain, paintColor, imageUrl: localImageUri } })}
          >
            <Text style={styles.secondaryActionIcon}>📋</Text>
            <Text style={styles.secondaryActionText}>View Car Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackButton}>
          <Text style={styles.headerBackText}>← Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {step === 1 ? "Add Your Car" : step === 2 ? "Car Details" : "Success!"}
        </Text>
        <View style={{ width: 70 }} />
      </View>

      {/* Progress Indicator - Only show 2 steps for photo/details */}
      {step <= 2 && (
        <View style={styles.progressBar}>
          <View style={[styles.progressStep, step >= 1 && styles.progressStepActive]} />
          <View style={[styles.progressStep, step >= 2 && styles.progressStepActive]} />
        </View>
      )}

      {/* Step Content */}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
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
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  headerBackButton: {
    width: 70,
  },
  headerBackText: {
    color: "#4a9eff",
    fontSize: 16,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  progressBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  progressStep: {
    flex: 1,
    height: 3,
    backgroundColor: "#1a1a1a",
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: "#4a9eff",
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  stepHeader: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  stepTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
  },
  stepSubtitle: {
    color: "#888",
    fontSize: 15,
  },
  scanArea: {
    height: 280,
    backgroundColor: "#0a0a0a",
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#1a1a1a",
    overflow: "hidden",
  },
  scanFrame: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scanIcon: {
    fontSize: 64,
    marginBottom: 12,
  },
  scanText: {
    color: "#a0a0a0",
    fontSize: 14,
    marginTop: 12,
  },
  imagePreviewContainer: {
    position: "relative",
    marginBottom: 20,
  },
  imagePreview: {
    width: "100%",
    height: 220,
    borderRadius: 20,
  },
  changePhotoButton: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  changePhotoText: {
    color: "#fff",
    fontSize: 13,
  },
  photoButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  photoButton: {
    flex: 1,
    backgroundColor: "#4a9eff",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  photoButtonIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  photoButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  aiButton: {
    backgroundColor: "#7c3aed",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  aiButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  aiButtonIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  aiButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  aiButtonSubtext: {
    color: "#c4b5fd",
    fontSize: 13,
    marginTop: 2,
  },
  demoBadge: {
    backgroundColor: "#f59e0b",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: "auto",
  },
  demoBadgeText: {
    color: "#000",
    fontSize: 10,
    fontWeight: "800",
  },
  manualButton: {
    paddingVertical: 16,
    alignItems: "center",
  },
  manualButtonText: {
    color: "#4a9eff",
    fontSize: 15,
    fontWeight: "500",
  },
  skipButton: {
    paddingVertical: 20,
    alignItems: "center",
  },
  skipButtonText: {
    color: "#666",
    fontSize: 14,
  },
  miniPreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  miniPreviewImage: {
    width: 80,
    height: 50,
    borderRadius: 8,
  },
  aiBadge: {
    backgroundColor: "#7c3aed",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  aiBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  formSection: {
    marginBottom: 20,
  },
  label: {
    color: "#888",
    fontSize: 13,
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    backgroundColor: "#111",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#fff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#222",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  navButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  backStepButton: {
    backgroundColor: "#222",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  backStepButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#22c55e",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  continueButton: {
    backgroundColor: "#22c55e",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 24,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    marginBottom: 20,
  },
  sectionSubtext: {
    color: "#a0a0a0",
    fontSize: 13,
    marginBottom: 12,
    marginTop: 4,
  },
  mainPhotoPreview: {
    backgroundColor: "#0a0a0a",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  mainPhotoImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  changePhotoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingVertical: 12,
    gap: 8,
  },
  changePhotoButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  mainPhotoPlaceholder: {
    backgroundColor: "#0a0a0a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1a1a1a",
    borderStyle: "dashed",
    minHeight: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  addPhotoButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  addPhotoButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },
  addPhotoButtonHint: {
    color: "#666",
    fontSize: 13,
    marginTop: 4,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 20,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  successTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
  },
  successSubtitle: {
    color: "#888",
    fontSize: 16,
    marginBottom: 24,
  },
  successImage: {
    width: "100%",
    height: 160,
    borderRadius: 16,
    marginBottom: 32,
  },
  successActions: {
    width: "100%",
  },
  primaryAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4a9eff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
  },
  primaryActionIcon: {
    fontSize: 32,
    marginRight: 14,
  },
  primaryActionText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  primaryActionSubtext: {
    color: "#93c5fd",
    fontSize: 13,
    marginTop: 2,
  },
  secondaryAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#222",
  },
  secondaryActionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  secondaryActionText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
  },
  doneButton: {
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  doneButtonText: {
    color: "#666",
    fontSize: 15,
  },
  // Multi-photo styles
  multiPhotoSection: {
    marginBottom: 20,
  },
  photoSlot: {
    marginBottom: 16,
  },
  photoSlotLabel: {
    color: "#888",
    fontSize: 13,
    marginBottom: 8,
  },
  photoSlotEmpty: {
    height: 120,
    backgroundColor: "#111",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#222",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  photoSlotIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  photoSlotText: {
    color: "#666",
    fontSize: 14,
  },
  photoSlotPreview: {
    position: "relative",
    height: 120,
    borderRadius: 12,
    overflow: "hidden",
  },
  photoSlotImage: {
    width: "100%",
    height: "100%",
  },
  photoSlotRemove: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.7)",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  photoSlotRemoveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  multiPhotoHint: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  multiPhotoHintText: {
    color: "#888",
    fontSize: 12,
    textAlign: "center",
  },
  upgradePrompt: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0a0a0a",
    borderRadius: 8,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  upgradePromptIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  upgradePromptText: {
    flex: 1,
  },
  upgradePromptTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  upgradePromptSubtitle: {
    color: "#666",
    fontSize: 12,
    marginTop: 2,
  },
  upgradePromptArrow: {
    color: "#4a9eff",
    fontSize: 18,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  browseButtonSubtext: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
    marginHorizontal: 16,
  },
});
