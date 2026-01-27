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
import TierLimitModal from "../components/TierLimitModal";
import { useAppMode } from "../contexts/AppModeContext";
import { useCarContext } from "../services/carContext";
import standardCarLibraryService from "../services/StandardCarLibraryService";

export default function HomeScreen({ navigation }) {
  const { activeCar, loading, user, plan } = useCarContext();
  const [showAddCar, setShowAddCar] = useState(false);
  const { isDemoSession } = useAppMode();
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitModalConfig, setLimitModalConfig] = useState({
    title: '',
    message: '',
  });

  const [resolvedImageUrl, setResolvedImageUrl] = useState(null);

  // Attempt to resolve imageUrl if it's a storage path
  React.useEffect(() => {
    const resolvePath = async () => {
      if (activeCar?.imageUrl && !activeCar.imageUrl.startsWith('http')) {
        try {
          const url = await standardCarLibraryService.resolveStoragePath(activeCar.imageUrl);
          setResolvedImageUrl(url);
        } catch (e) {
          console.warn('Failed to resolve home car image:', e);
        }
      } else {
        setResolvedImageUrl(null);
      }
    };
    resolvePath();
  }, [activeCar?.imageUrl]);

  // Refresh active car when screen comes into focus
  const { refreshActiveCar } = useCarContext();
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshActiveCar();
    });
    return unsubscribe;
  }, [navigation, refreshActiveCar]);

  // Resolve image if needed
  const [heroImageSource, setHeroImageSource] = useState(null);

  useEffect(() => {
    const resolveImage = async () => {
      if (!activeCar) {
        setHeroImageSource(null);
        return;
      }

      // Prefer dealerImageUrl or imageUrl
      // Check local assets first if any (e.g. require) - not applicable for dynamic
      let uri = activeCar.dealerImageUrl || activeCar.imageUrl;

      if (uri && !uri.startsWith('http') && !uri.startsWith('file')) {
        // It's likely a storage path
        try {
          const { default: standardCarLibraryService } = await import("../services/StandardCarLibraryService");
          uri = await standardCarLibraryService.resolveStoragePath(uri);
        } catch (e) {
          console.warn("Failed to resolve home image", e);
        }
      }

      if (uri) {
        setHeroImageSource({ uri });
      } else {
        setHeroImageSource(null);
      }
    };
    resolveImage();
  }, [activeCar]);

  // Simple tier from plan (defaults to 'free' if no user/plan)
  const tier = plan || 'free';

  const handleAddNewCar = async () => {
    // In demo mode, allow access
    if (isDemoSession) {
      navigation.navigate("AddCar");
      return;
    }

    // Free tier: block scan, show paywall
    if (tier === 'free') {
      setLimitModalConfig({
        title: 'Upgrade Required',
        message: 'Scan My Car is available for Pro and Premium members. Upgrade to unlock this feature.',
      });
      setShowLimitModal(true);
      return;
    }

    // Check vehicle count (simplified - actual count would come from firestore)
    // For now, allow if tier is pro or premium
    navigation.navigate("AddCar");
  };

  const renderHeader = () => {
    const now = new Date();
    const hours = now.getHours();
    let timeOfDay = "day";
    if (hours >= 5 && hours < 12) {
      timeOfDay = "morning";
    } else if (hours >= 12 && hours < 17) {
      timeOfDay = "afternoon";
    } else if (hours >= 17 || hours < 5) {
      timeOfDay = "evening";
    }

    return (
      <View style={styles.header}>
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingText}>Good {timeOfDay},</Text>
          <Text style={styles.usernameText}>{user?.displayName || "Driver"}</Text>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate("Profile")}
        >
          <Image
            source={
              user?.photoURL
                ? { uri: user.photoURL }
                : require("../../assets/images/default-avatar.png")
            }
            style={styles.profileImage}
          />
        </TouchableOpacity>
      </View>
    );
  };

  const renderActiveCar = () => {
    if (!activeCar) {
      return (
        <TouchableOpacity
          style={styles.heroPlaceholder}
          onPress={() => navigation.navigate("AddCar")}
          activeOpacity={0.8}
        >
          <Ionicons name="car-outline" size={48} color="#666" />
          <Text style={styles.heroPlaceholderText}>Tap to add your car</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.heroContainer}>
        {heroImageSource ? (
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.heroImageContainer}
            onPress={() => {
              if (activeCar.standardCarId) {
                // If it's a standard car, go to the dedicated standard car UI?
                // OR go to CarDetail which we are upgrading to have 360 view
                // User asked for "access it" -> implies Details
                navigation.navigate("CarDetail", { car: activeCar });
              } else {
                navigation.navigate("CarDetail", { car: activeCar });
              }
            }}
          >
            <Image source={heroImageSource} style={styles.heroImage} resizeMode="cover" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.heroPlaceholder}
            onPress={() => navigation.navigate("AddCar")}
            activeOpacity={0.8}
          >
            <Ionicons name="car-outline" size={48} color="#666" />
            <Text style={styles.heroPlaceholderText}>Tap to add your car</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* CAR TEXT */ }
      <Text style={styles.carTitle}>
        {hasCar
          ? `${activeCar.year} ${activeCar.make} ${activeCar.model}${activeCar.trim ? ` ${activeCar.trim}` : ""}`
          : "Add your first car"}
      </Text>

      <Text style={styles.carSubtitle}>
        {hasCar
          ? `${activeCar.paintColor || ""}${activeCar.drivetrain ? ` • ${activeCar.drivetrain}` : ""}${activeCar.mileage ? ` • ${activeCar.mileage.toLocaleString()} miles` : ""
          }`
          : "Start by adding your vehicle."}
      </Text>

    {/* MAIN ACTIONS */ }
    <View style={styles.actionSection}>
      <TouchableOpacity
        style={styles.libraryButton}
        onPress={() => navigation.navigate("BrowseStandardCars")}
      >
        <Ionicons name="grid-outline" size={20} color="#fff" style={styles.buttonIcon} />
        <Text style={styles.libraryButtonText}>Browse Car Library</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleAddNewCar}
      >
        <Ionicons name="add-circle-outline" size={20} color="#000" style={styles.buttonIcon} />
        <Text style={styles.primaryButtonText}>Add Your Own Car</Text>
      </TouchableOpacity>
    </View>



    {/* QUICK ACTIONS */ }
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

    {/* POPUP - only show when user taps the button */ }
    <AddCarModal visible={showAddCar} onClose={() => setShowAddCar(false)} />

    {/* Tier Limit Modal */ }
    <TierLimitModal
      visible={showLimitModal}
      onClose={() => setShowLimitModal(false)}
      onUpgrade={() => {
        setShowLimitModal(false);
        navigation.navigate("Upgrade");
      }}
      title={limitModalConfig.title}
      message={limitModalConfig.message}
      currentTier={tier}
    />
    </View >
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
  actionSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#666',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  demoRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  demoButton: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  demoButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  libraryButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 12,
  },
  libraryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  primaryButton: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "700",
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
