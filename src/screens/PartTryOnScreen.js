// src/screens/PartTryOnScreen.js
// Part try-on flow: Input part details, simulate on build, save to inventory

import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { categoryToFolderName } from "../services/buildService";
import { useCarContext } from "../services/carContext";

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

export default function PartTryOnScreen({ navigation, route }) {
  const { activeCar, demoMode, setActiveCarState } = useCarContext();
  const targetBuildId = route?.params?.buildId;

  // Part input
  const [partName, setPartName] = useState("");
  const [productLink, setProductLink] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");

  // Simulated parts (for this session)
  const [simulatedParts, setSimulatedParts] = useState([]);

  const handleSimulate = () => {
    if (!partName.trim() || !category) {
      Alert.alert("Missing Info", "Please enter part name and select a category.");
      return;
    }

    const newSimulatedPart = {
      id: `sim_${Date.now()}`,
      name: partName.trim(),
      productLink: productLink.trim(),
      category,
      brand: brand.trim(),
      price: parseFloat(price) || 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    setSimulatedParts(prev => [...prev, newSimulatedPart]);

    // Clear input fields
    setPartName("");
    setProductLink("");
    setCategory("");
    setBrand("");
    setPrice("");

    // No alert - just add silently
  };

  const handleTogglePart = (partId) => {
    setSimulatedParts(prev =>
      prev.map(p => p.id === partId ? { ...p, isActive: !p.isActive } : p)
    );
  };

  const handleSaveToBuild = async () => {
    const activeParts = simulatedParts.filter(p => p.isActive);
    if (activeParts.length === 0) {
      Alert.alert("No Saveable Parts", "Toggle parts on to save them to your build.");
      return;
    }

    // Save first part directly to build and create inventory item (no confirmation)
    const firstPart = activeParts[0];

    // Get build ID
    const buildId = targetBuildId || activeCar?.activeBuildId || activeCar?.builds?.find(b => b.isActive)?.id;

    // Navigate to AddPart with pre-filled data - it will auto-save
    navigation.navigate("AddPart", {
      fromShop: true,
      prefillData: {
        name: firstPart.name,
        productLink: firstPart.productLink,
        category: firstPart.category,
        brand: firstPart.brand,
        price: firstPart.price?.toString() || "0",
      },
      folderName: categoryToFolderName(firstPart.category),
      buildId: buildId,
      autoSave: true, // Flag to auto-save without confirmation
    });

    // Remove saved part from simulated list
    setSimulatedParts(prev => prev.filter(p => p.id !== firstPart.id));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Try Part on Build</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Build Info */}
        {activeCar && (
          <View style={styles.buildInfo}>
            <Text style={styles.buildLabel}>Current Build</Text>
            <Text style={styles.buildName}>
              {activeCar.nickname || `${activeCar.year} ${activeCar.make} ${activeCar.model}`}
            </Text>
          </View>
        )}

        {/* Part Input Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Part Details</Text>

          <Text style={styles.label}>Part/Product Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Borla S-Type Cat-Back Exhaust"
            placeholderTextColor="#666"
            value={partName}
            onChangeText={setPartName}
          />

          <Text style={styles.label}>Product Link</Text>
          <TextInput
            style={styles.input}
            placeholder="Paste product URL"
            placeholderTextColor="#666"
            value={productLink}
            onChangeText={setProductLink}
            autoCapitalize="none"
            keyboardType="url"
          />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Brand</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Borla"
                placeholderTextColor="#666"
                value={brand}
                onChangeText={setBrand}
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Price</Text>
              <TextInput
                style={styles.input}
                placeholder="$0.00"
                placeholderTextColor="#666"
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
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

          <TouchableOpacity
            style={[styles.simulateButton, (!partName.trim() || !category) && styles.simulateButtonDisabled]}
            onPress={handleSimulate}
            disabled={!partName.trim() || !category}
          >
            <Ionicons name="eye-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.simulateButtonText}>Simulate on My Build</Text>
          </TouchableOpacity>
        </View>

        {/* Simulated Parts List */}
        {simulatedParts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Parts in Rendering</Text>
            <Text style={styles.sectionSubtitle}>Toggle parts on/off to see them in the visualizer</Text>

            {simulatedParts.map((part) => (
              <View key={part.id} style={styles.simulatedPartItem}>
                <View style={styles.simulatedPartInfo}>
                  <Text style={styles.simulatedPartName}>{part.name}</Text>
                  <Text style={styles.simulatedPartMeta}>
                    {part.brand} • {CATEGORIES.find(c => c.id === part.category)?.name}
                  </Text>
                </View>
                <Switch
                  value={part.isActive}
                  onValueChange={() => handleTogglePart(part.id)}
                  trackColor={{ false: "#1a1a1a", true: "#22c55e" }}
                  thumbColor={part.isActive ? "#ffffff" : "#666"}
                />
              </View>
            ))}

            <TouchableOpacity
              style={styles.saveToBuildButton}
              onPress={handleSaveToBuild}
            >
              <Ionicons name="save-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.saveToBuildButtonText}>Save to Build</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 100 }} />
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
    paddingTop: 20,
    paddingBottom: 40,
  },
  buildInfo: {
    backgroundColor: "#0a0a0a",
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  buildLabel: {
    color: "#a0a0a0",
    fontSize: 12,
    marginBottom: 4,
  },
  buildName: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  sectionSubtitle: {
    color: "#a0a0a0",
    fontSize: 13,
    marginBottom: 16,
  },
  label: {
    color: "#a0a0a0",
    fontSize: 13,
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    backgroundColor: "#0a0a0a",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#ffffff",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0a0a0a",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  categoryChipActive: {
    backgroundColor: "#22c55e30",
    borderColor: "#22c55e",
  },
  categoryText: {
    color: "#a0a0a0",
    fontSize: 13,
    fontWeight: "500",
  },
  categoryTextActive: {
    color: "#ffffff",
  },
  simulateButton: {
    backgroundColor: "#22c55e",
    paddingVertical: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  simulateButtonDisabled: {
    opacity: 0.5,
  },
  simulateButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  simulatedPartItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0a0a0a",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  simulatedPartInfo: {
    flex: 1,
  },
  simulatedPartName: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  simulatedPartMeta: {
    color: "#a0a0a0",
    fontSize: 13,
  },
  saveToBuildButton: {
    backgroundColor: "#0a0a0a",
    paddingVertical: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  saveToBuildButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  backToShopButton: {
    backgroundColor: "#0a0a0a",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  backToShopButtonText: {
    color: "#a0a0a0",
    fontSize: 15,
  },
});

