// src/services/builds.ts
// Build save/load service with tier limits

import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    serverTimestamp,
    setDoc,
    Timestamp,
    where
} from 'firebase/firestore';
import type { TierName } from '../config/entitlements';
import { TIER_LIMITS } from '../config/entitlements';
import type { PartAsset } from '../data/partsCatalog';
import { auth, db } from './firebaseConfig';

export interface SavedBuild {
    id: string;
    carId: string; // Demo car ID or vehicle ID
    userId: string | null; // null for demo builds
    activeParts: PartAsset[]; // Legacy/Scanned parts
    installedParts?: any[]; // New 3D parts (PartService compatible)
    installedPartIds?: string[]; // Index for "Examples" query
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Save a build (enforces tier limits)
 */
export async function saveBuild(
    carId: string,
    activeParts: PartAsset[],
    name: string,
    tier: TierName,
    installedParts: any[] = [] // New optional param
): Promise<string> {
    const user = auth?.currentUser;

    // Demo builds: use local storage for free tier
    if (!user || tier === 'free') {
        return saveDemoBuild(carId, activeParts, name, installedParts);
    }

    if (!db) throw new Error('Firestore not initialized');

    // Check build limit for this car
    const buildsRef = collection(db, 'builds');
    const existingBuilds = await getDocs(
        query(buildsRef, where('userId', '==', user.uid), where('carId', '==', carId))
    );

    const maxBuilds = TIER_LIMITS[tier].maxBuildsPerVehicle;
    if (existingBuilds.size >= maxBuilds) {
        throw new Error(`You can only save ${maxBuilds} build(s) per vehicle on ${tier} tier`);
    }

    const buildId = `${user.uid}_${carId}_${Date.now()}`;
    const installedPartIds = installedParts.map(p => p.partId).filter(Boolean);

    await setDoc(doc(db, 'builds', buildId), {
        carId,
        userId: user.uid,
        activeParts,
        installedParts,
        installedPartIds,
        name,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    return buildId;
}

/**
 * Load builds for a car
 */
export async function loadBuilds(carId: string, tier: TierName): Promise<SavedBuild[]> {
    const user = auth?.currentUser;

    if (!user || tier === 'free') {
        return loadDemoBuilds(carId);
    }

    if (!db) return [];

    const buildsRef = collection(db, 'builds');
    const snapshot = await getDocs(
        query(buildsRef, where('userId', '==', user.uid), where('carId', '==', carId))
    );

    return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            id: doc.id,
            carId: data.carId,
            userId: data.userId,
            activeParts: data.activeParts || [],
            installedParts: data.installedParts || [],
            name: data.name,
            createdAt: (data.createdAt as Timestamp).toDate(),
            updatedAt: (data.updatedAt as Timestamp).toDate(),
        };
    });
}

/**
 * Delete a build
 */
export async function deleteBuild(buildId: string, tier: TierName): Promise<void> {
    const user = auth?.currentUser;

    if (!user || tier === 'free') {
        return deleteDemoBuild(buildId);
    }

    if (!db) return;

    await deleteDoc(doc(db, 'builds', buildId));
}

// DEMO BUILD STORAGE (Local AsyncStorage)
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEMO_BUILDS_KEY = 'demo_builds';

async function saveDemoBuild(
    carId: string,
    activeParts: PartAsset[],
    name: string
): Promise<string> {
    const existingBuilds = await loadDemoBuilds(carId);

    // Free tier limit: 1 build max
    if (existingBuilds.length >= TIER_LIMITS.free.maxBuildsPerVehicle) {
        throw new Error(
            `You can only save ${TIER_LIMITS.free.maxBuildsPerVehicle} build in demo mode`
        );
    }

    const buildId = `demo_${carId}_${Date.now()}`;
    const newBuild: SavedBuild = {
        id: buildId,
        carId,
        userId: null,
        activeParts,
        name,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const allBuilds = [...existingBuilds, newBuild];
    await AsyncStorage.setItem(DEMO_BUILDS_KEY, JSON.stringify(allBuilds));

    return buildId;
}

async function loadDemoBuilds(carId: string): Promise<SavedBuild[]> {
    try {
        const stored = await AsyncStorage.getItem(DEMO_BUILDS_KEY);
        if (!stored) return [];

        const allBuilds: SavedBuild[] = JSON.parse(stored);
        return allBuilds
            .filter((b) => b.carId === carId)
            .map((b) => ({
                ...b,
                createdAt: new Date(b.createdAt),
                updatedAt: new Date(b.updatedAt),
            }));
    } catch {
        return [];
    }
}

async function deleteDemoBuild(buildId: string): Promise<void> {
    try {
        const stored = await AsyncStorage.getItem(DEMO_BUILDS_KEY);
        if (!stored) return;

        const allBuilds: SavedBuild[] = JSON.parse(stored);
        const updated = allBuilds.filter((b) => b.id !== buildId);
        await AsyncStorage.setItem(DEMO_BUILDS_KEY, JSON.stringify(updated));
    } catch {
        // Ignore errors
    }
}
