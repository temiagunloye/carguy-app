// src/screens/EditProfileScreen.js

// Firebase imports removed - will be loaded dynamically when needed
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
  View,
} from "react-native";
import { useCarContext } from "../services/carContext";
// Firebase imports removed - will be loaded dynamically when needed

export default function EditProfileScreen({ navigation }) {
  const { user, refreshActiveCar } = useCarContext();
  
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [photoUri, setPhotoUri] = useState(user?.photoURL || null);
  const [saving, setSaving] = useState(false);

  const handlePickPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Photo library access is required.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) return;

      const asset = result.assets && result.assets[0];
      if (asset && asset.uri) {
        setPhotoUri(asset.uri);
      }
    } catch (e) {
      console.error("Photo picker error:", e);
      Alert.alert("Error", "Failed to select photo.");
    }
  };

  const uploadProfilePhoto = async (uri) => {
    if (!uri || uri.startsWith("http")) return uri; // Already uploaded

    try {
      const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
      const { storage } = await import("../services/firebaseConfig");
      if (!storage) return uri;
      
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(storage, `users/${user.uid}/profile/${Date.now()}.jpg`);
      await uploadBytes(storageRef, blob);
      return await getDownloadURL(storageRef);
    } catch (e) {
      console.error("Upload error:", e);
      return null;
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);

      // Upload photo if changed
      let photoURL = user.photoURL;
      if (photoUri && photoUri !== user.photoURL) {
        const uploadedUrl = await uploadProfilePhoto(photoUri);
        if (uploadedUrl) {
          photoURL = uploadedUrl;
        }
      }

      // Update Firebase Auth profile
      const { updateProfile } = await import("firebase/auth");
      const { auth } = await import("../services/firebaseConfig");
      if (auth?.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: displayName || "Car Enthusiast",
          photoURL: photoURL,
        });
      }

      // Update Firestore user document
      const { doc, updateDoc, serverTimestamp } = await import("firebase/firestore");
      const { db } = await import("../services/firebaseConfig");
      if (db) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          displayName: displayName || "Car Enthusiast",
          photoURL: photoURL,
          updatedAt: serverTimestamp(),
        });
      }

      // Refresh context
      await refreshActiveCar();

      setSaving(false);
      Alert.alert("Success", "Profile updated!", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      console.error("Save error:", e);
      setSaving(false);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveButton}>
          {saving ? (
            <ActivityIndicator size="small" color="#4a9eff" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Profile Photo */}
        <View style={styles.photoSection}>
          <TouchableOpacity onPress={handlePickPhoto} style={styles.photoContainer}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderText}>
                  {displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"}
                </Text>
              </View>
            )}
            <View style={styles.photoEditBadge}>
              <Text style={styles.photoEditBadgeText}>📷</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.photoHint}>Tap to change photo</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            placeholderTextColor="#666"
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Email</Text>
          <View style={styles.disabledInput}>
            <Text style={styles.disabledInputText}>{user?.email || "Not set"}</Text>
            <Text style={styles.disabledHint}>Email cannot be changed</Text>
          </View>

          <Text style={styles.label}>Account Created</Text>
          <View style={styles.disabledInput}>
            <Text style={styles.disabledInputText}>
              {user?.metadata?.creationTime 
                ? new Date(user.metadata.creationTime).toLocaleDateString()
                : "Unknown"}
            </Text>
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Account Actions</Text>
          
          <TouchableOpacity 
            style={styles.actionRow}
            onPress={() => Alert.alert("Coming Soon", "Password reset will be available soon.")}
          >
            <Text style={styles.actionIcon}>🔑</Text>
            <Text style={styles.actionText}>Change Password</Text>
            <Text style={styles.actionChevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionRow, styles.dangerRow]}
            onPress={() => {
              Alert.alert(
                "Delete Account",
                "Are you sure? This action cannot be undone.",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Delete", style: "destructive", onPress: () => {
                    Alert.alert("Coming Soon", "Account deletion will be available soon.");
                  }}
                ]
              );
            }}
          >
            <Text style={styles.actionIcon}>🗑️</Text>
            <Text style={styles.dangerText}>Delete Account</Text>
            <Text style={styles.actionChevron}>›</Text>
          </TouchableOpacity>
        </View>
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
    width: 80,
  },
  backButtonText: {
    color: "#4a9eff",
    fontSize: 16,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  saveButton: {
    width: 80,
    alignItems: "flex-end",
  },
  saveButtonText: {
    color: "#4a9eff",
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  photoSection: {
    alignItems: "center",
    marginVertical: 24,
  },
  photoContainer: {
    position: "relative",
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  photoPlaceholderText: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "700",
  },
  photoEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#4a9eff",
    justifyContent: "center",
    alignItems: "center",
  },
  photoEditBadgeText: {
    fontSize: 16,
  },
  photoHint: {
    color: "#888",
    fontSize: 14,
    marginTop: 8,
  },
  formSection: {
    marginBottom: 24,
  },
  label: {
    color: "#888",
    fontSize: 12,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: "#181818",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#fff",
    fontSize: 16,
  },
  disabledInput: {
    backgroundColor: "#0a0a0a",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  disabledInputText: {
    color: "#666",
    fontSize: 16,
  },
  disabledHint: {
    color: "#444",
    fontSize: 12,
    marginTop: 4,
  },
  actionsSection: {
    backgroundColor: "#181818",
    borderRadius: 16,
    overflow: "hidden",
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    padding: 16,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#252525",
  },
  dangerRow: {},
  actionIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  actionText: {
    color: "#fff",
    fontSize: 16,
    flex: 1,
  },
  dangerText: {
    color: "#ff4444",
    fontSize: 16,
    flex: 1,
  },
  actionChevron: {
    color: "#666",
    fontSize: 20,
  },
});

