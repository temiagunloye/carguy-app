import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
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

  // Refresh active car when screen comes into focus
  const { refreshActiveCar } = useCarContext();
  useEffect(() => {
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

      // Try to get the dynamic first angle 360 shot first (User Request)
      let uri = null;
      if (activeCar.standardCarId) {
        try {
          const stdCar = await standardCarLibraryService.getStandardCarById(activeCar.standardCarId);
          if (stdCar) {
            // Use active variant or default
            const validVariantId = activeCar.activeVariantId || stdCar.defaultVariantId;
            uri = await standardCarLibraryService.getFirstAngleUrl(stdCar, validVariantId);
          }
        } catch (e) {
          console.warn("Error fetching first angle:", e);
        }
      }

      // Fallback to legacy fields if 360 angle not found
      if (!uri) {
        uri = activeCar.dealerImageUrl || activeCar.imageUrl;
        if (uri && !uri.startsWith('http') && !uri.startsWith('file')) {
          try {
            const resolved = await standardCarLibraryService.resolveStoragePath(uri);
            if (resolved) uri = resolved;
          } catch (e) {
            console.warn("Failed to resolve fallback image", e);
          }
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
          {user?.photoURL ? (
            <Image
              source={{ uri: user.photoURL }}
              style={styles.profileImage}
            />
          ) : (
            <View style={[styles.profileImage, { justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="person" size={24} color="#888" />
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderActiveCar = () => {
    if (!activeCar) {
      return (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateTitle}>Your Garage is Empty</Text>
          <Text style={styles.emptyStateSubtitle}>Add your first car to get started with parts tracking and build management.</Text>
          <TouchableOpacity
            style={styles.addCarButton}
            onPress={() => navigation.navigate("AddCar")}
          >
            <Text style={styles.addCarButtonText}>+ Add Car</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.heroContainer}>
        {heroImageSource ? (
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.heroImageContainer}
            onPress={() => navigation.navigate("CarDetail", { car: activeCar })}
          >
            <Image source={heroImageSource} style={styles.heroImage} resizeMode="cover" />
            <View style={styles.heroOverlay}>
              <Text style={styles.heroOverlayText}>View Details ›</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.heroPlaceholder}
            onPress={() => navigation.navigate("CarDetail", { car: activeCar })}
          >
            <Ionicons name="car-sport-outline" size={64} color="#333" />
            <Text style={styles.heroPlaceholderText}>Tap to view details</Text>
          </TouchableOpacity>
        )}

        <View style={styles.activeCarInfo}>
          <Text style={styles.activeCarName}>
            {activeCar.year} {activeCar.make} {activeCar.model}
          </Text>
          <Text style={styles.activeCarTrim}>
            {activeCar.trim} {activeCar.paintColor ? `• ${activeCar.paintColor}` : ''}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderActiveCar()}

      {/* MAIN ACTIONS */}
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

      {/* POPUP */}
      <AddCarModal visible={showAddCar} onClose={() => setShowAddCar(false)} />

      {/* Tier Limit Modal */}
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 10,
  },
  greetingContainer: {
    flex: 1,
  },
  greetingText: {
    color: "#a0a0a0",
    fontSize: 14,
    marginBottom: 4,
  },
  usernameText: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "700",
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#333",
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    minHeight: 200,
  },
  emptyStateTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  addCarButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  addCarButtonText: {
    color: "#000",
    fontWeight: "600",
  },
  heroContainer: {
    marginBottom: 32,
  },
  heroImageContainer: {
    height: 220,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    backgroundColor: "#111",
    position: 'relative',
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  heroOverlayText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  heroPlaceholder: {
    height: 220,
    borderRadius: 12,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  heroPlaceholderText: {
    color: "#666",
    marginTop: 12,
  },
  activeCarInfo: {
    paddingHorizontal: 4,
  },
  activeCarName: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  activeCarTrim: {
    color: "#888",
    fontSize: 16,
  },
  actionSection: {
    marginBottom: 32,
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
