import React from 'react';
import {
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import SectionCard from '../components/SectionCard';
import { colors } from '../theme/colors';

const CATEGORIES = [
  {
    id: 'wheels',
    name: 'Wheels & Tires',
    stats: { count: 8, value: 4000 },
    items: [
      { id: '1', image: 'https://via.placeholder.com/150?text=Wheel' },
      { id: '2', image: 'https://via.placeholder.com/150?text=Tire' },
    ],
  },
  {
    id: 'engine',
    name: 'Engine',
    stats: { count: 10, value: 5800 },
    items: [
      { id: '3', image: 'https://via.placeholder.com/150?text=Intake' },
      { id: '4', image: 'https://via.placeholder.com/150?text=Turbo' },
    ],
  },
  {
    id: 'interior',
    name: 'Interior',
    stats: { count: 10, value: 3000 },
    items: [
      { id: '5', image: 'https://via.placeholder.com/150?text=Seat' },
      { id: '6', image: 'https://via.placeholder.com/150?text=Wheel' },
    ],
  },
];

export default function VehicleInventoryScreen({ route }) {
  const { vehicle } = route.params;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
        <Text style={styles.breadcrumb}>All Items &gt; {vehicle.name}</Text>

        <View style={styles.searchContainer}>
          <TextInput
            placeholder={`Search ${vehicle.name}`}
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>Folders: 2</Text>
          <Text style={styles.summaryText}>Items: 3</Text>
          <Text style={styles.summaryText}>Total Quantity: 28 units</Text>
          <Text style={styles.summaryValue}>$12,800.00</Text>
        </View>

        {CATEGORIES.map((cat) => (
          <SectionCard key={cat.id} title={cat.name}>
            <View style={styles.categoryRow}>
              {cat.items.map((item) => (
                <View key={item.id} style={styles.itemThumb}>
                  <Image source={{ uri: item.image }} style={styles.itemImage} />
                  <Text style={styles.itemCaption}>
                    {cat.stats.count} | ${cat.stats.value.toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          </SectionCard>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  breadcrumb: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 10,
  },
  searchContainer: {
    backgroundColor: colors.cardSoft,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    color: '#fff',
    fontSize: 14,
  },
  summaryRow: {
    marginBottom: 16,
  },
  summaryText: {
    color: colors.muted,
    fontSize: 12,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  categoryRow: {
    flexDirection: 'row',
  },
  itemThumb: {
    marginRight: 10,
  },
  itemImage: {
    width: 120,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#111',
  },
  itemCaption: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
});
