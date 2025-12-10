// src/screens/ShopScreen.js
// THE SHOP - Product Tester Hub

import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { categoryToFolderName } from "../services/buildService";
import { useCarContext } from "../services/carContext";
import { getDefaultPlacementForPart } from "../shop/placementUtils";
import { canAddActivePart, canCreateBuild, getTierLimits } from "../shop/subscriptionLimits";
import {
    createTestBuild,
    getTestBuilds,
    setCurrentTestBuild,
    updateTestBuild
} from "../shop/testBuildStorage";

const CATEGORY_ICONS = {
  wheels: "disc-outline",
  suspension: "resize-outline",
  exhaust: "flash-outline",
  exterior: "car-outline",
  interior: "car-sport-outline",
  engine: "settings-outline",
  performance: "speedometer-outline",
  electronics: "hardware-chip-outline",
  maintenance: "construct-outline",
  other: "cube-outline",
};

export default function ShopScreen({ navigation }) {
  const { activeCar, user, demoMode, plan, demoCars, setActiveCarState } = useCarContext();
  const [savedParts, setSavedParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentBuild, setCurrentBuild] = useState(null);
  const [builds, setBuilds] = useState([]);
  const [activePlacements, setActivePlacements] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [showVehicleSelector, setShowVehicleSelector] = useState(false);
  const [simulatedParts, setSimulatedParts] = useState([]); // Parts being tried on

  const tierLimits = getTierLimits(plan || "free");
  const subscriptionTier = plan || "free";

  useEffect(() => {
    checkEntryRequirements();
  }, [activeCar, user, subscriptionTier, demoCars]);

  // Check subscription-based entry requirements
  const checkEntryRequirements = async () => {
    // BASIC: If no vehicle/build, redirect to AddCar
    if (subscriptionTier === "free" || subscriptionTier === "basic") {
      if (!activeCar) {
        Alert.alert(
          "Add Your Car First",
          "Create a vehicle and build to start trying parts.",
          [
            { text: "Cancel", style: "cancel", onPress: () => navigation.goBack() },
            { 
              text: "Add Car", 
              onPress: () => navigation.navigate("AddCar")
            },
          ]
        );
        return;
      }
    }

    // PREMIUM: Show vehicle selector if multiple vehicles
    if (subscriptionTier === "premium") {
      const vehicleCount = demoMode ? (demoCars?.length || 0) : 0; // TODO: Get from Firebase
      if (vehicleCount > 1) {
        setShowVehicleSelector(true);
      }
    }

    // PRO: Use current active build automatically
    // (No special handling needed - just use activeCar)

    // Load data once requirements are met
    loadData();
  };

  const loadData = async () => {
    if (!activeCar) {
      setSavedParts([]);
      setCurrentBuild(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Load parts
      if (demoMode) {
        const parts = activeCar.parts || [];
        setSavedParts(parts);
      } else if (user) {
        const { collection, query, orderBy, getDocs } = await import("firebase/firestore");
        const { db } = await import("../services/firebaseConfig");
        if (db) {
          const partsRef = collection(db, "users", user.uid, "cars", activeCar.id, "parts");
          const q = query(partsRef, orderBy("createdAt", "desc"));
          const snapshot = await getDocs(q);
          
          const partsList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setSavedParts(partsList);
        }
      }

      // Load test builds
      if (!demoMode && user) {
        const testBuilds = await getTestBuilds(user.uid, activeCar.id);
        setBuilds(testBuilds);
        
        const current = testBuilds.find(b => b.isCurrent) || testBuilds[0];
        if (current) {
          setCurrentBuild(current);
          setActivePlacements(current.placements || []);
        } else {
          // Create initial build if none exists
          if (testBuilds.length === 0) {
            const newBuildId = await createTestBuild(user.uid, activeCar.id, "Build 1");
            const newBuild = {
              id: newBuildId,
              ownerId: user.uid,
              vehicleId: activeCar.id,
              name: "Build 1",
              isCurrent: true,
              placements: [],
              viewSnapshots: [],
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            setCurrentBuild(newBuild);
            setBuilds([newBuild]);
          }
        }
      } else {
        // Demo mode - create local build
        const demoBuild = {
          id: "demo_build_1",
          vehicleId: activeCar.id,
          name: "Demo Build",
          isCurrent: true,
          placements: [],
        };
        setCurrentBuild(demoBuild);
        setActivePlacements([]);
      }
    } catch (error) {
      console.error("Error loading shop data:", error);
      setSavedParts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePart = async (part) => {
    if (!currentBuild) {
      Alert.alert("Error", "Please create a build first.");
      return;
    }

    const existingPlacement = activePlacements.find(p => p.partId === part.id);
    const isCurrentlyActive = existingPlacement?.active || false;

    // Check tier limits when activating
    if (!isCurrentlyActive) {
      const activeCount = activePlacements.filter(p => p.active).length;
      if (!canAddActivePart(activeCount, plan || "free")) {
        Alert.alert(
          "Part Limit Reached",
          `Your ${plan || "free"} plan allows ${tierLimits.maxActiveParts} active parts at once. Upgrade to add more.`
        );
        return;
      }
    }

    let newPlacements;

    if (existingPlacement) {
      // Toggle existing placement
      newPlacements = activePlacements.map(p =>
        p.partId === part.id ? { ...p, active: !p.active } : p
      );
    } else {
      // Create new placement with dimension-aware defaults
      const defaultPlacement = getDefaultPlacementForPart(activeCar, part);
      newPlacements = [
        ...activePlacements,
        {
          partId: part.id,
          ...defaultPlacement,
        },
      ];
    }

    setActivePlacements(newPlacements);

    // Save to build
    if (!demoMode && user && currentBuild) {
      try {
        await updateTestBuild(user.uid, currentBuild.id, {
          placements: newPlacements,
        });
      } catch (error) {
        console.error("Error updating build:", error);
        Alert.alert("Error", "Could not update build.");
      }
    }
  };

  const handleCreateNewBuild = async () => {
    if (!user || !activeCar) return;

    if (!canCreateBuild(builds.length, plan || "free")) {
      Alert.alert(
        "Build Limit Reached",
        `You can save up to ${tierLimits.maxBuilds} builds. Delete an existing build to create a new one.`
      );
      return;
    }

    try {
      const buildNumber = builds.length + 1;
      const newBuildId = await createTestBuild(user.uid, activeCar.id, `Build ${buildNumber}`);
      
      // Set as current
      await setCurrentTestBuild(user.uid, activeCar.id, newBuildId);
      
      // Reload builds
      await loadData();
    } catch (error) {
      console.error("Error creating build:", error);
      Alert.alert("Error", "Could not create new build.");
    }
  };

  const handleAddAllToBuild = () => {
    if (activePlacements.filter(p => p.active).length === 0) {
      Alert.alert("No Active Parts", "Toggle parts on to add them to your build.");
      return;
    }

    // Navigate to TryMods screen with current build
    navigation.navigate("TryMods", { 
      buildId: currentBuild?.id,
      placements: activePlacements.filter(p => p.active),
    });
  };

  const activePartsList = savedParts.filter(part => {
    const placement = activePlacements.find(p => p.partId === part.id);
    return placement?.active;
  });

  const buildName = currentBuild?.name || (activeCar ? `${activeCar.make} ${activeCar.model}` : "Your Build");

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color="#fff" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ width: 24 }} />
          <Text style={styles.headerTitle}>THE SHOP</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("PartTryOn", { buildId: currentBuild?.id })}
            style={styles.addButton}
          >
            <Ionicons name="add" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Current Build */}
        <View style={styles.buildInfo}>
          <Text style={styles.buildLabel}>Current Build: {buildName}</Text>
          {builds.length > 0 && (
            <TouchableOpacity onPress={handleCreateNewBuild} style={styles.newBuildButton}>
              <Text style={styles.newBuildButtonText}>+ New Build</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Main Content - Split Layout */}
        <View style={styles.mainContent}>
          {/* Left: Live Visualizer */}
          <View style={styles.visualizerColumn}>
            <Text style={styles.visualizerTitle}>Live Visualizer</Text>
            <View style={styles.carVisualizer}>
              {activeCar?.imageUrl ? (
                <Image
                  source={{ uri: activeCar.imageUrl }}
                  style={styles.carImage}
                  resizeMode="cover"
                />
              ) : (
                <TouchableOpacity
                  style={styles.carPlaceholder}
                  onPress={() => {
                    if (demoCars && demoCars.length > 0) {
                      Alert.alert(
                        "Select Car",
                        "Choose a car to visualize:",
                        [
                          ...demoCars.map(car => ({
                            text: `${car.year} ${car.make} ${car.model}`,
                            onPress: () => {
                              setActiveCarState(car);
                            },
                          })),
                          { text: "Cancel", style: "cancel" },
                        ]
                      );
                    } else {
                      navigation.navigate("AddCar");
                    }
                  }}
                >
                  <Ionicons name="car-outline" size={64} color="#666" />
                  <Text style={styles.carPlaceholderText}>
                    {demoCars && demoCars.length > 0 ? "Tap to select car" : "No car selected"}
                  </Text>
                  {demoCars && demoCars.length > 0 && (
                    <Text style={styles.carPlaceholderSubtext}>
                      {demoCars.length} car{demoCars.length > 1 ? 's' : ''} available
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Right: Parts List */}
          <View style={styles.partsColumn}>
            {/* Simulated Parts Section (from PartTryOn) */}
            {simulatedParts.length > 0 && (
              <View style={styles.simulatedSection}>
                <Text style={styles.sectionTitle}>Simulated Parts</Text>
                {simulatedParts.map((part) => (
                  <View key={part.id} style={styles.partItem}>
                    <View style={styles.partIconContainer}>
                      <Ionicons 
                        name={CATEGORY_ICONS[part.category] || "cube-outline"} 
                        size={24} 
                        color={part.isActive ? "#22c55e" : "#666"} 
                      />
                    </View>
                    <View style={styles.partInfo}>
                      <Text style={styles.partName}>{part.name}</Text>
                      <Text style={styles.partDescription}>
                        {part.brand || ""} {part.brand && part.category ? "•" : ""} {part.category || ""}
                      </Text>
                    </View>
                    <Switch
                      value={part.isActive}
                      onValueChange={() => {
                        setSimulatedParts(prev =>
                          prev.map(p => p.id === part.id ? { ...p, isActive: !p.isActive } : p)
                        );
                      }}
                      trackColor={{ false: "#1a1a1a", true: "#22c55e" }}
                      thumbColor={part.isActive ? "#ffffff" : "#666"}
                    />
                  </View>
                ))}
                <TouchableOpacity
                  style={styles.saveToBuildButton}
                  onPress={async () => {
                    const activeSimParts = simulatedParts.filter(p => p.isActive);
                    if (activeSimParts.length === 0) {
                      Alert.alert("No Active Parts", "Toggle parts on to save them.");
                      return;
                    }

                    // Save first part to build and create inventory item
                    const firstPart = activeSimParts[0];
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
                      buildId: currentBuild?.id || activeCar?.activeBuildId,
                      autoSave: true,
                    });
                  }}
                >
                  <Ionicons name="save-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.saveToBuildButtonText}>Save to Build</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.partsHeader}>
              <Text style={styles.partsTitle}>Parts</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("PartTryOn", { 
                  buildId: currentBuild?.id || activeCar?.activeBuildId,
                })}
                style={styles.addPartButton}
              >
                <Ionicons name="add-circle-outline" size={20} color="#22c55e" />
              </TouchableOpacity>
            </View>
            {savedParts.length === 0 ? (
              <View style={styles.emptyParts}>
                <Ionicons name="cube-outline" size={32} color="#666" />
                <Text style={styles.emptyPartsText}>No parts saved yet</Text>
                <Text style={styles.emptyPartsSubtext}>Add parts to inventory to test them here</Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => navigation.navigate("AddPart", { fromShop: true })}
                >
                  <Text style={styles.emptyButtonText}>Add Your First Part</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.partsList}>
                {savedParts.map((part) => {
                  const placement = activePlacements.find(p => p.partId === part.id);
                  const isActive = placement?.active || false;

                  return (
                    <View key={part.id} style={styles.partItem}>
                      <View style={styles.partIconContainer}>
                        <Ionicons
                          name={CATEGORY_ICONS[part.category] || "cube-outline"}
                          size={24}
                          color={isActive ? "#22c55e" : "#666"}
                        />
                      </View>
                      <View style={styles.partInfo}>
                        <Text style={styles.partName}>{part.name}</Text>
                        <Text style={styles.partDescription}>
                          {part.brand || ""} {part.brand && part.category ? "•" : ""} {part.category || ""}
                        </Text>
                      </View>
                      <Switch
                        value={isActive}
                        onValueChange={() => handleTogglePart(part)}
                        trackColor={{ false: "#1a1a1a", true: "#22c55e" }}
                        thumbColor={isActive ? "#ffffff" : "#666"}
                      />
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* Quick Add Section */}
        {activePartsList.length > 0 && (
          <View style={styles.activePartsSection}>
            <Text style={styles.activePartsTitle}>Quick Add</Text>
            <View style={styles.activePartsGrid}>
              {activePartsList.slice(0, 4).map((part) => (
                <View key={part.id} style={styles.activePartThumbnail}>
                  {part.imageUrl ? (
                    <Image source={{ uri: part.imageUrl }} style={styles.activePartImage} />
                  ) : (
                    <Ionicons
                      name={CATEGORY_ICONS[part.category] || "cube-outline"}
                      size={32}
                      color="#22c55e"
                    />
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Add to Build Button */}
        {activePartsList.length > 0 && (
          <TouchableOpacity
            style={styles.addToBuildButton}
            onPress={handleAddAllToBuild}
          >
            <Text style={styles.addToBuildButtonText}>
              ADD ALL ACTIVE TO BUILD
            </Text>
          </TouchableOpacity>
        )}

        {/* Tier Limit Info */}
        <View style={styles.tierInfo}>
          <Text style={styles.tierInfoText}>
            {plan || "Free"} Plan: {activePartsList.length}/{tierLimits.maxActiveParts} active parts
          </Text>
          {activePartsList.length >= tierLimits.maxActiveParts && (
            <TouchableOpacity
              onPress={() => navigation.navigate("Upgrade")}
              style={styles.upgradeLink}
            >
              <Text style={styles.upgradeLinkText}>Upgrade to add more</Text>
            </TouchableOpacity>
          )}
        </View>

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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "700",
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  buildInfo: {
    paddingHorizontal: 16,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  buildLabel: {
    color: "#a0a0a0",
    fontSize: 15,
  },
  newBuildButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  newBuildButtonText: {
    color: "#22c55e",
    fontSize: 12,
    fontWeight: "600",
  },
  mainContent: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 16,
    marginBottom: 24,
  },
  visualizerColumn: {
    flex: 1,
  },
  visualizerTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  carVisualizer: {
    width: "100%",
    height: 200,
    backgroundColor: "#0a0a0a",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  carImage: {
    width: "100%",
    height: "100%",
  },
  carPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  carPlaceholderText: {
    color: "#666",
    fontSize: 14,
    marginTop: 8,
  },
  carPlaceholderSubtext: {
    color: "#444",
    fontSize: 12,
    marginTop: 4,
  },
  simulatedSection: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  saveToBuildButton: {
    backgroundColor: "#22c55e",
    paddingVertical: 12,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  saveToBuildButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  partsColumn: {
    flex: 1,
  },
  partsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  partsTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  addPartButton: {
    padding: 4,
  },
  partsList: {
    gap: 12,
  },
  emptyParts: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "#0a0a0a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  emptyPartsText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 4,
  },
  emptyPartsSubtext: {
    color: "#666",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 12,
  },
  emptyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#1a1a1a",
    marginTop: 8,
  },
  emptyButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  partItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0a0a0a",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  partIconContainer: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  partInfo: {
    flex: 1,
  },
  partName: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  partDescription: {
    color: "#a0a0a0",
    fontSize: 13,
  },
  activePartsSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  activePartsTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  activePartsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  activePartThumbnail: {
    width: 60,
    height: 60,
    backgroundColor: "#0a0a0a",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#22c55e",
    overflow: "hidden",
  },
  activePartImage: {
    width: "100%",
    height: "100%",
  },
  addToBuildButton: {
    backgroundColor: "#0a0a0a",
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  addToBuildButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  tierInfo: {
    paddingHorizontal: 16,
    marginTop: 12,
    alignItems: "center",
  },
  tierInfoText: {
    color: "#666",
    fontSize: 12,
  },
  upgradeLink: {
    marginTop: 4,
  },
  upgradeLinkText: {
    color: "#22c55e",
    fontSize: 12,
    fontWeight: "600",
  },
});
