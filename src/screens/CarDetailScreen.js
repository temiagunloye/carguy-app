// src/screens/CarDetailScreen.js

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useCarContext } from "../services/carContext";
import { getKiriStatusDisplay } from "../services/kiri";

const CATEGORIES = [
  { id: "all", name: "All Parts", icon: "cube-outline" },
  { id: "wheels", name: "Wheels & Tires", icon: "disc-outline" },
  { id: "suspension", name: "Suspension", icon: "resize-outline" },
  { id: "exhaust", name: "Exhaust", icon: "flash-outline" },
  { id: "exterior", name: "Exterior", icon: "car-outline" },
  { id: "interior", name: "Interior", icon: "car-sport-outline" },
  { id: "engine", name: "Engine Components", icon: "settings-outline" },
  { id: "performance", name: "Performance", icon: "speedometer-outline" },
  { id: "electronics", name: "Electronics", icon: "hardware-chip-outline" },
  { id: "maintenance", name: "Maintenance", icon: "construct-outline" },
  { id: "other", name: "Other", icon: "cube-outline" },
];

const STATUS_COLORS = {
  installed: "#22c55e",
  pending: "#f59e0b",
  in_storage: "#6b7280",
  sold: "#ef4444",
};

const STATUS_LABELS = {
  installed: "Installed",
  pending: "Pending",
  in_storage: "Storage",
  sold: "Removed",
};

// Helper to get shot display title
function getShotDisplayTitle(shot) {
  if (!shot) return 'Photo';
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
}

