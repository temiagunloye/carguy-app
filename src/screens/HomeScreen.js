// src/screens/HomeScreen.js

import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import AddCarModal from "../components/AddCarModal";
import { useCarContext } from "../services/carContext";

export default function HomeScreen({ navigation }) {
  const { activeCar, loading } = useCarContext();
  const [showAddCar, setShowAddCar] = useState(false);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  const hasCar = !!activeCar;

  const heroImageSource =
    activeCar && activeCar.imageUrl
      ? { uri: activeCar.imageUrl }
      : null;

  return (
    <View style={styles.container}>
      {/* HERO IMAGE */}
      <View style={styles.heroImageWrapper}>
        {heroImageSource ? (
          <Image source={heroImageSource} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <View style={styles.heroPlaceholder}>
            <Ionicons name="car-outline" size={48} color="#666" />
            <Text style={styles.heroPlaceholderText}>No car image yet</Text>
          </View>
        )}
      </View>

      {/* CAR TEXT */}
      <Text style={styles.carTitle}>
        {hasCar
          ? `${activeCar.year} ${activeCar.make} ${activeCar.model}${activeCar.trim ? ` ${activeCar.trim}` : ""}`
          : "Add your first car"}
      </Text>

      <Text style={styles.carSubtitle}>
        {hasCar
          ? `${activeCar.paintColor || ""}${activeCar.drivetrain ? ` • ${activeCar.drivetrain}` : ""}${
              activeCar.mileage ? ` • ${activeCar.mileage.toLocaleString()} miles` : ""
            }`
          : "Start by adding your vehicle."}
      </Text>

      {/* MAIN BUTTONS */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate("AddCar")}
        >
          <Ionicons name="camera-outline" size={18} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.primaryButtonText}>Scan My Car</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate("TryMods")}
        >
          <Ionicons name="eye-outline" size={18} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.primaryButtonText}>Try Mods</Text>
        </TouchableOpacity>
      </View>

      {/* QUICK ACTIONS */}
      <View style={styles.quickActions}>
        <Text style={styles.quickTitle}>Quick Actions</Text>

        <TouchableOpacity
          style={styles.quickRow}
          onPress={() => navigation.navigate("InventoryTab")}
        >
          <Text style={styles.quickText}>View Inventory</Text>
          <Ionicons name="chevron-forward" size={20} color="#a0a0a0" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickRow}
          onPress={() => navigation.navigate("BuildHistory")}
        >
          <Text style={styles.quickText}>See Build History</Text>
          <Ionicons name="chevron-forward" size={20} color="#a0a0a0" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickRow}
          onPress={() => navigation.navigate("AddPart")}
        >
          <Text style={styles.quickText}>Add New Part</Text>
          <Ionicons name="chevron-forward" size={20} color="#a0a0a0" />
        </TouchableOpacity>
      </View>

      {/* POPUP - only show when user taps the button */}
      <AddCarModal visible={showAddCar} onClose={() => setShowAddCar(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    paddingHorizontal: 16,
    paddingTop: 32,
  },
  center: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  heroImageWrapper: {
    height: 240,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  heroImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  heroPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    backgroundColor: "#0a0a0a",
    justifyContent: "center",
    alignItems: "center",
  },
  heroPlaceholderText: {
    color: "#666666",
    fontSize: 14,
    marginTop: 8,
  },
  carTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  carSubtitle: {
    color: "#a0a0a0",
    fontSize: 15,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 32,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  quickActions: {
    marginTop: 8,
  },
  quickTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  quickRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  quickText: {
    color: "#ffffff",
    fontSize: 15,
  },
});
