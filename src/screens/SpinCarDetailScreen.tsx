import { useNavigation, useRoute } from "@react-navigation/native";
import { collection, doc, onSnapshot, orderBy, query, setDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, Pressable, Text, View } from "react-native";
import { db } from "../services/firebaseConfig";

import { Firestore } from "firebase/firestore";

export default function SpinCarDetailScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const params = route.params as { carId: string } | undefined;
    const carId = params?.carId;
    const fn = getFunctions();

    const [car, setCar] = useState<any>(null);
    const [angles, setAngles] = useState<any[]>([]);

    useEffect(() => {
        if (!carId) return;
        const firestoreDb = db as unknown as Firestore;
        const unsub = onSnapshot(doc(firestoreDb, "cars", carId), (d) => setCar({ id: d.id, ...d.data() }));
        const q = query(collection(firestoreDb, "cars", carId, "angles"), orderBy("angleIndex", "asc"));
        const unsub2 = onSnapshot(q, (snap) => setAngles(snap.docs.map(x => ({ id: x.id, ...x.data() }))));
        return () => { unsub(); unsub2(); };
    }, [carId]);

    const queueSeg = async () => {
        try {
            const call = httpsCallable(fn, "queueSegmentCar");
            const res: any = await call({ carId });
            Alert.alert("Queued", `Job: ${res.data.jobId}`);
        } catch (e: any) {
            Alert.alert("Error", e?.message || String(e));
        }
    };

    const createBuild = async () => {
        // Minimal build doc
        const buildId = `${carId}-${Date.now()}`;
        const firestoreDb = db as unknown as Firestore;
        await setDoc(doc(firestoreDb, "builds", buildId), {
            ownerId: "demo",
            carId,
            appliedParts: [],
            status: "idle",
            createdAt: new Date(),
            updatedAt: new Date()
        });
        // @ts-ignore
        navigation.navigate("SpinBuild", { buildId });
    };

    return (
        <View style={{ flex: 1, padding: 16, gap: 12 }}>
            <Text style={{ fontSize: 20, fontWeight: "700" }}>{car?.make} {car?.model}</Text>
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
