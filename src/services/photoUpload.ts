// src/services/photoUpload.ts
// Firebase Storage photo upload utilities for car angle photos

import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import type { PhotoAngleKey, PhotoAngles } from '../types/car';
import { getCarPhotoPath } from '../utils/storagePaths';
import { storage } from './firebaseConfig';

/**
 * UPLOAD SINGLE CAR PHOTO
 * =======================
 * Uploads one photo to Firebase Storage and returns the download URL
 * 
 * @param userId - User's Firebase Auth UID
 * @param carId - Car document ID
 * @param angleKey - Photo angle key (from carScanConfig.js)
 * @param localUri - Local file URI from image picker
 * @returns Firebase Storage download URL
 * @throws Error if upload fails
 */
export async function uploadCarPhoto(
    userId: string,
    carId: string,
    angleKey: PhotoAngleKey,
    localUri: string
): Promise<string> {
    try {
        console.log(`[PhotoUpload] Uploading ${angleKey} for car ${carId}`);

        // Get storage path using Phase 1 helper
        const storagePath = getCarPhotoPath(userId, carId, angleKey);
        const storageRef = ref(storage, storagePath);

        // Convert local URI to blob for upload
        const response = await fetch(localUri);
        const blob = await response.blob();

        // Upload to Firebase Storage
        await uploadBytes(storageRef, blob);

        // Get download URL
        const downloadUrl = await getDownloadURL(storageRef);

        console.log(`[PhotoUpload] ✓ ${angleKey} uploaded successfully`);
        return downloadUrl;

    } catch (error) {
        console.error(`[PhotoUpload] ✗ Failed to upload ${angleKey}:`, error);
        throw new Error(`Failed to upload ${angleKey}: ${error.message}`);
    }
}

/**
 * UPLOAD ALL CAR PHOTOS
 * =====================
 * Uploads all 10 angle photos and builds the photoAngles map
 * Uploads sequentially to avoid overwhelming the network
 * 
 * @param userId - User's Firebase Auth UID
 * @param carId - Car document ID
 * @param photoMap - Map of angleKey -> localUri
 * @param onProgress - Optional progress callback (currentIndex, total, angleKey)
 * @returns PhotoAngles map with all download URLs
 * @throws Error if any upload fails (stops immediately)
 */
export async function uploadAllCarPhotos(
    userId: string,
    carId: string,
    photoMap: Record<string, string>,
    onProgress?: (current: number, total: number, angleKey: string) => void
): Promise<PhotoAngles> {
    const angleKeys = Object.keys(photoMap);
    const total = angleKeys.length;

    console.log(`[PhotoUpload] Starting upload of ${total} photos for car ${carId}`);

    const photoAngles: PhotoAngles = {
        driver_front: null,
        passenger_front: null,
        driver_rear: null,
        passenger_rear: null,
        full_driver_side: null,
        full_passenger_side: null,
        front_center: null,
        rear_center: null,
        front_low: null,
        rear_low: null,
    };

    // Upload each photo sequentially
    for (let i = 0; i < angleKeys.length; i++) {
        const angleKey = angleKeys[i] as PhotoAngleKey;
        const localUri = photoMap[angleKey];

        // Notify progress
        onProgress?.(i + 1, total, angleKey);

        // Upload and get download URL
        const downloadUrl = await uploadCarPhoto(userId, carId, angleKey, localUri);

        // Store in photoAngles map
        photoAngles[angleKey] = downloadUrl;
    }

    console.log(`[PhotoUpload] ✓ All ${total} photos uploaded successfully`);
    return photoAngles;
}

/**
 * VALIDATE PHOTO MAP
 * ==================
 * Checks if photo map contains all required angle keys
 * 
 * @param photoMap - Map to validate
 * @returns true if all 10 required angles are present
 */
export function validatePhotoMap(photoMap: Record<string, string>): boolean {
    const requiredAngles: PhotoAngleKey[] = [
        'driver_front',
        'passenger_front',
        'driver_rear',
        'passenger_rear',
        'full_driver_side',
        'full_passenger_side',
        'front_center',
        'rear_center',
        'front_low',
        'rear_low',
    ];

    return requiredAngles.every(angle => {
        const uri = photoMap[angle];
        return uri && uri.length > 0;
    });
}
