// screens/HomeScreen.js
import React from 'react';
import {
    Alert,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../Backend/firebase'; // <-- path matches your folder structure

const heroImage = require('../assets/images/home-hero.png');

export default function HomeScreen({ navigation }) {
  // 🔧 Test helper: write a dummy doc to Firestore
  const handleTestWrite = async () => {
    try {
      await addDoc(collection(db, 'testEvents'), {
        createdAt: serverTimestamp(),
        screen: 'HomeScreen',
        note: 'Demo write from the app',
      });

      Alert.alert('Success', 'Test document saved to Firestore ✅');
    } catch (error) {
      console.error('Error writing test document:', error);
      Alert.alert('Error', error.message || 'Failed to write test document');
    }
  };

  return (
    <View style={styles.container}>
      {/* Hero card */}
      <View style={styles.heroCard}>
        <Image source={heroImage} style={styles.heroImage} />

        <View style={styles.heroTextBlock}>
          <Text style={styles.heroTitle}>2022 BMW M3 Competition</Text>
          <Text style={styles.heroSubtitle}>
            Brooklyn Grey • AWD • 12,430 miles
          </Text>
        </View>

        <View style={styles.heroButtonsRow}>
          <TouchableOpacity style={styles.heroButton}>
            <Text style={styles.heroButtonText}>Scan My Car</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.heroButton}>
            <Text style={styles.heroButtonText}>Try Mods</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('InventoryTab')}
        >
          <Text style={styles.rowLabel}>View Inventory</Text>
          <Text style={styles.rowChevron}>{'>'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowLabel}>See Build History</Text>
          <Text style={styles.rowChevron}>{'>'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowLabel}>Add New Part</Text>
          <Text style={styles.rowChevron}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      {/* Debug / dev tools */}
      <View style={styles.debugSection}>
        <TouchableOpacity style={styles.debugButton} onPress={handleTestWrite}>
          <Text style={styles.debugButtonText}>Test Firestore Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const CARD_BG = '#101216';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050608',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  heroCard: {
    backgroundColor: CARD_BG,
    borderRadius: 28,
    padding: 18,
    marginBottom: 24,
  },
  heroImage: {
    width: '100%',
    height: 190, // smaller so it fits better
    resizeMode: 'contain',
    borderRadius: 24,
    marginBottom: 12,
  },
  heroTextBlock: {
    marginBottom: 16,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  heroSubtitle: {
    color: '#b2b6bf',
    fontSize: 14,
  },
  heroButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  heroButton: {
    flex: 1,
    backgroundColor: '#171a20',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginTop: 12,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomColor: '#1a1c22',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: {
    color: '#ffffff',
    fontSize: 16,
    flex: 1,
  },
  rowChevron: {
    color: '#777b83',
    fontSize: 18,
  },
  debugSection: {
    marginTop: 24,
  },
  debugButton: {
    backgroundColor: '#263238',
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  debugButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
