// src/screens/PartDetailScreen.js

import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
} from "react-native";
// Firebase imports removed - will be loaded dynamically when needed
import { useCarContext } from "../services/carContext";

const STATUS_COLORS = {
  installed: "#22c55e",
  pending: "#f59e0b",
  in_storage: "#6b7280",
  sold: "#ef4444",
};

const STATUS_LABELS = {
  installed: "Installed",
  pending: "Pending Install",
  in_storage: "In Storage",
  sold: "Sold/Removed",
};

const CATEGORY_ICONS = {
  wheels: "🛞",
  suspension: "🔩",
  exhaust: "💨",
  exterior: "🚗",
  interior: "🪑",
  engine: "🔧",
  performance: "⚡",
  electronics: "💡",
  maintenance: "🛠️",
  other: "📦",
};

export default function PartDetailScreen({ navigation, route }) {
  const { user, demoMode, activeCar, setActiveCarState } = useCarContext();
  const part = route?.params?.part;
  const car = route?.params?.car || activeCar;
  const [deleting, setDeleting] = useState(false);

  if (!part) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Part not found</Text>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      "Delete Part",
      `Are you sure you want to delete "${part.name}" from your inventory?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);

              // Handle demo mode
              if (demoMode) {
                const updatedParts = (car.parts || []).filter(p => p.id !== part.id);
                const updatedCar = {
                  ...car,
                  parts: updatedParts,
                };
                setActiveCarState(updatedCar);
                Alert.alert("Deleted", "Part removed from inventory.");
                navigation.goBack();
                return;
              }

              // Firebase mode
              if (!user || !user.uid || !car) {
                Alert.alert("Error", "Cannot delete part.");
                return;
              }

              const { doc, deleteDoc } = await import("firebase/firestore");
              const { db } = await import("../services/firebaseConfig");
              if (db) {
                const partRef = doc(db, "users", user.uid, "cars", car.id, "parts", part.id);
                await deleteDoc(partRef);
              }
              Alert.alert("Deleted", "Part removed from inventory.");
              navigation.goBack();
            } catch (e) {
              console.error("Delete error:", e);
              Alert.alert("Error", "Failed to delete part.");
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    navigation.navigate("AddPart", { 
      partToEdit: part,
      car: car,
    });
  };

  const handleOpenLink = () => {
    if (part.productLink) {
      Linking.openURL(part.productLink).catch(() => {
        Alert.alert("Error", "Could not open link.");
      });
    }
  };

  const InfoRow = ({ label, value, icon }) => {
    if (!value) return null;
    return (
      <View style={styles.infoRow}>
        {icon && <Text style={styles.infoIcon}>{icon}</Text>}
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>{label}</Text>
          <Text style={styles.infoValue}>{value}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Part Details</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Part Image */}
        {part.imageUrl ? (
          <Image source={{ uri: part.imageUrl }} style={styles.partImage} />
        ) : (
          <View style={styles.partImagePlaceholder}>
            <Text style={styles.partImageIcon}>
              {CATEGORY_ICONS[part.category] || "📦"}
            </Text>
            <Text style={styles.partImageText}>No Image</Text>
          </View>
        )}

        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[part.status] }]}>
            <Text style={styles.statusBadgeText}>{STATUS_LABELS[part.status]}</Text>
          </View>
        </View>

        {/* Main Info */}
        <View style={styles.mainInfo}>
          <Text style={styles.partName}>{part.name}</Text>
          {part.brand && <Text style={styles.partBrand}>{part.brand}</Text>}
          {part.partNumber && (
            <Text style={styles.partNumber}>Part # {part.partNumber}</Text>
          )}
        </View>

        {/* Cost Summary */}
        <View style={styles.costCard}>
          <Text style={styles.sectionTitle}>💰 Investment</Text>
          <View style={styles.costGrid}>
            <View style={styles.costItem}>
              <Text style={styles.costLabel}>Part Cost</Text>
              <Text style={styles.costValue}>${part.price || 0}</Text>
            </View>
            <View style={styles.costItem}>
              <Text style={styles.costLabel}>Labor</Text>
              <Text style={styles.costValue}>${part.installCost || 0}</Text>
            </View>
            <View style={[styles.costItem, styles.costItemTotal]}>
              <Text style={styles.costLabelTotal}>Total</Text>
              <Text style={styles.costValueTotal}>${part.totalCost || 0}</Text>
            </View>
          </View>
        </View>

        {/* Purchase Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛒 Purchase Info</Text>
          <View style={styles.infoCard}>
            <InfoRow label="Purchase Date" value={part.purchaseDate} icon="📅" />
            <InfoRow label="Purchased From" value={part.purchasedFrom} icon="🏪" />
            <InfoRow label="Order Number" value={part.orderNumber} icon="📝" />
            {part.productLink && (
              <TouchableOpacity style={styles.linkRow} onPress={handleOpenLink}>
                <Text style={styles.linkIcon}>🔗</Text>
                <Text style={styles.linkText}>View Product Link</Text>
                <Text style={styles.linkChevron}>→</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Installation Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔧 Installation</Text>
          <View style={styles.infoCard}>
            <InfoRow label="Install Date" value={part.installDate} icon="📅" />
            <InfoRow label="Installed By" value={part.installer} icon="👤" />
            <InfoRow 
              label="Mileage at Install" 
              value={part.mileageAtInstall ? `${part.mileageAtInstall.toLocaleString()} mi` : null} 
              icon="🛣️" 
            />
          </View>
        </View>

        {/* Warranty Info */}
        {part.hasWarranty && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🛡️ Warranty</Text>
            <View style={[styles.infoCard, styles.warrantyCard]}>
              <View style={styles.warrantyHeader}>
                <Text style={styles.warrantyActive}>✓ Active Warranty</Text>
              </View>
              <InfoRow label="Expires" value={part.warrantyExpires} icon="⏰" />
              {part.warrantyNotes && (
                <View style={styles.warrantyNotes}>
                  <Text style={styles.warrantyNotesLabel}>Details</Text>
                  <Text style={styles.warrantyNotesText}>{part.warrantyNotes}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Notes */}
        {part.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Notes</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{part.notes}</Text>
            </View>
          </View>
        )}

        {/* Car Reference */}
        {car && (
          <View style={styles.carRef}>
            <Text style={styles.carRefLabel}>Installed on</Text>
            <Text style={styles.carRefName}>
              {car.year} {car.make} {car.model}
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleEdit}
          >
            <Text style={styles.actionButtonIcon}>✏️</Text>
            <Text style={styles.actionButtonText}>Edit Part</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate("TryMods", { preselectedPart: part })}
          >
            <Text style={styles.actionButtonIcon}>🔮</Text>
            <Text style={styles.actionButtonText}>Visualize</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.actionButtonDanger]}
            onPress={handleDelete}
          >
            <Text style={styles.actionButtonIcon}>🗑️</Text>
            <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>Delete</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  backButton: {
    width: 70,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  deleteButton: {
    width: 70,
    alignItems: "flex-end",
  },
  deleteButtonText: {
    fontSize: 20,
  },
  partImage: {
    width: "100%",
    height: 280,
    resizeMode: "cover",
  },
  partImagePlaceholder: {
    width: "100%",
    height: 280,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
  },
  partImageIcon: {
    fontSize: 64,
    marginBottom: 8,
  },
  partImageText: {
    color: "#666",
    fontSize: 14,
  },
  statusContainer: {
    position: "absolute",
    top: 240,
    right: 16,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusBadgeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  mainInfo: {
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  partName: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  partBrand: {
    color: "#4a9eff",
    fontSize: 16,
    marginTop: 4,
  },
  partNumber: {
    color: "#666",
    fontSize: 13,
    marginTop: 4,
  },
  costCard: {
    margin: 16,
    backgroundColor: "#111",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#22c55e30",
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
  },
  costGrid: {
    flexDirection: "row",
  },
  costItem: {
    flex: 1,
    alignItems: "center",
  },
  costItemTotal: {
    borderLeftWidth: 1,
    borderLeftColor: "#222",
    paddingLeft: 16,
  },
  costLabel: {
    color: "#888",
    fontSize: 12,
    marginBottom: 4,
  },
  costValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  costLabelTotal: {
    color: "#22c55e",
    fontSize: 12,
    marginBottom: 4,
  },
  costValueTotal: {
    color: "#22c55e",
    fontSize: 22,
    fontWeight: "700",
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: "#111",
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 12,
    width: 24,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    color: "#888",
    fontSize: 12,
  },
  infoValue: {
    color: "#fff",
    fontSize: 15,
    marginTop: 2,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#4a9eff10",
    borderRadius: 10,
    margin: 8,
  },
  linkIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  linkText: {
    color: "#4a9eff",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  linkChevron: {
    color: "#4a9eff",
    fontSize: 16,
  },
  warrantyCard: {
    borderColor: "#22c55e30",
  },
  warrantyHeader: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  warrantyActive: {
    color: "#22c55e",
    fontSize: 14,
    fontWeight: "600",
  },
  warrantyNotes: {
    padding: 12,
  },
  warrantyNotesLabel: {
    color: "#888",
    fontSize: 12,
    marginBottom: 4,
  },
  warrantyNotesText: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 20,
  },
  notesCard: {
    backgroundColor: "#111",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  notesText: {
    color: "#ccc",
    fontSize: 14,
    lineHeight: 22,
  },
  carRef: {
    margin: 16,
    padding: 16,
    backgroundColor: "#111",
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#4a9eff",
  },
  carRefLabel: {
    color: "#888",
    fontSize: 12,
  },
  carRefName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 4,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222",
  },
  actionButtonDanger: {
    borderColor: "#ef444430",
    backgroundColor: "#ef444410",
  },
  actionButtonIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  actionButtonTextDanger: {
    color: "#ef4444",
  },
});

