// src/components/AddCarModal.js

import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useCarContext } from "../services/carContext";
import {
    canUserHaveMultipleCars,
    canUserUseCustomImage,
    getCarCount,
    saveCarForUser,
    setActiveCar,
    uploadCarImage,
} from "../services/carService";

export default function AddCarModal({ visible, onClose }) {
  const { user, plan, refreshActiveCar } = useCarContext();

  const [nickname, setNickname] = useState("");
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [trim, setTrim] = useState("");
  const [drivetrain, setDrivetrain] = useState("");
  const [mileage, setMileage] = useState("");
  const [paintColor, setPaintColor] = useState("");
  const [localImageUri, setLocalImageUri] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!user) return null;

  const handlePickImage = async (fromCamera) => {
    // Immediate feedback to confirm button works
    Alert.alert(
      fromCamera ? "Opening Camera" : "Opening Photo Library",
      "Please wait...",
      [{ text: "OK" }]
    );

    try {
      // Request permissions first
      let permissionResult;
      if (fromCamera) {
        permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      } else {
        permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      }

      if (permissionResult.status !== "granted") {
        Alert.alert(
          "Permission Required",
          fromCamera 
            ? "Please allow camera access in your device settings to scan your car."
            : "Please allow photo library access in your device settings to upload photos."
        );
        return;
      }

      // Launch the picker
      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
          });

      if (result.canceled) {
        return;
      }
      
      const asset = result.assets && result.assets[0];
      if (asset && asset.uri) {
        setLocalImageUri(asset.uri);
        setError("");
        Alert.alert("Success", "Image selected!");
      }
    } catch (e) {
      console.error("Image picker error:", e);
      Alert.alert("Error", `Failed to open image picker: ${e.message}`);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");

      const count = await getCarCount(user.uid);
      if (!canUserHaveMultipleCars(plan) && count >= 1) {
        setError("Your plan allows only one vehicle.");
        setSaving(false);
        return;
      }

      const baseData = {
        nickname,
        year,
        make,
        model,
        trim,
        drivetrain,
        mileage,
        paintColor,
        dealerImageUrl: null,
        imageUrl: null,
      };

      let carId = await saveCarForUser({
        uid: user.uid,
        data: baseData,
      });

      if (localImageUri && canUserUseCustomImage(plan)) {
        const imageUrl = await uploadCarImage(user.uid, carId, localImageUri);
        await saveCarForUser({
          uid: user.uid,
          carId,
          data: { ...baseData, imageUrl },
        });
      }

      await setActiveCar(user.uid, carId);
      await refreshActiveCar();

      setSaving(false);
      onClose();
    } catch (e) {
      console.error(e);
      setError("Something went wrong while saving your car.");
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Add Your Car</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeX}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            {/* Image / scan section */}
            <View style={styles.imageSection}>
              <Text style={styles.imageTitle}>Car Image / Scan</Text>
              <Text style={styles.imageSubtitle}>
                Tap a button below to add your car photo
              </Text>

              {localImageUri ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: localImageUri }} style={styles.imagePreview} />
                  <Text style={styles.imagePreviewText}>Image selected ✔</Text>
                </View>
              ) : null}

              {/* Camera Button */}
              <TouchableOpacity
                style={styles.imageButton}
                onPress={() => handlePickImage(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.imageButtonIcon}>📷</Text>
                <Text style={styles.imageButtonText}>Take Photo with Camera</Text>
              </TouchableOpacity>

              {/* Gallery Button */}
              <TouchableOpacity
                style={styles.imageButton}
                onPress={() => handlePickImage(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.imageButtonIcon}>🖼️</Text>
                <Text style={styles.imageButtonText}>Choose from Photo Library</Text>
              </TouchableOpacity>
            </View>

            {/* Car details */}
            <Text style={styles.sectionLabel}>CAR DETAILS</Text>

            <TextInput
              style={styles.input}
              placeholder="Car Nickname"
              placeholderTextColor="#777"
              value={nickname}
              onChangeText={setNickname}
            />

            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.rowInput]}
                placeholder="Year"
                placeholderTextColor="#777"
                value={year}
                onChangeText={setYear}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, styles.rowInput]}
                placeholder="Make"
                placeholderTextColor="#777"
                value={make}
                onChangeText={setMake}
              />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Model"
              placeholderTextColor="#777"
              value={model}
              onChangeText={setModel}
            />

            <TextInput
              style={styles.input}
              placeholder="Trim / Package"
              placeholderTextColor="#777"
              value={trim}
              onChangeText={setTrim}
            />

            {/* Specs */}
            <Text style={styles.sectionLabel}>SPECS</Text>

            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.rowInput]}
                placeholder="Drivetrain (e.g. AWD)"
                placeholderTextColor="#777"
                value={drivetrain}
                onChangeText={setDrivetrain}
              />
              <TextInput
                style={[styles.input, styles.rowInput]}
                placeholder="Mileage"
                placeholderTextColor="#777"
                value={mileage}
                onChangeText={setMileage}
                keyboardType="numeric"
              />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Paint Color (e.g. Brooklyn Grey)"
              placeholderTextColor="#777"
              value={paintColor}
              onChangeText={setPaintColor}
            />

            {/* Preview */}
            <View style={styles.previewStrip}>
              <Text style={styles.previewLabel}>Preview</Text>
              <Text style={styles.previewText}>
                {year || "Year"} {make || "Make"} {model || "Model"} •{" "}
                {paintColor || "Color"} • {drivetrain || "Drivetrain"}
              </Text>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Save & Set as My Car</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: "#101010",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    maxHeight: "90%",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  closeX: {
    color: "#fff",
    fontSize: 22,
  },
  imageSection: {
    backgroundColor: "#181818",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  imageTitle: {
    color: "#fff",
    fontWeight: "500",
    marginBottom: 4,
  },
  imageSubtitle: {
    color: "#888",
    fontSize: 12,
    marginBottom: 8,
  },
  imagePreviewContainer: {
    marginBottom: 12,
    alignItems: "center",
  },
  imagePreview: {
    width: "100%",
    height: 120,
    borderRadius: 12,
    marginBottom: 8,
  },
  imagePreviewText: {
    color: "#4caf50",
    fontSize: 12,
  },
  imageButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#202020",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 10,
  },
  imageButtonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  imageButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  buttonRow: {
    flexDirection: "row",
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#202020",
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  sectionLabel: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#181818",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#fff",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rowInput: {
    flex: 1,
  },
  previewStrip: {
    backgroundColor: "#181818",
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    marginBottom: 12,
  },
  previewLabel: {
    color: "#aaa",
    fontSize: 11,
    marginBottom: 2,
  },
  previewText: {
    color: "#fff",
    fontSize: 12,
  },
  primaryButton: {
    backgroundColor: "#1F1F1F",
    borderRadius: 999,
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 4,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  cancelText: {
    color: "#888",
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 12,
    marginBottom: 6,
    textAlign: "center",
  },
});
