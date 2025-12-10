// src/screens/AddPartScreen.js

import * as ImagePicker from "expo-image-picker";
import React, { useState, useEffect } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { useCarContext } from "../services/carContext";
import { importPartFromURL, isSupportedProductURL } from "../shop/partImportUtils";
import { categoryToFolderName, getOrCreateFolder, getFoldersForBuild } from "../services/buildService";

const CATEGORIES = [
  { id: "wheels", name: "Wheels & Tires", icon: "disc-outline" },
  { id: "suspension", name: "Suspension", icon: "resize-outline" },
  { id: "exhaust", name: "Exhaust", icon: "flash-outline" },
  { id: "exterior", name: "Exterior", icon: "car-outline" },
  { id: "interior", name: "Interior", icon: "car-sport-outline" },
  { id: "engine", name: "Engine", icon: "settings-outline" },
  { id: "performance", name: "Performance", icon: "speedometer-outline" },
  { id: "electronics", name: "Electronics", icon: "hardware-chip-outline" },
  { id: "maintenance", name: "Maintenance", icon: "construct-outline" },
  { id: "other", name: "Other", icon: "cube-outline" },
];

const INSTALL_STATUS = [
  { id: "installed", name: "Installed", color: "#22c55e" },
  { id: "pending", name: "Pending Install", color: "#f59e0b" },
  { id: "in_storage", name: "In Storage", color: "#6b7280" },
  { id: "sold", name: "Sold/Removed", color: "#ef4444" },
];

