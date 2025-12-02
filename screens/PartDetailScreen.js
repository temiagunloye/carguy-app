// screens/PartDetailScreen.js
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { colors } from '../theme/colors';

export default function PartDetailScreen({ navigation, route }) {
  // In a real app you’d use route.params.partId to load data
  const title = route?.params?.title || 'Valvetronic Exhaust';

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Mini header */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backChevron}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.topBarText}>All Items</Text>
          <View style={{ width: 20 }} />
        </View>

        {/* Title */}
        <Text style={styles.title}>{title}</Text>

        {/* Quantity / Price row */}
        <View style={styles.rowCards}>
          <View style={styles.smallCard}>
            <Text style={styles.smallLabel}>Quantity • units</Text>
            <Text style={styles.smallValue}>1</Text>
          </View>
          <View style={styles.smallCard}>
            <Text style={styles.smallLabel}>Price • per unit</Text>
            <Text style={styles.smallValue}>—</Text>
          </View>
        </View>

        {/* Product Information */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Product Information</Text>
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>
              Add product photo (JPG, PNG, HEIC)
            </Text>
          </View>
          <View style={styles.divider} />
          <Text style={styles.fieldLabel}>Tags</Text>
          <View style={styles.fieldBox} />
          <Text style={styles.fieldLabel}>Notes</Text>
          <View style={styles.fieldBoxTall} />
        </View>

        {/* Custom Fields */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Custom Fields</Text>
            <View style={styles.addFieldButton}>
              <Text style={styles.addFieldButtonText}>+</Text>
            </View>
          </View>

          <View style={styles.twoColRow}>
            <View style={styles.fieldColumn}>
              <Text style={styles.fieldLabel}>Supplier</Text>
              <View style={styles.fieldUnderline} />
            </View>
            <View style={styles.fieldColumn}>
              <Text style={styles.fieldLabel}>Installer</Text>
              <View style={styles.fieldUnderline} />
            </View>
          </View>

          <View style={styles.twoColRow}>
            <View style={styles.fieldColumn}>
              <Text style={styles.fieldLabel}>Purchase Price</Text>
              <View style={styles.fieldUnderline} />
            </View>
            <View style={styles.fieldColumn}>
              <Text style={styles.fieldLabel}>Warranty PDF</Text>
              <View style={styles.fieldUnderline} />
            </View>
          </View>
        </View>

        {/* QR & Barcode */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>QR & Barcode</Text>
          <Text style={styles.helperText}>
            You can use QR codes or barcodes to track the inventory of your
            products or assets.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backChevron: {
    color: colors.textPrimary,
    fontSize: 26,
    marginRight: 8,
  },
  topBarText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 18,
  },
  rowCards: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  smallCard: {
    flex: 1,
    backgroundColor: colors.cardElevated,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  smallLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 6,
  },
  smallValue: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: colors.cardElevated,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  imagePlaceholder: {
    height: 130,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  placeholderText: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 10,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 4,
  },
  fieldBox: {
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.card,
    marginBottom: 10,
  },
  fieldBoxTall: {
    height: 70,
    borderRadius: 10,
    backgroundColor: colors.card,
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 16,
  },
  fieldColumn: {
    flex: 1,
  },
  fieldUnderline: {
    height: 1,
    backgroundColor: colors.divider,
    marginTop: 8,
  },
  addFieldButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addFieldButtonText: {
    color: colors.textPrimary,
    fontSize: 18,
    marginTop: -2,
  },
  helperText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
});
