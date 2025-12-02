// screens/InventoryScreen.js
import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../theme/colors';

// 🔁 Replace these with your real images later
const m3Image = require('../assets/images/inventory-m3.png');
const f150Image = require('../assets/images/inventory-f150.png');
const wrxImage = require('../assets/images/inventory-wrx.png');

const vehicles = [
  {
    id: 'm3',
    name: '2022 BMW M3 Competition',
    parts: 37,
    warranties: 5,
    totalValue: '$12,430',
    image: m3Image,
  },
  {
    id: 'f150',
    name: '2019 Ford F-150',
    parts: 18,
    warranties: 2,
    totalValue: '$7,980',
    image: f150Image,
  },
  {
    id: 'wrx',
    name: '2015 Subaru WRX',
    parts: 9,
    warranties: 1,
    totalValue: '$3,120',
    image: wrxImage,
  },
];

const filterPills = ['All Parts', 'Wheels & Tires', 'Suspension', 'Engine'];

export default function InventoryScreen({ navigation }) {
  const handlePressCard = (vehicle) => {
    navigation.navigate('VehicleDetail', { vehicleId: vehicle.id });
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Big page title */}
      <Text style={styles.pageTitle}>Inventory</Text>

      {/* All Vehicles row */}
      <View style={styles.topRow}>
        <View style={styles.allVehiclesChip}>
          <Text style={styles.allVehiclesText}>All Vehicles</Text>
        </View>
        <Text style={styles.searchIcon}>🔍</Text>
      </View>

      {/* Filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsRow}
      >
        {filterPills.map((label, index) => (
          <View
            key={label}
            style={[
              styles.pill,
              index === 0 && styles.pillActive, // “All Parts” selected
            ]}
          >
            <Text
              style={[
                styles.pillLabel,
                index === 0 && styles.pillLabelActive,
              ]}
            >
              {label}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Vehicle cards */}
      <View style={styles.cardsColumn}>
        {vehicles.map((vehicle) => (
          <TouchableOpacity
            key={vehicle.id}
            style={styles.card}
            onPress={() => handlePressCard(vehicle)}
            activeOpacity={0.85}
          >
            <Image
              source={vehicle.image}
              style={styles.cardImage}
              resizeMode="cover"
            />
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{vehicle.name}</Text>
              <Text style={styles.cardMeta}>
                {vehicle.parts} parts · {vehicle.warranties} active warranties
              </Text>
              <Text style={styles.cardMeta}>
                Total value: {vehicle.totalValue}
              </Text>
            </View>
            <Text style={styles.cardChevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background || '#050509',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  allVehiclesChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#15151B',
  },
  allVehiclesText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  searchIcon: {
    marginLeft: 'auto',
    fontSize: 20,
    color: '#FFFFFF',
  },
  pillsRow: {
    paddingVertical: 8,
  },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#18181F',
    marginRight: 8,
  },
  pillActive: {
    backgroundColor: '#FFFFFF',
  },
  pillLabel: {
    fontSize: 14,
    color: '#A0A4AE',
  },
  pillLabelActive: {
    color: '#050509',
    fontWeight: '600',
  },
  cardsColumn: {
    marginTop: 12,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#141418',
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
  },
  cardImage: {
    width: 90,
    height: 60,
    borderRadius: 14,
    marginRight: 12,
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 13,
    color: '#A0A4AE',
  },
  cardChevron: {
    fontSize: 24,
    color: '#A0A4AE',
    marginLeft: 4,
  },
});
