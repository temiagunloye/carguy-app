// src/screens/InventoryScreen.js

import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useCarContext } from "../services/carContext";
import { getAllCarsForUser, setActiveCar } from "../services/carService";
import { getPlanConfig } from "../services/plans";

const FILTER_CATEGORIES = [
  { id: "all", name: "All Parts" },
  { id: "wheels", name: "Wheels & Tires" },
  { id: "suspension", name: "Suspension" },
  { id: "engine", name: "Engine" },
  { id: "exhaust", name: "Exhaust" },
  { id: "exterior", name: "Exterior" },
  { id: "interior", name: "Interior" },
];

export default function InventoryScreen({ navigation }) {
  const { user, plan, activeCar, loading: contextLoading, refreshActiveCar, demoCars, demoMode } = useCarContext();
  const [cars, setCars] = useState([]);
  const [carStats, setCarStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadCars();
  }, [user, demoCars, activeCar]);

  const loadCars = async () => {
    // Set loading immediately to show UI
    setLoading(true);

    // Quick return if no user (demo mode will have user)
    if (!user) {
      setCars([]);
      setCarStats({});
      setLoading(false);
      return;
    }

    try {
      // Check if demo mode first (faster check)
      if (demoMode || user.isAnonymous || user.uid.startsWith("demo_") || user.uid.startsWith("guest_")) {
        // In demo mode, get cars from context
        const list = demoCars || [];
        setCars(list);
        const demoStats = {};
        list.forEach(car => {
          // Count parts from car.parts array if it exists
          const parts = car.parts || [];
          let totalValue = 0;
          let warrantyCount = 0;
          parts.forEach(part => {
            totalValue += part.totalCost || 0;
            if (part.hasWarranty) warrantyCount++;
          });
          demoStats[car.id] = {
            partsCount: parts.length,
            totalValue,
            warrantyCount
          };
        });
        setCarStats(demoStats);
        setLoading(false);
        return;
      }

      // Firebase mode - load cars first, then stats
      const list = await getAllCarsForUser(user.uid);
      setCars(list); // Show cars immediately

      // Load stats in background (non-blocking)
      if (list.length > 0) {
        const statsPromises = list.map(async (car) => {
          try {
            const partsRef = collection(db, "users", user.uid, "cars", car.id, "parts");
            const snapshot = await getDocs(partsRef);
            let totalValue = 0;
            let warrantyCount = 0;

            snapshot.docs.forEach(doc => {
              const data = doc.data();
              totalValue += data.totalCost || 0;
              if (data.hasWarranty) warrantyCount++;
            });

            return {
              carId: car.id,
              stats: {
                partsCount: snapshot.size,
                totalValue,
                warrantyCount,
              }
            };
          } catch (e) {
            return {
              carId: car.id,
              stats: { partsCount: 0, totalValue: 0, warrantyCount: 0 }
            };
          }
        });

        const results = await Promise.all(statsPromises);
        const stats = {};
        results.forEach(({ carId, stats: carStats }) => {
          stats[carId] = carStats;
        });
        setCarStats(stats);
      } else {
        setCarStats({});
      }
    } catch (error) {
      console.error("Error loading cars:", error);
      setCars([]);
      setCarStats({});
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCar = async (carId) => {
    if (!user) return;
    await setActiveCar(user.uid, carId);
    await refreshActiveCar();
  };

  const handleViewCarDetail = (car) => {
    navigation.navigate("CarDetail", { car });
  };

  if (contextLoading || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  const renderCar = ({ item }) => {
    const isActive = activeCar && activeCar.id === item.id;
    // Prefer renderingPreviewUrl, fallback to imageUrl
    const imgSource = (item.renderingPreviewUrl || item.imageUrl) ? { uri: item.renderingPreviewUrl || item.imageUrl } : null;
    const stats = carStats[item.id] || { partsCount: 0, totalValue: 0, warrantyCount: 0 };

    // Check if this car can be edited based on plan
    const { maxCars } = getPlanConfig(plan || "free");
    const canEdit = cars.length <= maxCars || isActive;

    return (
      <TouchableOpacity
        style={[styles.card, !canEdit && styles.cardReadOnly]}
        onPress={() => {
          if (!canEdit) {
            Alert.alert(
              "Upgrade Required",
              "Upgrade your plan to manage multiple builds.",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Upgrade", onPress: () => navigation.navigate("Upgrade") },
              ]
            );
          } else {
            handleViewCarDetail(item);
          }
        }}
        onLongPress={() => canEdit && handleSelectCar(item.id)}
      >
        {/* Car Image */}
        {imgSource ? (
          <Image source={imgSource} style={styles.cardImage} />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <Ionicons name="car-outline" size={32} color="#666" />
          </View>
        )}

        {/* Car Info */}
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>
            {item.year} {item.make} {item.model}
          </Text>

          <View style={styles.cardStats}>
            <Text style={styles.cardStatText}>
              {stats.partsCount} parts{stats.warrantyCount > 0 ? ` · ${stats.warrantyCount} active ${stats.warrantyCount === 1 ? 'warranty' : 'warranties'}` : ''}
            </Text>
          </View>

          <Text style={styles.cardValue}>
            Total value: ${stats.totalValue.toLocaleString()}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={20} color="#a0a0a0" style={styles.cardArrow} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventory</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("AddCar")}
        >
          <Ionicons name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#a0a0a0" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="All Vehicles"
          placeholderTextColor="#666666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Categories Grid */}
      <View style={styles.categoriesGrid}>
        {FILTER_CATEGORIES.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.categoryCard,
              selectedFilter === filter.id && styles.categoryCardActive,
            ]}
            onPress={() => setSelectedFilter(filter.id)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedFilter === filter.id && styles.categoryTextActive,
              ]}
            >
              {filter.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Car List */}
      {cars.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="car-outline" size={64} color="#666" />
          <Text style={styles.emptyTitle}>No vehicles yet</Text>
          <Text style={styles.emptySubtitle}>Add your first car to start tracking parts</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate("AddCar")}
          >
            <Text style={styles.emptyButtonText}>Add Your Car</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={cars}
          keyExtractor={(item) => item.id}
          renderItem={renderCar}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    backgroundColor: "#000000",
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0a0a0a",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 15,
    paddingVertical: 12,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  categoryCard: {
    width: "47%",
    paddingVertical: 20,
    borderRadius: 12,
    backgroundColor: "#0a0a0a",
    borderWidth: 1,
    borderColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
  },
  categoryCardActive: {
    backgroundColor: "#1a1a1a",
    borderColor: "#2a2a2a",
  },
  categoryText: {
    color: "#a0a0a0",
    fontSize: 14,
    fontWeight: "600",
  },
  categoryTextActive: {
    color: "#ffffff",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#0a0a0a",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1a1a1a",
    alignItems: "center",
  },
  cardImage: {
    width: 80,
    height: 60,
    borderRadius: 6,
    marginRight: 12,
  },
  cardImagePlaceholder: {
    width: 80,
    height: 60,
    borderRadius: 6,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardStats: {
    marginBottom: 4,
  },
  cardStatText: {
    color: "#a0a0a0",
    fontSize: 14,
  },
  cardValue: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  cardArrow: {
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: "#a0a0a0",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: "#0a0a0a",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  emptyButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
});
