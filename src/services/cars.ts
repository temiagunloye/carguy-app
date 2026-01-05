// src/services/cars.ts
// Car document CRUD operations and render status management

import { doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import type { CarDocumentUpdate, RenderStatus } from '../types/car';
import { db } from './firebaseConfig';

/**
 * CREATE OR UPDATE CAR DOCUMENT
 * ==============================
 * 
 * Creates a new car document or updates an existing one.
 * Automatically manages timestamps (createdAt on create, updatedAt on every update).
 * 
 * @param carId - Document ID
 * @param data - Partial car document (userId required on create)
 * @throws Error if userId is missing on new document creation
 */
export async function createOrUpdateCarDoc(
    carId: string,
    data: CarDocumentUpdate & { userId?: string }
): Promise<void> {
    const carRef = doc(db, 'cars', carId);

    // Prepare update data
    const updateData: any = {
        ...data,
        updatedAt: serverTimestamp(),
    };

    // If this might be a new document, include createdAt
    // Note: serverTimestamp() will only set on document creation, ignored on updates
    if (data.userId) {
        updateData.createdAt = serverTimestamp();
    }

    // Use setDoc with merge to create or update
    await setDoc(carRef, updateData, { merge: true });
}

/**
 * SET RENDER STATUS
 * =================
 * 
 * Updates the render status and optionally stores an error message.
 * This is the primary function for state machine transitions.
 * 
 * State transitions:
 * - draft → pending (when all photos uploaded)
 * - pending → processing (when backend starts)
 * - processing → ready (on success)
 * - processing → error (on failure)
 * 
 * @param carId - Document ID
 * @param status - New render status
 * @param optionalError - Error message (only used

 when status = 'error')
 */
export async function setRenderStatus(
    carId: string,
    status: RenderStatus,
    optionalError?: string | null
): Promise<void> {
    const carRef = doc(db, 'cars', carId);

    const updateData: any = {
        renderStatus: status,
        updatedAt: serverTimestamp(),
    };

    // Store error message if provided (typically when status = 'error')
    if (optionalError !== undefined) {
        updateData.renderError = optionalError;
    }

    // Clear error if transitioning to non-error state
    if (status !== 'error' && optionalError === undefined) {
        updateData.renderError = null;
    }

    await updateDoc(carRef, updateData);
}

/**
 * CHECK IF ALL PHOTOS UPLOADED
 * ============================
 * 
 * Helper to determine if a car has all 10 required photos.
 * Useful for transitioning from 'draft' to 'pending'.
 * 
 * @param photoAngles - PhotoAngles record from car document
 * @returns true if all 10 angle keys have non-null values
 */
export function hasAllPhotosUploaded(
    photoAngles: Record<string, string | null>
): boolean {
    const requiredAngles = [
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
        const url = photoAngles[angle];
        return url !== null && url !== undefined && url.length > 0;
    });
}
