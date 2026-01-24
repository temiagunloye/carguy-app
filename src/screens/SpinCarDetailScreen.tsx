import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { collection, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, Text, TouchableOpacity, View } from "react-native";
import { getDb } from "../services/firebaseConfig";

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
    const db = getDb();
    const functions = getFunctions();

    const [car, setCar] = useState<any>(null);
    const [angles, setAngles] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!carId || !db) return;

        // Subscribe to car doc
        const unsubCar = onSnapshot(doc(db, "cars", carId), (snap) => {
            if (snap.exists()) {
                setCar({ id: snap.id, ...snap.data() });
            } else {
                setCar(null);
            }
        });

        // Subscribe to angles subcollection
        const q = query(collection(db, "cars", carId, "angles"), orderBy("angleIndex"));
        const unsubAngles = onSnapshot(q, (snap) => {
            setAngles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => {
            unsubCar();
            unsubAngles();
        };
    }, [carId, db]);

    const queueSeg = async () => {
        if (!carId) return;
        setLoading(true);
        try {
            const queueSegmentCar = httpsCallable(functions, 'queueSegmentCar');
            await queueSegmentCar({ carId });
            Alert.alert("Success", "Segmentation job queued!");
        } catch (err: any) {
            Alert.alert("Error", err.message);
        } finally {
            setLoading(false);
        }
    };

    const createBuild = async () => {
        if (!carId) return;
        setLoading(true);
        // Quick test: generate a random build ID for this car
        const buildId = `test_build_${Date.now()}`;
        try {
            // 1. Create build doc first (usually done by client, but for test we do here or let func do it?)
            // The func queueBuildFrames expects the build doc to exist with appliedParts.
            // We'll just alert for now as this requires more setup (selecting parts).
            Alert.alert("Info", "To test build generation, please use the 'Test Swapping' steps in the guide to create a build in Firestore first.");
        } catch (err: any) {
            Alert.alert("Error", err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!carId) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>No Car ID provided</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, padding: 16, paddingTop: 60, gap: 12, backgroundColor: '#fff' }}>
            <Header
                title={car ? `${car.make || ''} ${car.model || 'Unknown'}` : "Loading..."}
                onBack={() => navigation.goBack()}
            />

            <Text style={{ opacity: 0.7 }}>Angles: {angles.length}/10</Text>
            {loading && <ActivityIndicator />}

            <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable onPress={queueSeg} style={{ padding: 12, borderWidth: 1, borderRadius: 12, backgroundColor: '#f0f0f0', flex: 1, alignItems: 'center' }}>
                    <Text style={{ fontWeight: '600' }}>Run Segmentation</Text>
                </Pressable>
                <Pressable onPress={createBuild} style={{ padding: 12, borderWidth: 1, borderRadius: 12, backgroundColor: '#f0f0f0', flex: 1, alignItems: 'center' }}>
                    <Text style={{ fontWeight: '600' }}>Create Build</Text>
                </Pressable>
            </View>

            <Text style={{ marginTop: 10, fontWeight: "700", fontSize: 16 }}>Angle Frames</Text>
            <FlatList
                data={angles}
                keyExtractor={(i) => i.id || Math.random().toString()}
                renderItem={({ item }) => (
                    <View style={{ padding: 12, borderWidth: 1, borderRadius: 8, marginBottom: 8, borderColor: '#eee', backgroundColor: '#fafafa' }}>
                        <Text style={{ fontWeight: '600' }}>Angle {item.angleIndex}</Text>
                        <Text style={{ opacity: 0.7, fontSize: 12 }}>Mask: {item.carMaskUrl ? "✅ Ready" : "❌ Missing"}</Text>
                        {item.keypoints?.wheels && (
                            <Text style={{ opacity: 0.7, fontSize: 12 }}>Wheels: {item.keypoints.wheels.length} detected</Text>
                        )}
                    </View>
                )}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        </View>
    );
}
