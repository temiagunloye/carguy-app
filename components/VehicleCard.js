import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme/colors';

export default function VehicleCard({ vehicle, onPress }) {
  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.8} onPress={onPress}>
      <View style={styles.row}>
        <Image style={styles.image} source={{ uri: vehicle.image }} />
        <View style={styles.info}>
          <Text style={styles.title}>{vehicle.name}</Text>
          <Text style={styles.subtitle}>
            {vehicle.partsCount} parts · {vehicle.warranties} active warranties
          </Text>
          <Text style={styles.value}>
            Total value: ${vehicle.totalValue.toLocaleString()}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardSoft,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  image: {
    width: 90,
    height: 54,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#111',
  },
  info: { flex: 1 },
  title: { color: '#fff', fontSize: 16, fontWeight: '600' },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 4 },
  value: { color: '#fff', fontSize: 13, marginTop: 4 },
});