export default function AddPartScreen({ navigation, route }) {
  const { user, activeCar, demoMode, setActiveCarState } = useCarContext();
  const partToEdit = route?.params?.partToEdit;
  const prefillData = route?.params?.prefillData;
  const isEditing = !!partToEdit;
  const fromShop = route?.params?.fromShop;
  const autoSave = route?.params?.autoSave; // Auto-save without showing screen
  const buildId = route?.params?.buildId;
  
  // Basic Info
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [partNumber, setPartNumber] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("installed");
  const [selectedFolder, setSelectedFolder] = useState("");
  const [folders, setFolders] = useState([]);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  
  // Purchase Info
  const [price, setPrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [purchasedFrom, setPurchasedFrom] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  
  // Installation Info
  const [installDate, setInstallDate] = useState("");
  const [installer, setInstaller] = useState("");
  const [installCost, setInstallCost] = useState("");
  const [mileageAtInstall, setMileageAtInstall] = useState("");
  
  // Warranty Info
  const [hasWarranty, setHasWarranty] = useState(false);
  const [warrantyExpires, setWarrantyExpires] = useState("");
  const [warrantyNotes, setWarrantyNotes] = useState("");
  
  // Other
  const [notes, setNotes] = useState("");
  const [productLink, setProductLink] = useState("");
  const [imageUri, setImageUri] = useState(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  // Load folders for current build
  useEffect(() => {
    loadFolders();
  }, [activeCar, demoMode]);

  const loadFolders = async () => {
    if (!activeCar) return;

    try {
      if (demoMode) {
        // In demo mode, get folders from activeCar.builds[activeBuildId].folders
        const activeBuild = activeCar.builds?.find(b => b.isActive) || activeCar.builds?.[0];
        const buildFolders = activeBuild?.folders || [];
        setFolders(buildFolders);
        
        // Auto-select folder based on category if editing
        if (partToEdit?.folderId) {
          setSelectedFolder(partToEdit.folderId);
        }
      } else if (user && activeCar.activeBuildId) {
        const buildFolders = await getFoldersForBuild(user.uid, activeCar.activeBuildId);
        setFolders(buildFolders);
        
        if (partToEdit?.folderId) {
          setSelectedFolder(partToEdit.folderId);
        }
      }
    } catch (error) {
      console.error("Error loading folders:", error);
    }
  };

  // Auto-select folder when category changes
  useEffect(() => {
    if (category && folders.length > 0 && !selectedFolder) {
      const defaultFolderName = categoryToFolderName(category);
      const matchingFolder = folders.find(f => 
        f.name.toLowerCase() === defaultFolderName.toLowerCase()
      );
      if (matchingFolder) {
        setSelectedFolder(matchingFolder.id);
      }
    }
  }, [category, folders]);

  // Populate fields when editing or prefilling
  useEffect(() => {
    if (prefillData) {
      setName(prefillData.name || "");
      setBrand(prefillData.brand || "");
      setCategory(prefillData.category || "");
      setProductLink(prefillData.productLink || "");
      setPrice(prefillData.price || "");
    } else if (partToEdit) {
      setName(partToEdit.name || "");
      setBrand(partToEdit.brand || "");
      setPartNumber(partToEdit.partNumber || "");
      setCategory(partToEdit.category || "");
      setStatus(partToEdit.status || "installed");
      setPrice(partToEdit.price?.toString() || "");
      setPurchaseDate(partToEdit.purchaseDate || "");
      setPurchasedFrom(partToEdit.purchasedFrom || "");
      setOrderNumber(partToEdit.orderNumber || "");
      setInstallDate(partToEdit.installDate || "");
      setInstaller(partToEdit.installer || "");
      setInstallCost(partToEdit.installCost?.toString() || "");
      setMileageAtInstall(partToEdit.mileageAtInstall?.toString() || "");
      setHasWarranty(partToEdit.hasWarranty || false);
      setWarrantyExpires(partToEdit.warrantyExpires || "");
      setWarrantyNotes(partToEdit.warrantyNotes || "");
      setNotes(partToEdit.notes || "");
      setProductLink(partToEdit.productLink || "");
      setImageUri(partToEdit.imageUrl || null);
      setSelectedFolder(partToEdit.folderId || "");
    }
  }, [partToEdit]);

  // Auto-save if autoSave flag is set and all required fields are filled
  useEffect(() => {
    if (autoSave && name && category && !saving && folders.length > 0) {
      // Wait for folder to be set, then auto-save
      const timer = setTimeout(() => {
        if (name && category && !saving) {
          handleSave();
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [autoSave, name, category, selectedFolder, folders.length, saving]);

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Photo library access is required.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) return;

      const asset = result.assets && result.assets[0];
      if (asset && asset.uri) {
        setImageUri(asset.uri);
      }
    } catch (e) {
      console.error("Image picker error:", e);
      Alert.alert("Error", "Failed to select image.");
    }
  };

  const uploadPartImage = async (uri) => {
    if (!uri) return null;

    // In demo mode, return the local URI directly (no Firebase upload)
    if (demoMode) {
      return uri;
    }

    // Check if user is available for Firebase upload
    if (!user || !user.uid) {
      console.warn("No user available for upload, using local URI");
      return uri;
    }

    try {
      const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
      const { storage } = await import("../services/firebaseConfig");
      if (!storage) return uri;
      
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(
        storage,
        `users/${user.uid}/parts/${Date.now()}.jpg`
      );
      await uploadBytes(storageRef, blob);
      return await getDownloadURL(storageRef);
    } catch (e) {
      console.error("Upload error:", e);
      // Fallback to local URI if Firebase upload fails
      console.warn("Firebase upload failed, using local URI as fallback");
      return uri;
    }
  };

  const handleImportFromURL = async () => {
    if (!productLink || !productLink.trim()) {
      Alert.alert("Error", "Please enter a product URL");
      return;
    }

    setImporting(true);
    try {
      const importedData = await importPartFromURL(productLink.trim());
      
      // Populate form fields with imported data
      if (importedData.name) setName(importedData.name);
      if (importedData.brand) setBrand(importedData.brand);
      if (importedData.partNumber) setPartNumber(importedData.partNumber);
      if (importedData.category) setCategory(importedData.category);
      if (importedData.price) setPrice(importedData.price.toString());
      if (importedData.description) setNotes(importedData.description);
      
      // Set image if available
      if (importedData.imageUrl) {
        setImageUri(importedData.imageUrl);
      }
      
      Alert.alert("Import Complete", "Part information imported. Please review and complete any missing fields.");
    } catch (error) {
      console.error("Import error:", error);
      Alert.alert(
        "Import Failed",
        "Could not import part from URL. This feature requires a backend service. Please enter part details manually."
      );
    } finally {
      setImporting(false);
    }
  };

  const handleSave = async () => {
    if (!activeCar) {
      Alert.alert("Error", "Please select a car first.");
      return;
    }

    if (!name.trim()) {
      Alert.alert("Error", "Please enter a part name.");
      return;
    }

    if (!category) {
      Alert.alert("Error", "Please select a category.");
      return;
    }

    try {
      setSaving(true);

      // Upload image if selected (handles demo mode)
      let imageUrl = null;
      if (imageUri) {
        imageUrl = await uploadPartImage(imageUri);
      }

      // Calculate total cost
      const partPrice = parseFloat(price) || 0;
      const laborCost = parseFloat(installCost) || 0;
      const totalCost = partPrice + laborCost;

      const partData = {
        // Basic Info
        name: name.trim(),
        brand: brand.trim(),
        partNumber: partNumber.trim(),
        category,
        status,
        
        // Purchase Info
        price: partPrice,
        purchaseDate: purchaseDate || null,
        purchasedFrom: purchasedFrom.trim(),
        orderNumber: orderNumber.trim(),
        
        // Installation Info
        installDate: installDate || null,
        installer: installer.trim(),
        installCost: laborCost,
        mileageAtInstall: mileageAtInstall ? parseInt(mileageAtInstall) : null,
        
        // Warranty Info
        hasWarranty,
        warrantyExpires: hasWarranty ? warrantyExpires : null,
        warrantyNotes: warrantyNotes.trim(),
        
        // Calculated
        totalCost,
        
        // Other
        notes: notes.trim(),
        productLink: productLink.trim(),
        imageUrl,
        
        // Build & Folder association
        buildId: activeCar.activeBuildId || activeCar.builds?.find(b => b.isActive)?.id || null,
        folderId: selectedFolder || null,
        createdFromSimulation: fromShop || false,
      };

      // Handle demo mode - save to activeCar.parts array
      if (demoMode) {
        // Get or create folder if needed
        let folderId = selectedFolder;
        if (!folderId && category) {
          const activeBuild = activeCar.builds?.find(b => b.isActive) || activeCar.builds?.[0];
          if (activeBuild) {
            const defaultFolderName = categoryToFolderName(category);
            let existingFolder = activeBuild.folders?.find(f => 
              f.name.toLowerCase() === defaultFolderName.toLowerCase()
            );
            
            if (!existingFolder) {
              // Create new folder
              const newFolder = {
                id: `folder_${Date.now()}`,
                name: defaultFolderName,
                sortOrder: 0,
              };
              const updatedFolders = [...(activeBuild.folders || []), newFolder];
              const updatedBuilds = activeCar.builds.map(b =>
                b.id === activeBuild.id ? { ...b, folders: updatedFolders } : b
              );
              const updatedCar = { ...activeCar, builds: updatedBuilds };
              setActiveCarState(updatedCar);
              folderId = newFolder.id;
            } else {
              folderId = existingFolder.id;
            }
          }
        }
        
        // Update partData with folderId and buildId
        partData.folderId = folderId;
        partData.buildId = buildId || activeCar.activeBuildId || activeCar.builds?.find(b => b.isActive)?.id;
        let updatedParts;
        
        if (isEditing && partToEdit?.id) {
          // Update existing part
          updatedParts = (activeCar.parts || []).map(p => 
            p.id === partToEdit.id 
              ? {
                  ...p,
                  ...partData,
                  id: partToEdit.id, // Keep original ID
                  createdAt: p.createdAt || new Date().toISOString(), // Keep original createdAt
                  updatedAt: new Date().toISOString(),
                }
              : p
          );
        } else {
          // Create new part
          const newPart = {
            id: `part_${Date.now()}`,
            ...partData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          updatedParts = [...(activeCar.parts || []), newPart];
        }

        // Update active car with updated parts
        const updatedCar = {
          ...activeCar,
          parts: updatedParts,
        };
        setActiveCarState(updatedCar);
        
        // Also update the car in demoCars array (for InventoryScreen)
        // This is handled by the context when activeCar changes

        setSaving(false);
        
        // If auto-save from shop, just go back without alert
        if (autoSave) {
          navigation.goBack();
          return;
        }
        
        Alert.alert("Success", isEditing ? "Part updated!" : "Part added to your inventory!", [
          { text: "OK", onPress: () => navigation.goBack() }
        ]);
        return;
      }

      // Firebase mode - save to Firestore
      if (!user || !user.uid) {
        Alert.alert("Error", "Please sign in to save parts.");
        setSaving(false);
        return;
      }

      // Get or create folder if needed
      let folderId = selectedFolder;
      if (!folderId && category && activeCar.activeBuildId) {
        const defaultFolderName = categoryToFolderName(category);
        folderId = await getOrCreateFolder(user.uid, activeCar.activeBuildId, defaultFolderName);
      }
      partData.folderId = folderId;
      partData.buildId = activeCar.activeBuildId;

      if (isEditing && partToEdit?.id) {
        // Update existing part in Firestore
        const { updateDoc, doc, serverTimestamp } = await import("firebase/firestore");
        const { db } = await import("../services/firebaseConfig");
        if (!db) {
          setSaving(false);
          Alert.alert("Error", "Database not available");
          return;
        }
        const partRef = doc(db, "users", user.uid, "cars", activeCar.id, "parts", partToEdit.id);
        await updateDoc(partRef, {
          ...partData,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Create new part in Firestore
        const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
        const { db } = await import("../services/firebaseConfig");
        if (!db) {
          setSaving(false);
          Alert.alert("Error", "Database not available");
          return;
        }
        const partsRef = collection(db, "users", user.uid, "cars", activeCar.id, "parts");
        await addDoc(partsRef, {
          ...partData,
          // Metadata
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      setSaving(false);
      Alert.alert("Success", isEditing ? "Part updated!" : "Part added to your inventory!", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      console.error("Save error:", e);
      setSaving(false);
      Alert.alert("Error", "Failed to save part. Please try again.");
    }
  };

  const SectionHeader = ({ title }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
                <Text style={styles.title}>{isEditing ? "Edit Part" : "Add Part"}</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveButton}>
          {saving ? (
            <ActivityIndicator size="small" color="#22c55e" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Car Reference */}
        {activeCar && (
          <View style={styles.carRef}>
            <Text style={styles.carRefLabel}>Adding to:</Text>
            <Text style={styles.carRefName}>
              {activeCar.year} {activeCar.make} {activeCar.model}
            </Text>
          </View>
        )}

        {/* Image Section */}
        <TouchableOpacity style={styles.imageSection} onPress={handlePickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera-outline" size={48} color="#666" style={{ marginBottom: 8 }} />
              <Text style={styles.imagePlaceholderText}>Add Part Photo</Text>
              <Text style={styles.imagePlaceholderHint}>Tap to upload</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Product Link */}
        <View style={styles.linkSection}>
          <Ionicons name="link-outline" size={20} color="#666" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.linkInput}
            placeholder="Paste product link (optional)"
            placeholderTextColor="#666"
            value={productLink}
            onChangeText={setProductLink}
            autoCapitalize="none"
            keyboardType="url"
          />
          {productLink && (
            <TouchableOpacity
              style={styles.importButton}
              onPress={handleImportFromURL}
              disabled={importing}
            >
              {importing ? (
                <ActivityIndicator size="small" color="#22c55e" />
              ) : (
                <Ionicons name="download-outline" size={20} color="#22c55e" />
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* ========== BASIC INFO ========== */}
        <SectionHeader title="PART DETAILS" />
        
        <Text style={styles.label}>Part Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. BBS RS-GT Wheels"
          placeholderTextColor="#666"
          value={name}
          onChangeText={setName}
        />

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Brand</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. BBS"
              placeholderTextColor="#666"
              value={brand}
              onChangeText={setBrand}
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Part Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. RS-GT-001"
              placeholderTextColor="#666"
              value={partNumber}
              onChangeText={setPartNumber}
            />
          </View>
        </View>

        <Text style={styles.label}>Category *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                category === cat.id && styles.categoryChipActive,
              ]}
              onPress={() => setCategory(cat.id)}
            >
              <Ionicons name={cat.icon} size={20} color={category === cat.id ? "#ffffff" : "#666"} style={{ marginRight: 6 }} />
              <Text
                style={[
                  styles.categoryText,
                  category === cat.id && styles.categoryTextActive,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Status</Text>
        <View style={styles.statusRow}>
          {INSTALL_STATUS.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[
                styles.statusChip,
                status === s.id && { backgroundColor: s.color + "30", borderColor: s.color },
              ]}
              onPress={() => setStatus(s.id)}
            >
              <View style={[styles.statusDot, { backgroundColor: s.color }]} />
              <Text style={[styles.statusText, status === s.id && { color: s.color }]}>
                {s.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Folder Selection */}
        <Text style={styles.label}>Folder</Text>
        <TouchableOpacity
          style={styles.folderSelector}
          onPress={() => setShowFolderPicker(true)}
        >
          <Ionicons name="folder-outline" size={20} color="#666" style={{ marginRight: 8 }} />
          <Text style={[styles.folderSelectorText, !selectedFolder && styles.folderSelectorPlaceholder]}>
            {selectedFolder 
              ? folders.find(f => f.id === selectedFolder)?.name || "Select folder"
              : category 
                ? `Auto: ${categoryToFolderName(category)}`
                : "Select folder (optional)"}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>

        {/* Folder Picker Modal */}
        {showFolderPicker && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Folder</Text>
                <TouchableOpacity onPress={() => setShowFolderPicker(false)}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {folders.map((folder) => (
                  <TouchableOpacity
                    key={folder.id}
                    style={[
                      styles.folderOption,
                      selectedFolder === folder.id && styles.folderOptionActive,
                    ]}
                    onPress={() => {
                      setSelectedFolder(folder.id);
                      setShowFolderPicker(false);
                    }}
                  >
                    <Ionicons 
                      name={selectedFolder === folder.id ? "folder" : "folder-outline"} 
                      size={20} 
                      color={selectedFolder === folder.id ? "#22c55e" : "#666"} 
                      style={{ marginRight: 12 }}
                    />
                    <Text style={[
                      styles.folderOptionText,
                      selectedFolder === folder.id && styles.folderOptionTextActive,
                    ]}>
                      {folder.name}
                    </Text>
                    {selectedFolder === folder.id && (
                      <Ionicons name="checkmark" size={20} color="#22c55e" style={{ marginLeft: "auto" }} />
                    )}
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.folderOption}
                  onPress={async () => {
                    // Create new folder
                    const newFolderName = category ? categoryToFolderName(category) : "Other";
                    if (demoMode) {
                      // In demo mode, add to activeCar.builds[].folders
                      const activeBuild = activeCar.builds?.find(b => b.isActive) || activeCar.builds?.[0];
                      if (activeBuild) {
                        const newFolder = {
                          id: `folder_${Date.now()}`,
                          name: newFolderName,
                          sortOrder: 0,
                        };
                        const updatedFolders = [...(activeBuild.folders || []), newFolder];
                        const updatedBuilds = activeCar.builds.map(b =>
                          b.id === activeBuild.id ? { ...b, folders: updatedFolders } : b
                        );
                        const updatedCar = { ...activeCar, builds: updatedBuilds };
                        setActiveCarState(updatedCar);
                        setFolders(updatedFolders);
                        setSelectedFolder(newFolder.id);
                      }
                    } else if (user && activeCar.activeBuildId) {
                      const folderId = await getOrCreateFolder(user.uid, activeCar.activeBuildId, newFolderName);
                      await loadFolders();
                      setSelectedFolder(folderId);
                    }
                    setShowFolderPicker(false);
                  }}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#22c55e" style={{ marginRight: 12 }} />
                  <Text style={styles.folderOptionText}>Create New Folder</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        )}

        {/* ========== PURCHASE INFO ========== */}
        <SectionHeader title="PURCHASE INFO" />

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Price Paid</Text>
            <View style={styles.priceInputWrapper}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="0.00"
                placeholderTextColor="#666"
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Purchase Date</Text>
            <TextInput
              style={styles.input}
              placeholder="MM/DD/YYYY"
              placeholderTextColor="#666"
              value={purchaseDate}
              onChangeText={setPurchaseDate}
            />
          </View>
        </View>

        <Text style={styles.label}>Purchased From</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Tire Rack, Amazon, Local Shop"
          placeholderTextColor="#666"
          value={purchasedFrom}
          onChangeText={setPurchasedFrom}
        />

        <Text style={styles.label}>Order/Receipt Number</Text>
        <TextInput
          style={styles.input}
          placeholder="For your records"
          placeholderTextColor="#666"
          value={orderNumber}
          onChangeText={setOrderNumber}
        />

        {/* ========== INSTALLATION INFO ========== */}
        <SectionHeader title="INSTALLATION" />

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Install Date</Text>
            <TextInput
              style={styles.input}
              placeholder="MM/DD/YYYY"
              placeholderTextColor="#666"
              value={installDate}
              onChangeText={setInstallDate}
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Labor Cost</Text>
            <View style={styles.priceInputWrapper}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="0.00"
                placeholderTextColor="#666"
                value={installCost}
                onChangeText={setInstallCost}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </View>

        <Text style={styles.label}>Installed By</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Self, Local Shop Name, Dealer"
          placeholderTextColor="#666"
          value={installer}
          onChangeText={setInstaller}
        />

        <Text style={styles.label}>Mileage at Install</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 45000"
          placeholderTextColor="#666"
          value={mileageAtInstall}
          onChangeText={setMileageAtInstall}
          keyboardType="number-pad"
        />

        {/* ========== WARRANTY INFO ========== */}
        <SectionHeader title="WARRANTY" />

        <TouchableOpacity
          style={styles.warrantyToggle}
          onPress={() => setHasWarranty(!hasWarranty)}
        >
          <View style={[styles.checkbox, hasWarranty && styles.checkboxActive]}>
            {hasWarranty && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.warrantyToggleText}>This part has a warranty</Text>
        </TouchableOpacity>

        {hasWarranty && (
          <>
            <Text style={styles.label}>Warranty Expires</Text>
            <TextInput
              style={styles.input}
              placeholder="MM/DD/YYYY or mileage"
              placeholderTextColor="#666"
              value={warrantyExpires}
              onChangeText={setWarrantyExpires}
            />

            <Text style={styles.label}>Warranty Details</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Coverage details, claim info, etc."
              placeholderTextColor="#666"
              value={warrantyNotes}
              onChangeText={setWarrantyNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </>
        )}

        {/* ========== NOTES ========== */}
        <SectionHeader title="NOTES" />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Any additional details, fitment notes, etc."
          placeholderTextColor="#666"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Cost Summary */}
        <View style={styles.costSummary}>
          <Text style={styles.costSummaryTitle}>Cost Summary</Text>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Part Cost</Text>
            <Text style={styles.costValue}>${parseFloat(price) || 0}</Text>
          </View>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Labor Cost</Text>
            <Text style={styles.costValue}>${parseFloat(installCost) || 0}</Text>
          </View>
          <View style={[styles.costRow, styles.costRowTotal]}>
            <Text style={styles.costLabelTotal}>Total Investment</Text>
            <Text style={styles.costValueTotal}>
              ${(parseFloat(price) || 0) + (parseFloat(installCost) || 0)}
            </Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveFullButton}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveFullButtonText}>Save Part to Inventory</Text>
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
  backButton: {
    width: 70,
  },
  backButtonText: {
    color: "#4a9eff",
    fontSize: 16,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  saveButton: {
    width: 70,
    alignItems: "flex-end",
  },
  saveButtonText: {
    color: "#22c55e",
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  carRef: {
    backgroundColor: "#111",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#4a9eff",
  },
  carRefLabel: {
    color: "#888",
    fontSize: 12,
    marginBottom: 2,
  },
  carRefName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  imageSection: {
    height: 180,
    backgroundColor: "#111",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#222",
    borderStyle: "dashed",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  imagePlaceholderText: {
    color: "#888",
    fontSize: 16,
    fontWeight: "500",
  },
  imagePlaceholderHint: {
    color: "#555",
    fontSize: 12,
    marginTop: 4,
  },
  linkSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  linkIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  linkInput: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
    paddingVertical: 14,
  },
  importButton: {
    padding: 8,
    marginLeft: 8,
  },
  folderSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0a0a0a",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#1a1a1a",
    marginBottom: 16,
  },
  folderSelectorText: {
    flex: 1,
    color: "#ffffff",
    fontSize: 15,
  },
  folderSelectorPlaceholder: {
    color: "#666",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "#0a0a0a",
    borderRadius: 8,
    width: "80%",
    maxHeight: "60%",
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  modalTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  folderOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  folderOptionActive: {
    backgroundColor: "#1a1a1a",
  },
  folderOptionText: {
    flex: 1,
    color: "#ffffff",
    fontSize: 15,
  },
  folderOptionTextActive: {
    color: "#22c55e",
    fontWeight: "600",
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
    paddingBottom: 8,
  },
  sectionTitle: {
    color: "#4a9eff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  label: {
    color: "#888",
    fontSize: 12,
    marginBottom: 8,
    marginTop: 12,
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
  textArea: {
    height: 90,
    paddingTop: 14,
  },
  row: {
    flexDirection: "row",
    marginHorizontal: -6,
  },
  halfField: {
    flex: 1,
    marginHorizontal: 6,
  },
  priceInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#222",
    paddingLeft: 16,
  },
  currencySymbol: {
    color: "#22c55e",
    fontSize: 16,
    fontWeight: "600",
  },
  priceInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  categoryScroll: {
    marginBottom: 8,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#222",
  },
  categoryChipActive: {
    backgroundColor: "#4a9eff20",
    borderColor: "#4a9eff",
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryText: {
    color: "#888",
    fontSize: 14,
  },
  categoryTextActive: {
    color: "#4a9eff",
    fontWeight: "500",
  },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    margin: 4,
    borderWidth: 1,
    borderColor: "#222",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: "#888",
    fontSize: 13,
  },
  warrantyToggle: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#333",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxActive: {
    backgroundColor: "#22c55e",
    borderColor: "#22c55e",
  },
  checkmark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  warrantyToggleText: {
    color: "#fff",
    fontSize: 15,
  },
  costSummary: {
    backgroundColor: "#111",
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: "#222",
  },
  costSummaryTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  costLabel: {
    color: "#888",
    fontSize: 14,
  },
  costValue: {
    color: "#fff",
    fontSize: 14,
  },
  costRowTotal: {
    borderTopWidth: 1,
    borderTopColor: "#222",
    marginTop: 8,
    paddingTop: 12,
  },
  costLabelTotal: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  costValueTotal: {
    color: "#22c55e",
    fontSize: 18,
    fontWeight: "700",
  },
  saveFullButton: {
    backgroundColor: "#22c55e",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
  },
  saveFullButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});
