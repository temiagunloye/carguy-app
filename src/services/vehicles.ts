// src/services/vehicles.ts
// Vehicle management service

import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    serverTimestamp,
    setDoc,
    Timestamp,
    where,
} from 'firebase/firestore';
import type { TierName } from '../config/entitlements';
import { TIER_LIMITS } from '../config/entitlements';
import { auth, db } from './firebaseConfig';

export interface Vehicle {
    id: string;
    ownerUid: string;
    displayName: string;
    year?: number;
    make?: string;
    model?: string;
    photoSetId?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateVehicleData {
    displayName: string;
    year?: number;
    make?: string;
    model?: string;
}

/**
 * Create a new vehicle (Pro/Premium only)
 */
export async function createVehicle(data: CreateVehicleData): Promise<string> {
    const user = auth?.currentUser;
    if (!user || !db) {
        throw new Error('Authentication required');
    }

    // Check tier and vehicle count
    const vehiclesRef = collection(db, 'vehicles');
    const existingVehicles = await getDocs(
        query(vehiclesRef, where('ownerUid', '==', user.uid))
    );

    // Get user tier to check limits
    const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', user.uid)));
    const userData = userDoc.docs[0]?.data();
    const tier = (userData?.tier || 'free') as TierName;
    const extraSlots = userData?.extraVehicleSlots || 0;

    const maxVehicles = TIER_LIMITS[tier].maxVehicles + extraSlots;

    if (existingVehicles.size >= maxVehicles) {
        throw new Error(`Vehicle limit reached. ${tier.toUpperCase()} tier allows ${maxVehicles} vehicle(s).`);
    }

    // Create vehicle
    const vehicleId = `vehicle_${user.uid}_${Date.now()}`;
    await setDoc(doc(db, 'vehicles', vehicleId), {
        ownerUid: user.uid,
        displayName: data.displayName,
        year: data.year,
        make: data.make,
        model: data.model,
        photoSetId: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    return vehicleId;
}

/**
 * Get user's vehicles
 */
export async function getUserVehicles(): Promise<Vehicle[]> {
    const user = auth?.currentUser;
    if (!user || !db) return [];

    const vehiclesRef = collection(db, 'vehicles');
    const snapshot = await getDocs(
        query(vehiclesRef, where('ownerUid', '==', user.uid))
    );

    return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            id: doc.id,
            ownerUid: data.ownerUid,
            displayName: data.displayName,
            year: data.year,
            make: data.make,
            model: data.model,
            photoSetId: data.photoSetId,
            createdAt: (data.createdAt as Timestamp).toDate(),
            updatedAt: (data.updatedAt as Timestamp).toDate(),
        };
    });
}

/**
 * Delete a vehicle
 */
export async function deleteVehicle(vehicleId: string): Promise<void> {
    if (!db) return;
    await deleteDoc(doc(db, 'vehicles', vehicleId));
}
