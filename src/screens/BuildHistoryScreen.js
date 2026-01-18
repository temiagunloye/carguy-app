// src/screens/BuildHistoryScreen.js

import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useCarContext } from "../services/carContext";
// Firebase imports removed - will be loaded dynamically when needed

const TYPE_ICONS = {
  mod: "construct-outline",
  maintenance: "settings-outline",
  milestone: "checkmark-circle-outline",
  default: "document-text-outline",
};

const TYPE_COLORS = {
  mod: "#4a9eff",
  maintenance: "#f59e0b",
  milestone: "#22c55e",
  default: "#666666",
};

export default function BuildHistoryScreen({ navigation }) {
  const { activeCar, user, demoMode } = useCarContext();
  const [buildHistory, setBuildHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalSpent, setTotalSpent] = useState(0);
  const [modCount, setModCount] = useState(0);

  useEffect(() => {
    loadBuildHistory();
  }, [activeCar, user]);

  const loadBuildHistory = async () => {
    if (!activeCar) {
      setBuildHistory([]);
      setTotalSpent(0);
      setModCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      if (demoMode) {
        // In demo mode, get parts from activeCar.parts
        const parts = activeCar.parts || [];
        const history = parts
          .filter(part => part.installDate) // Only parts with install dates
          .map(part => ({
            id: part.id || `part_${Date.now()}`,
            date: part.installDate,
            title: part.name,
            description: `${part.brand || ""} ${part.brand ? "•" : ""} ${part.category || ""}`.trim(),
            type: part.category === "maintenance" ? "maintenance" : "mod",
            cost: part.totalCost || 0,
          }))
          .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date descending

        setBuildHistory(history);
        const spent = history.reduce((sum, item) => sum + item.cost, 0);
        const mods = history.filter(item => item.type === "mod").length;
        setTotalSpent(spent);
        setModCount(mods);
      } else if (user) {
        const { collection, query, orderBy, getDocs } = await import("firebase/firestore");
        const { db } = await import("../services/firebaseConfig");
        if (!db) {
          setLoading(false);
          return;
        }
        const partsRef = collection(db, "users", user.uid, "cars", activeCar.id, "parts");
        const q = query(partsRef, orderBy("installDate", "desc"));
        const snapshot = await getDocs(q);

        const history = snapshot.docs
          .map(doc => {
            const data = doc.data();
            if (!data.installDate) return null;
            return {
              id: doc.id,
              date: data.installDate,
              title: data.name,
              description: `${data.brand || ""} ${data.brand ? "•" : ""} ${data.category || ""}`.trim(),
              type: data.category === "maintenance" ? "maintenance" : "mod",
              cost: data.totalCost || 0,
            };
          })
          .filter(item => item !== null);

        setBuildHistory(history);
        const spent = history.reduce((sum, item) => sum + item.cost, 0);
        const mods = history.filter(item => item.type === "mod").length;
        setTotalSpent(spent);
        setModCount(mods);
      }
    } catch (error) {
      console.error("Error loading build history:", error);
      setBuildHistory([]);
      setTotalSpent(0);
      setModCount(0);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.title}>Build History</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator color="#fff" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Build History</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Vehicle Selector */}
        {activeCar && (
          <View style={styles.vehicleSelector}>
            <Text style={styles.selectorLabel}>Vehicle:</Text>
            <TouchableOpacity style={styles.dropdown} onPress={() => {/* TODO: implement vehicle switcher */ }}>
              <Text style={styles.dropdownText}>
                {activeCar.year} {activeCar.make} {activeCar.model}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#888" />
            </TouchableOpacity>
          </View>
        )}

        {/* Car Info */}
        {activeCar && (
          <View style={styles.carCard}>
            <Text style={styles.carSpecs}>
              {activeCar.paintColor || ""} {activeCar.paintColor && activeCar.drivetrain ? "•" : ""} {activeCar.drivetrain || ""}
            </Text>
          </View>
        )}

        {/* Stats - Only show if there's data */}
        {buildHistory.length > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>${totalSpent.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Total Invested</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{modCount}</Text>
              <Text style={styles.statLabel}>Modifications</Text>
            </View>
          </View>
        )}

        {/* Empty State */}
        {buildHistory.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="time-outline" size={64} color="#666" />
            <Text style={styles.emptyTitle}>No build history yet</Text>
            <Text style={styles.emptySubtitle}>
              Install parts to see your build timeline here
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate("AddPart")}
            >
              <Text style={styles.emptyButtonText}>Add Your First Part</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Timeline */}
            <View style={styles.timelineSection}>
              <Text style={styles.sectionTitle}>Timeline</Text>

              {buildHistory.map((item, index) => (
                <View key={item.id} style={styles.timelineItem}>
                  {/* Line connector */}
                  {index < buildHistory.length - 1 && (
                    <View style={styles.timelineLine} />
                  )}

                  {/* Dot */}
                  <View style={[styles.timelineDot, { backgroundColor: TYPE_COLORS[item.type] || TYPE_COLORS.default }]}>
                    <Ionicons
                      name={TYPE_ICONS[item.type] || TYPE_ICONS.default}
                      size={20}
                      color="#ffffff"
                    />
                  </View>

                  {/* Content */}
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineDate}>
                      {new Date(item.date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                    </Text>
                    <View style={styles.timelineCard}>
                      <Text style={styles.timelineTitle}>{item.title}</Text>
                      <Text style={styles.timelineDescription}>{item.description}</Text>
                      {item.cost > 0 && (
                        <Text style={styles.timelineCost}>${item.cost.toLocaleString()}</Text>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Add Entry Button */}
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate("AddPart")}
            >
              <Ionicons name="add" size={20} color="#666" style={{ marginRight: 8 }} />
              <Text style={styles.addButtonText}>Add Build Entry</Text>
            </TouchableOpacity>
          </>
        )}

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
  backButton: {
    width: 24,
  },
  title: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "700",
  },
  vehicleSelector: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  selectorLabel: {
    color: "#888",
    fontSize: 12,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0a0a0a",
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  dropdownText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  carCard: {
    backgroundColor: "#0a0a0a",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  carName: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  carSpecs: {
    color: "#a0a0a0",
    fontSize: 14,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  statValue: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    color: "#a0a0a0",
    fontSize: 12,
  },
  timelineSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 16,
    position: "relative",
  },
  timelineLine: {
    position: "absolute",
    left: 20,
    top: 44,
    bottom: -16,
    width: 2,
    backgroundColor: "#1a1a1a",
  },
  timelineDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineDate: {
    color: "#a0a0a0",
    fontSize: 12,
    marginBottom: 6,
  },
  timelineCard: {
    backgroundColor: "#0a0a0a",
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  timelineTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  timelineDescription: {
    color: "#a0a0a0",
    fontSize: 14,
    marginBottom: 6,
  },
  timelineCost: {
    color: "#22c55e",
    fontSize: 14,
    fontWeight: "600",
  },
  addButton: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: "#0a0a0a",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1a1a1a",
    flexDirection: "row",
    justifyContent: "center",
  },
  addButtonText: {
    color: "#666666",
    fontSize: 15,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 60,
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
