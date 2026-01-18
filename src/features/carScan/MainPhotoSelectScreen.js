// src/features/carScan/MainPhotoSelectScreen.js
// Screen to select the main photo from captured photos

import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
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
import { uploadCarImage } from "../../services/carService";
import { areAllAnglesCaptured, requestCarRendering } from "../../services/rendering";
import { mapShotToAnglePhotos } from "./angleMapping";

export default function MainPhotoSelectScreen({ navigation, route }) {
  const { carId, buildId, isOnboarding, shots } = route.params || {};
  const { activeCar, demoMode, setActiveCarState, user } = useCarContext();
  const [selectedPhotoId, setSelectedPhotoId] = useState(null);
  const [saving, setSaving] = useState(false);

  const shotArray = shots ? Object.values(shots) : [];

  // Default to front_center if available
  React.useEffect(() => {
    const frontCenter = shotArray.find(s => s.id === 'front_center');
    if (frontCenter) {
      setSelectedPhotoId(frontCenter.id);
    } else if (shotArray.length > 0) {
      setSelectedPhotoId(shotArray[0].id);
    }
  }, []);

  const handleSave = async () => {
    if (!selectedPhotoId || shotArray.length === 0) {
      Alert.alert("Error", "Please select a main photo.");
      return;
    }

    const selectedPhoto = shotArray.find(s => s.id === selectedPhotoId);
    if (!selectedPhoto) return;

    setSaving(true);
    try {
      // Map shots to anglePhotos structure
      const anglePhotos = mapShotToAnglePhotos(shotArray);
      const allAnglesCaptured = areAllAnglesCaptured(anglePhotos);

      // Save main photo to car
      if (demoMode && activeCar && carId === activeCar.id) {
        const updatedCar = {
          ...activeCar,
          imageUrl: selectedPhoto.imageUri, // Set selected main photo
          anglePhotos, // Store in new structure
          photoSet: {
            buildId,
            shots: shotArray,
            mainPhotoId: selectedPhotoId,
            createdAt: new Date().toISOString(),
          },
          builds: activeCar.builds?.map(b =>
            b.id === buildId
              ? { ...b, photoSet: { shots: shotArray, mainPhotoId: selectedPhotoId } }
              : b
          ) || [],
          renderJobStatus: allAnglesCaptured ? 'queued' : 'idle',
          renderingPreviewUrl: null,
        };
        setActiveCarState(updatedCar);

        // Trigger rendering if all angles captured
        if (allAnglesCaptured) {
          requestCarRendering('demo', carId, updatedCar);
        }
      } else if (user && carId) {
        // Upload main photo to Firebase Storage
        const mainPhotoUrl = await uploadCarImage(user.uid, carId, selectedPhoto.imageUri);

        // Upload all angle photos and get URLs
        const uploadedAnglePhotos = {};
        for (const [key, uri] of Object.entries(anglePhotos)) {
          if (uri) {
            uploadedAnglePhotos[key] = await uploadCarImage(user.uid, carId, uri);
          } else {
            uploadedAnglePhotos[key] = null;
          }
        }

        // Update car's main image and anglePhotos
        const { saveCarForUser } = await import("../../services/carService");
        await saveCarForUser({
          uid: user.uid,
          carId,
          data: {
            imageUrl: mainPhotoUrl,
            anglePhotos: uploadedAnglePhotos,
          }
        });

        // Trigger rendering if all angles captured
        if (areAllAnglesCaptured(uploadedAnglePhotos)) {
          const { getActiveCar } = await import("../../services/carService");
          const carData = await getActiveCar(user.uid);
          await requestCarRendering(user.uid, carId, { ...carData, anglePhotos: uploadedAnglePhotos });
        }
      }

      setSaving(false);

      // Navigate to base model picker for user to select closest match
      console.log('[MainPhotoSelect] Navigating to BaseModelPicker with', shotArray.length, 'photos');
      navigation.navigate("BaseModelPicker", {
        carId,
        photos: shotArray.map(shot => shot.imageUri),
      });
    } catch (error) {
      console.error("Error saving main photo:", error);
      Alert.alert("Error", "Failed to save main photo. Please try again.");
      setSaving(false);
    }
  };

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
    return simpleTitles[shot.id] || shot.label || 'Photo';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Main Photo</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Choose Your Main Photo</Text>
        <Text style={styles.subtitle}>
          This photo will be displayed on your home screen, inventory, and shop. Select the best angle of your car.
        </Text>

        {/* Photo Grid */}
        <View style={styles.photoGrid}>
          {shotArray.map((shot) => (
            <TouchableOpacity
              key={shot.id}
              style={[
                styles.photoCard,
                selectedPhotoId === shot.id && styles.photoCardSelected,
              ]}
              onPress={() => setSelectedPhotoId(shot.id)}
            >
              <Image
                source={{ uri: shot.imageUri }}
                style={styles.photoThumbnail}
                resizeMode="cover"
              />
              {selectedPhotoId === shot.id && (
                <View style={styles.selectedOverlay}>
                  <Ionicons name="checkmark-circle" size={32} color="#22c55e" />
                </View>
              )}
              <Text style={styles.photoLabel}>{getShotDisplayTitle(shot)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.saveButtonText}>Save Main Photo</Text>
              <Ionicons name="checkmark" size={20} color="#fff" style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>

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
    paddingTop: 24,
    paddingBottom: 40,
  },
  title: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: "#a0a0a0",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  photoCard: {
    width: "47%",
    backgroundColor: "#0a0a0a",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#1a1a1a",
  },
  photoCardSelected: {
    borderColor: "#22c55e",
  },
  photoThumbnail: {
    width: "100%",
    height: 150,
  },
  selectedOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
  },
  photoLabel: {
    color: "#ffffff",
    fontSize: 13,
    padding: 8,
    textAlign: "center",
  },
  saveButton: {
    backgroundColor: "#22c55e",
    paddingVertical: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
});

