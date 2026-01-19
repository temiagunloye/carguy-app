import { useRoute } from "@react-navigation/native";
import { collection, doc, onSnapshot as onSnap2, onSnapshot, updateDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, Text, View } from "react-native";
import { SpinViewer } from "../components/SpinViewer";
import { db } from "../services/firebaseConfig";

import { Firestore } from "firebase/firestore";

export default function SpinBuildScreen() {
    const route = useRoute();
    const { buildId } = route.params as { buildId: string };
    const fn = getFunctions();

    const [build, setBuild] = useState<any>(null);
    const [parts, setParts] = useState<any[]>([]);

    useEffect(() => {
        if (!buildId) return;
        const firestoreDb = db as unknown as Firestore;
        const unsub = onSnapshot(doc(firestoreDb, "builds", buildId), (d) => setBuild({ id: d.id, ...d.data() }));
        const unsub2 = onSnap2(collection(firestoreDb, "parts"), (snap) => setParts(snap.docs.map(x => ({ id: x.id, ...x.data() }))));
        return () => { unsub(); unsub2(); };
    }, [buildId]);

    const frameUrls = useMemo(() => build?.resultFrames?.frameUrls || [], [build]);

    const addPaint = async () => {
        const color = "#2f6fed";
        const firestoreDb = db as unknown as Firestore;
        await updateDoc(doc(firestoreDb, "builds", buildId), {
            appliedParts: [
                ...(build?.appliedParts || []).filter((p: any) => (p.category || "").toLowerCase() !== "paint"),
                { category: "paint", params: { color } }
            ],
            updatedAt: new Date()
        });
    };

    const addPart = async (partId: string, category: string) => {
        const firestoreDb = db as unknown as Firestore;
        await updateDoc(doc(firestoreDb, "builds", buildId), {
            appliedParts: [
                ...(build?.appliedParts || []),
                { partId, category, params: { scale: 0.32 } }
            ],
            updatedAt: new Date()
        });
    };

    const renderBuild = async () => {
        try {
            const call = httpsCallable(fn, "queueBuildFrames");
            const res: any = await call({ buildId });
            Alert.alert("Queued", `Job: ${res.data.jobId}`);
        } catch (e: any) {
            Alert.alert("Error", e?.message || String(e));
        }
    };

    return (
        <View style={{ flex: 1, padding: 16, gap: 12 }}>
            <Text style={{ fontSize: 20, fontWeight: "700" }}>Build {buildId}</Text>
            <Text style={{ opacity: 0.7 }}>Status: {build?.status || "unknown"}</Text>

            <SpinViewer frameUrls={frameUrls} width={360} height={240} />

            <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
                <Pressable onPress={addPaint} style={{ padding: 12, borderWidth: 1, borderRadius: 12, backgroundColor: '#eee' }}>
                    <Text>Add Paint</Text>
                </Pressable>
                <Pressable onPress={renderBuild} style={{ padding: 12, borderWidth: 1, borderRadius: 12, backgroundColor: '#eee' }}>
                    <Text>Render Frames</Text>
                </Pressable>
            </View>

            <Text style={{ marginTop: 10, fontWeight: "700" }}>Parts Catalog</Text>
            <FlatList
                data={parts}
                keyExtractor={(i) => i.id}
                renderItem={({ item }) => (
                    <View style={{ padding: 10, borderWidth: 1, borderRadius: 12, marginBottom: 10, borderColor: '#ccc' }}>
                        <Text style={{ fontWeight: "600" }}>{item.name || item.id}</Text>
                        <Text style={{ opacity: 0.7 }}>{item.category}</Text>
                        <Pressable
                            onPress={() => addPart(item.id, item.category || "spoiler")}
                            style={{ padding: 10, borderWidth: 1, borderRadius: 12, marginTop: 8, alignSelf: "flex-start", backgroundColor: '#ddd' }}
                        >
                            <Text>Apply</Text>
                        </Pressable>
                    </View>
                )}
            />
        </View>
    );
}
