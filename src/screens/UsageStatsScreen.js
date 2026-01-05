// src/screens/UsageStatsScreen.js

import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useCarContext } from "../services/carContext";

export default function UsageStatsScreen({ navigation }) {
  const { user, plan, activeCar } = useCarContext();

  // Sample stats - in production, these would come from Firebase
  const stats = {
    totalCars: 1,
    totalParts: 12,
    totalSpent: 8947,
    partsThisMonth: 3,
    spentThisMonth: 1250,
    mostUsedCategory: "Suspension",
    memberSince: user?.metadata?.creationTime 
      ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : "Unknown",
    daysActive: 45,
  };

  const StatCard = ({ icon, value, label, color = "#fff" }) => (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const StatRow = ({ label, value }) => (
    <View style={styles.statRow}>
      <Text style={styles.statRowLabel}>{label}</Text>
      <Text style={styles.statRowValue}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Usage Stats</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Overview Cards */}
        <View style={styles.statsGrid}>
          <StatCard 
            icon="🚗" 
            value={stats.totalCars} 
            label="Vehicles" 
          />
          <StatCard 
            icon="🔧" 
            value={stats.totalParts} 
            label="Parts" 
          />
          <StatCard 
            icon="💰" 
            value={`$${stats.totalSpent.toLocaleString()}`} 
            label="Total Invested" 
            color="#4caf50"
          />
          <StatCard 
            icon="📅" 
            value={stats.daysActive} 
            label="Days Active" 
          />
        </View>

        {/* This Month */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Month</Text>
          <View style={styles.monthCard}>
            <View style={styles.monthStat}>
              <Text style={styles.monthValue}>{stats.partsThisMonth}</Text>
              <Text style={styles.monthLabel}>Parts Added</Text>
            </View>
            <View style={styles.monthDivider} />
            <View style={styles.monthStat}>
              <Text style={[styles.monthValue, { color: "#4caf50" }]}>
                ${stats.spentThisMonth.toLocaleString()}
              </Text>
              <Text style={styles.monthLabel}>Spent</Text>
            </View>
          </View>
        </View>

        {/* Account Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          <View style={styles.detailsCard}>
            <StatRow label="Member Since" value={stats.memberSince} />
            <StatRow label="Current Plan" value={plan?.charAt(0).toUpperCase() + plan?.slice(1) || "Free"} />
            <StatRow label="Email" value={user?.email || "Not set"} />
            <StatRow 
              label="Active Vehicle" 
              value={activeCar ? `${activeCar.year} ${activeCar.make} ${activeCar.model}` : "None"} 
            />
          </View>
        </View>

        {/* Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insights</Text>
          <View style={styles.insightsCard}>
            <View style={styles.insightItem}>
              <Text style={styles.insightIcon}>📊</Text>
              <View style={styles.insightText}>
                <Text style={styles.insightTitle}>Most Popular Category</Text>
                <Text style={styles.insightValue}>{stats.mostUsedCategory}</Text>
              </View>
            </View>
            <View style={styles.insightItem}>
              <Text style={styles.insightIcon}>💡</Text>
              <View style={styles.insightText}>
                <Text style={styles.insightTitle}>Average Part Cost</Text>
                <Text style={styles.insightValue}>
                  ${Math.round(stats.totalSpent / stats.totalParts).toLocaleString()}
                </Text>
              </View>
            </View>
            <View style={styles.insightItem}>
              <Text style={styles.insightIcon}>🎯</Text>
              <View style={styles.insightText}>
                <Text style={styles.insightTitle}>Build Progress</Text>
                <Text style={styles.insightValue}>Great start! Keep building!</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Storage Usage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storage</Text>
          <View style={styles.storageCard}>
            <View style={styles.storageHeader}>
              <Text style={styles.storageUsed}>2.4 MB</Text>
              <Text style={styles.storageTotal}>of 100 MB used</Text>
            </View>
            <View style={styles.storageBar}>
              <View style={[styles.storageBarFill, { width: "2.4%" }]} />
            </View>
            <Text style={styles.storageHint}>
              Photos and data stored in the cloud
            </Text>
          </View>
        </View>

        {/* Export Data */}
        <TouchableOpacity style={styles.exportButton}>
          <Text style={styles.exportIcon}>📤</Text>
          <Text style={styles.exportText}>Export My Data</Text>
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
    paddingTop: 48,
    paddingBottom: 16,
  },
  backButton: {
    width: 60,
  },
  backButtonText: {
    color: "#4a9eff",
    fontSize: 16,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  statCard: {
    width: "50%",
    padding: 4,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    color: "#888",
    fontSize: 14,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  monthCard: {
    backgroundColor: "#181818",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  monthStat: {
    flex: 1,
    alignItems: "center",
  },
  monthValue: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },
  monthLabel: {
    color: "#888",
    fontSize: 14,
  },
  monthDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#282828",
    marginHorizontal: 16,
  },
  detailsCard: {
    backgroundColor: "#181818",
    borderRadius: 16,
    padding: 16,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#282828",
  },
  statRowLabel: {
    color: "#888",
    fontSize: 14,
  },
  statRowValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  insightsCard: {
    backgroundColor: "#181818",
    borderRadius: 16,
    padding: 16,
  },
  insightItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#282828",
  },
  insightIcon: {
    fontSize: 24,
    marginRight: 14,
  },
  insightText: {
    flex: 1,
  },
  insightTitle: {
    color: "#888",
    fontSize: 12,
    marginBottom: 2,
  },
  insightValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  storageCard: {
    backgroundColor: "#181818",
    borderRadius: 16,
    padding: 16,
  },
  storageHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 12,
  },
  storageUsed: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    marginRight: 8,
  },
  storageTotal: {
    color: "#888",
    fontSize: 14,
  },
  storageBar: {
    height: 8,
    backgroundColor: "#282828",
    borderRadius: 4,
    marginBottom: 12,
    overflow: "hidden",
  },
  storageBarFill: {
    height: "100%",
    backgroundColor: "#4a9eff",
    borderRadius: 4,
  },
  storageHint: {
    color: "#666",
    fontSize: 12,
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#181818",
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#282828",
  },
  exportIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  exportText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});


