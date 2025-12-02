// screens/ShopScreen.js
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import PartToggleRow from '../components/PartToggleRow';

const carImage = require('../assets/images/porshe.png');
const wheelsImg = require('../assets/images/wheels.png');
const frontLipImg = require('../assets/images/frontlip.png');
const loweringImg = require('../assets/images/lowering.png');
const catbackImg = require('../assets/images/catback.png');

export default function ShopScreen() {
  const [activeParts, setActiveParts] = useState({
    wheels: true,
    frontLip: true,
    lowering: false,
    catback: true,
  });

  const togglePart = (key) => {
    setActiveParts((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Top title (Nav-like) */}
      <Text style={styles.navTitle}>Car App</Text>

      {/* Big section title */}
      <Text style={styles.mainTitle}>THE SHOP</Text>

      {/* Current build card */}
      <View style={styles.currentBuildCard}>
        <Text style={styles.currentBuildLabel}>CURRENT BUILD:</Text>
        <Text style={styles.currentBuildName}>Blueblue Subie</Text>
      </View>

      {/* Main row: Live Visualizer + Wheels list */}
      <View style={styles.topRow}>
        {/* Live Visualizer */}
        <View style={styles.visualizerCard}>
          <Text style={styles.sectionTitle}>Live Visualizer</Text>
          <View style={styles.visualizerInner}>
            <Image source={carImage} style={styles.carImage} />
          </View>
        </View>

        {/* Wheels / parts toggles */}
        <View style={styles.wheelsCard}>
          <Text style={styles.sectionTitle}>Wheels</Text>

          <PartToggleRow
            icon={wheelsImg}
            title="Wheels"
            subtitle='Forged 19"'
            value={activeParts.wheels}
            onToggle={() => togglePart('wheels')}
          />

          <PartToggleRow
            icon={frontLipImg}
            title="Front Lip"
            subtitle="Carbon"
            value={activeParts.frontLip}
            onToggle={() => togglePart('frontLip')}
          />

          <PartToggleRow
            icon={loweringImg}
            title="Lowering"
            subtitle="Springs"
            value={activeParts.lowering}
            onToggle={() => togglePart('lowering')}
          />

          <PartToggleRow
            icon={catbackImg}
            title="Catback"
            subtitle="Exhaust"
            value={activeParts.catback}
            onToggle={() => togglePart('catback')}
          />
        </View>
      </View>

      {/* Active Parts pill row */}
      <View style={styles.activePartsCard}>
        <Text style={styles.sectionTitle}>Active Parts</Text>
        <View style={styles.activePartsRow}>
          <View style={styles.activePartPill}>
            <Image source={wheelsImg} style={styles.activePartImage} />
          </View>
          <View style={styles.activePartPill}>
            <Image source={frontLipImg} style={styles.activePartImage} />
          </View>
          <View style={styles.activePartPill}>
            <Image source={catbackImg} style={styles.activePartImage} />
          </View>
        </View>
      </View>

      {/* Button */}
      <View style={styles.buttonContainer}>
        <View style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>ADD ALL ACTIVE TO BUILD</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#050608',
  },
  content: {
    paddingBottom: 32,
  },
  navTitle: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '500',
  },
  mainTitle: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 28,
    letterSpacing: 4,
    color: '#ffffff',
    fontWeight: '800',
  },
  currentBuildCard: {
    marginTop: 24,
    marginHorizontal: 24,
    backgroundColor: '#111216',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  currentBuildLabel: {
    fontSize: 13,
    color: '#72757e',
    letterSpacing: 1.5,
  },
  currentBuildName: {
    marginTop: 6,
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '700',
  },
  topRow: {
    flexDirection: 'row',
    marginTop: 24,
    marginHorizontal: 24,
  },
  visualizerCard: {
    flex: 1.1,
    marginRight: 12,
    backgroundColor: '#0b0c10',
    borderRadius: 30,
    padding: 18,
  },
  wheelsCard: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: '#0b0c10',
    borderRadius: 30,
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '700',
    marginBottom: 16,
  },
  visualizerInner: {
    flex: 1,
    borderRadius: 26,
    backgroundColor: '#07080c',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  carImage: {
    width: '100%',
    height: 190, // slightly smaller so it fits better
    resizeMode: 'contain',
    borderRadius: 22,
  },
  activePartsCard: {
    marginTop: 24,
    marginHorizontal: 24,
    backgroundColor: '#0b0c10',
    borderRadius: 30,
    paddingVertical: 18,
    paddingHorizontal: 18,
  },
  activePartsRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
  activePartPill: {
    width: 80,
    height: 80,
    borderRadius: 26,
    backgroundColor: '#101218',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activePartImage: {
    width: 64,
    height: 64,
    borderRadius: 22,
    resizeMode: 'cover',
  },
  buttonContainer: {
    marginTop: 24,
    marginHorizontal: 24,
  },
  primaryButton: {
    backgroundColor: '#ffffff',
    borderRadius: 32,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#050608',
  },
});
