import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getFunctions } from "firebase/functions";
import React, { useState } from "react";
import { FlatList, Pressable, Text, TouchableOpacity, View } from "react-native";

// Isolate header for cleaner diff
const Header = ({ title, onBack }: { title: string; onBack: () => void }) => (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
        <TouchableOpacity onPress={onBack} style={{ padding: 8, marginRight: 8 }}>
            <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "700" }}>{title}</Text>
    </View>
);

export default function SpinCarDetailScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const params = route.params as { carId: string } | undefined;
    const carId = params?.carId;
    const fn = getFunctions();

    const [car, setCar] = useState<any>(null);
    // ... existing state ...

    return (
        <View style={{ flex: 1, padding: 16, paddingTop: 60, gap: 12 }}>
            <Header
                title={car ? `${car.make} ${car.model}` : "Loading..."}
                onBack={() => navigation.goBack()}
            />
            <Text style={{ opacity: 0.7 }}>Angles: {angles.length}/10</Text>

            <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable onPress={queueSeg} style={{ padding: 12, borderWidth: 1, borderRadius: 12, backgroundColor: '#eee' }}>
                    <Text>Run Segmentation</Text>
                </Pressable>
                <Pressable onPress={createBuild} style={{ padding: 12, borderWidth: 1, borderRadius: 12, backgroundColor: '#eee' }}>
                    <Text>Create Build</Text>
                </Pressable>
            </View>

            <Text style={{ marginTop: 10, fontWeight: "700" }}>Angle Frames</Text>
            <FlatList
                data={angles}
                keyExtractor={(i) => i.id}
                renderItem={({ item }) => (
                    <View style={{ padding: 10, borderWidth: 1, borderRadius: 12, marginBottom: 10, borderColor: '#ccc' }}>
                        <Text>Angle {item.angleIndex}</Text>
                        <Text style={{ opacity: 0.7 }}>mask: {item.carMaskUrl ? "yes" : "no"}</Text>
                    </View>
                )}
            />
        </View>
    );
}
