import React from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function VehicleDetailScreen({ route, navigation }) {
  const { vehicle } = route.params;

  return (
    <ScrollView style={styles.container}>
      {/* Vehicle Image */}
      <Image source={{ uri: vehicle.image }} style={styles.image} />

      {/* Vehicle Info Section */}
      <View style={styles.infoContainer}>
        <Text style={styles.title}>{vehicle.name}</Text>
        <Text style={styles.subtitle}>{vehicle.model}</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Year:</Text>
          <Text style={styles.value}>{vehicle.year}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Mileage:</Text>
          <Text style={styles.value}>{vehicle.mileage} miles</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Price:</Text>
          <Text style={styles.price}>${vehicle.price}</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionHeader}>Description</Text>
        <Text style={styles.description}>{vehicle.description}</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Back to Inventory</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050608",
  },

  image: {
    width: "100%",
    height: 250,
    resizeMode: "cover",
  },

  infoContainer: {
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },

  subtitle: {
    fontSize: 18,
    color: "#ccc",
    marginBottom: 12,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 6,
  },

  label: {
    fontSize: 16,
    color: "#aaa",
  },

  value: {
    fontSize: 16,
    color: "#fff",
  },

  price: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#00e676",
  },

  divider: {
    height: 1,
    backgroundColor: "#333",
    marginVertical: 16,
  },

  sectionHeader: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },

  description: {
    fontSize: 15,
    color: "#ccc",
    lineHeight: 20,
    marginBottom: 20,
  },

  button: {
    backgroundColor: "#1b1c1f",
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 10,
    marginTop: 20,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});