export default function CarDetailScreen({ navigation, route }) {
  const { user, demoMode, activeCar, demoCars } = useCarContext();
  const routeCar = route?.params?.car;

  // In demo mode, always get the latest car from activeCar or demoCars
  // This ensures we have the updated parts array
  // Use useMemo to make it reactive to activeCar and demoCars changes
  const car = useMemo(() => {
    if (demoMode) {
      // If routeCar matches activeCar, use activeCar (has latest parts)
      if (activeCar && routeCar && activeCar.id === routeCar.id) {
        return activeCar;
      }
      // Otherwise, find the car in demoCars (which should be synced)
      if (routeCar) {
        const latestCar = demoCars.find(c => c.id === routeCar.id);
        return latestCar || activeCar || routeCar;
      }
      return activeCar;
    }
    return routeCar || activeCar;
  }, [demoMode, activeCar, routeCar, demoCars]);

  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("date"); // date, price, name

  useEffect(() => {
    loadParts();
  }, [car, activeCar, demoMode, demoCars]);

  // Refresh when screen comes into focus (e.g., when navigating back from AddPart)
  useFocusEffect(
    useCallback(() => {
      loadParts();
    }, [car, activeCar, demoMode])
  );

  const loadParts = async () => {
    if (!car) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Check demo mode first
      if (demoMode) {
        // In demo mode, get parts from car.parts array
        // Always use the latest car data
        const latestCar = activeCar && activeCar.id === car.id ? activeCar : car;
        const carParts = latestCar.parts || [];
        // Sort by createdAt descending
        const sortedParts = carParts.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
          const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
          return dateB - dateA;
        });
        setParts(sortedParts);
        setLoading(false);
        return;
      }

      // Firebase mode
      if (!user || !user.uid) {
        setLoading(false);
        return;
      }

      const { collection, query, orderBy, getDocs } = await import("firebase/firestore");
      const { db } = await import("../services/firebaseConfig");
      if (!db) {
        setLoading(false);
        return;
      }

      const partsRef = collection(db, "users", user.uid, "cars", car.id, "parts");
      const q = query(partsRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      const partsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setParts(partsList);
    } catch (e) {
      console.error("Error loading parts:", e);
      Alert.alert("Error", "Failed to load parts.");
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort parts
  const filteredParts = parts
    .filter(p => selectedCategory === "all" || p.category === selectedCategory)
    .sort((a, b) => {
      if (sortBy === "price") return (b.totalCost || 0) - (a.totalCost || 0);
      if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
      return 0; // date - already sorted from query
    });

  // Calculate totals
  const totalInvestment = parts.reduce((sum, p) => sum + (p.totalCost || 0), 0);
  const installedParts = parts.filter(p => p.status === "installed").length;
  const activeWarranties = parts.filter(p => p.hasWarranty).length;

  const renderPartCard = ({ item }) => (
    <TouchableOpacity
      style={styles.partCard}
      onPress={() => navigation.navigate("PartDetail", { part: item, car })}
    >
      <View style={styles.partRow}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.partImage} />
        ) : (
          <View style={styles.partImagePlaceholder}>
            <Text style={styles.partImageIcon}>
              {CATEGORIES.find(c => c.id === item.category)?.icon || "📦"}
            </Text>
          </View>
        )}

        <View style={styles.partInfo}>
          <View style={styles.partHeader}>
            <Text style={styles.partName} numberOfLines={1}>{item.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + "30" }]}>
              <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.status] }]} />
              <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
                {STATUS_LABELS[item.status]}
              </Text>
            </View>
          </View>

          {item.brand && (
            <Text style={styles.partBrand}>{item.brand}</Text>
          )}

          <View style={styles.partMeta}>
            {item.installDate && (
              <Text style={styles.partMetaText}>
                <Ionicons name="calendar-outline" size={12} color="#666" /> {item.installDate}
              </Text>
            )}
            {item.hasWarranty && (
              <Text style={styles.partMetaText}>
                <Ionicons name="shield-checkmark-outline" size={12} color="#666" /> Warranty
              </Text>
            )}
          </View>
        </View>

        <View style={styles.partPriceContainer}>
          <Text style={styles.partPrice}>${item.totalCost || 0}</Text>
          <Text style={styles.partChevron}>›</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (!car) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No car selected</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Parts Inventory</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("AddPart")}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Car Info Card */}
        <View style={styles.carCard}>
          {car.imageUrl ? (
            <Image source={{ uri: car.imageUrl }} style={styles.carImage} />
          ) : (
            <View style={styles.carImagePlaceholder}>
              <Ionicons name="car-outline" size={24} color="#666" />
            </View>
          )}
          <View style={styles.carInfo}>
            <Text style={styles.carName}>
              {car.year} {car.make} {car.model}
            </Text>
            {car.nickname && (
              <Text style={styles.carNickname}>"{car.nickname}"</Text>
            )}
            <Text style={styles.carDetails}>
              {car.paintColor} • {car.drivetrain}
            </Text>
          </View>
        </View>

        {/* 10-Angle Scan Button */}
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => navigation.navigate("CarScanCapture", { carId: car.id, buildId: car.activeBuildId })}
        >
          <Ionicons name="camera-outline" size={20} color="#22c55e" style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.scanButtonText}>10-Angle Car Scan</Text>
            <Text style={styles.scanButtonSubtext}>Capture all angles for 3D reconstruction</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        {/* Show Captured Photos */}
        {car.photoSet?.shots && car.photoSet.shots.length > 0 && (
          <View style={styles.photosSection}>
            <Text style={styles.photosSectionTitle}>Captured Photos ({car.photoSet.shots.length}/10)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
              {car.photoSet.shots.map((shot, index) => (
                <TouchableOpacity
                  key={shot.id || index}
                  style={styles.photoThumbnail}
                  onPress={() => {
                    // TODO: Open full screen photo viewer
                    Alert.alert("Photo", getShotDisplayTitle(shot));
                  }}
                >
                  <Image
                    source={{ uri: shot.imageUri }}
                    style={styles.photoThumbnailImage}
                    resizeMode="cover"
                  />
                  <View style={styles.photoThumbnailLabel}>
                    <Text style={styles.photoThumbnailText} numberOfLines={1}>
                      {getShotDisplayTitle(shot)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{parts.length}</Text>
            <Text style={styles.statLabel}>Total Parts</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{installedParts}</Text>
            <Text style={styles.statLabel}>Installed</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{activeWarranties}</Text>
            <Text style={styles.statLabel}>Warranties</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxHighlight]}>
            <Text style={styles.statValueHighlight}>${totalInvestment.toLocaleString()}</Text>
            <Text style={styles.statLabelHighlight}>Total Value</Text>
          </View>
        </View>

        {/* KIRI 3D Model Status */}
        {car.kiriStatus && car.kiriStatus !== 'idle' && (
          <View style={styles.kiriCard}>
            <View style={styles.kiriHeader}>
              <Ionicons
                name={getKiriStatusDisplay(car.kiriStatus).icon}
                size={24}
                color={getKiriStatusDisplay(car.kiriStatus).color}
              />
              <Text style={styles.kiriTitle}>3D Model</Text>
            </View>

            <Text style={[styles.kiriStatus, { color: getKiriStatusDisplay(car.kiriStatus).color }]}>
              {getKiriStatusDisplay(car.kiriStatus).text}
            </Text>

            {car.kiriStatus === 'processing' && car.kiriProgress && (
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${car.kiriProgress}%` }]} />
              </View>
            )}

            {car.kiriStatus === 'complete' && car.kiriViewerUrl && (
              <TouchableOpacity
                style={styles.open3DButton}
                onPress={() => navigation.navigate('ModelViewer', {
                  viewerUrl: car.kiriViewerUrl,
                  carName: car.nickname || `${car.year} ${car.make} ${car.model}`,
                })}
              >
                <Ionicons name="cube" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.open3DButtonText}>Open 3D Model</Text>
              </TouchableOpacity>
            )}

            {car.kiriStatus === 'error' && car.kiriError && (
              <Text style={styles.kiriError}>{car.kiriError}</Text>
            )}
          </View>
        )}

        {/* Folder Grid - Google Drive Style */}
        <View style={styles.folderGridSection}>
          <Text style={styles.folderGridTitle}>Parts Folders</Text>
          <View style={styles.folderGrid}>
            {CATEGORIES.map((cat) => {
              const count = cat.id === "all"
                ? parts.length
                : parts.filter(p => p.category === cat.id).length;

              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.folderCard,
                    selectedCategory === cat.id && styles.folderCardActive,
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <View style={styles.folderIconContainer}>
                    <Ionicons
                      name={cat.icon}
                      size={32}
                      color={selectedCategory === cat.id ? "#4a9eff" : "#666"}
                    />
                  </View>
                  <Text style={[
                    styles.folderName,
                    selectedCategory === cat.id && styles.folderNameActive,
                  ]} numberOfLines={2}>
                    {cat.name}
                  </Text>
                  {count > 0 && (
                    <Text style={[
                      styles.folderCount,
                      selectedCategory === cat.id && styles.folderCountActive,
                    ]}>
                      {count} {count === 1 ? 'part' : 'parts'}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Sort Options */}
        <View style={styles.sortRow}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          {[
            { id: "date", label: "Recent" },
            { id: "price", label: "Price" },
            { id: "name", label: "Name" },
          ].map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[styles.sortChip, sortBy === option.id && styles.sortChipActive]}
              onPress={() => setSortBy(option.id)}
            >
              <Text style={[styles.sortChipText, sortBy === option.id && styles.sortChipTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Parts List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#4a9eff" />
          </View>
        ) : filteredParts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>No parts yet</Text>
            <Text style={styles.emptySubtitle}>
              {selectedCategory === "all"
                ? "Start building your inventory by adding parts"
                : `No ${CATEGORIES.find(c => c.id === selectedCategory)?.name.toLowerCase()} parts`}
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate("AddPart")}
            >
              <Text style={styles.emptyButtonText}>+ Add First Part</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.partsList}>
            {filteredParts.map((part) => (
              <View key={part.id}>
                {renderPartCard({ item: part })}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("AddPart")}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  center: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#888",
    fontSize: 16,
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
  addButton: {
    backgroundColor: "#22c55e",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  carCard: {
    flexDirection: "row",
    backgroundColor: "#111",
    margin: 16,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  carImage: {
    width: 80,
    height: 50,
    borderRadius: 8,
  },
  carImagePlaceholder: {
    width: 80,
    height: 50,
    borderRadius: 8,
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
  },
  scanButton: {
    backgroundColor: "#0a0a0a",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#22c55e30",
    flexDirection: "row",
    alignItems: "center",
  },
  scanButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  scanButtonSubtext: {
    color: "#666",
    fontSize: 12,
    marginTop: 2,
  },
  carInfo: {
    flex: 1,
    marginLeft: 12,
  },
  carName: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  carNickname: {
    color: "#4a9eff",
    fontSize: 13,
    fontStyle: "italic",
  },
  carDetails: {
    color: "#888",
    fontSize: 13,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    alignItems: "center",
  },
  statBoxHighlight: {
    backgroundColor: "#22c55e15",
    borderWidth: 1,
    borderColor: "#22c55e30",
  },
  statValue: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  statValueHighlight: {
    color: "#22c55e",
    fontSize: 16,
    fontWeight: "700",
  },
  statLabel: {
    color: "#888",
    fontSize: 10,
    marginTop: 2,
  },
  statLabelHighlight: {
    color: "#22c55e",
    fontSize: 10,
    marginTop: 2,
  },
  categoryScroll: {
    marginBottom: 12,
  },
  categoryScrollContent: {
    paddingHorizontal: 16,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    fontSize: 14,
    marginRight: 6,
  },
  categoryText: {
    color: "#888",
    fontSize: 13,
  },
  categoryTextActive: {
    color: "#4a9eff",
    fontWeight: "500",
  },
  categoryCount: {
    backgroundColor: "#333",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  categoryCountActive: {
    backgroundColor: "#4a9eff",
  },
  categoryCountText: {
    color: "#888",
    fontSize: 11,
    fontWeight: "600",
  },
  categoryCountTextActive: {
    color: "#fff",
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sortLabel: {
    color: "#888",
    fontSize: 13,
    marginRight: 8,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: "#111",
  },
  sortChipActive: {
    backgroundColor: "#333",
  },
  sortChipText: {
    color: "#888",
    fontSize: 13,
  },
  sortChipTextActive: {
    color: "#fff",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtitle: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: "#4a9eff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  partsList: {
    paddingHorizontal: 16,
  },
  partCard: {
    backgroundColor: "#111",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  partRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  partImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  partImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
  },
  partImageIcon: {
    fontSize: 24,
  },
  partInfo: {
    flex: 1,
    marginLeft: 12,
  },
  partHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  partName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "500",
  },
  partBrand: {
    color: "#888",
    fontSize: 13,
    marginTop: 2,
  },
  partMeta: {
    flexDirection: "row",
    marginTop: 4,
  },
  partMetaText: {
    color: "#666",
    fontSize: 11,
    marginRight: 10,
  },
  partPriceContainer: {
    alignItems: "flex-end",
    marginLeft: 8,
  },
  partPrice: {
    color: "#22c55e",
    fontSize: 15,
    fontWeight: "700",
  },
  partChevron: {
    color: "#444",
    fontSize: 20,
    marginTop: 2,
  },
  fab: {
    position: "absolute",
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#4a9eff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4a9eff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "500",
    marginTop: -2,
  },
  photosSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  photosSectionTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  photosScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  photoThumbnail: {
    width: 120,
    height: 120,
    marginRight: 12,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#0a0a0a",
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  photoThumbnailImage: {
    width: "100%",
    height: 90,
  },
  photoThumbnailLabel: {
    height: 30,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  photoThumbnailText: {
    color: "#a0a0a0",
    fontSize: 11,
  },
  // KIRI 3D Model Card Styles
  kiriCard: {
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#222",
  },
  kiriHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  kiriTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  kiriStatus: {
    fontSize: 14,
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#222",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 16,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4a9eff",
    borderRadius: 3,
  },
  open3DButton: {
    backgroundColor: "#22c55e",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  open3DButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  kiriError: {
    color: "#ef4444",
    fontSize: 13,
    marginTop: 8,
  },
});
