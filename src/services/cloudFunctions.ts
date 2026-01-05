// src/services/cloudFunctions.ts
// Cloud Function calls for 3D rendering (implementation is in Firebase Functions)

import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

/**
 * GENERATE CAR MODEL (Cloud Function)
 * ===================================
 * Triggers the Cloud Function to start 3D model generation
 * 
 * This function:
 * 1. Validates all 10 photos are uploaded
 * 2. Initializes photogrammetry processing
 * 3. Sets renderStatus = 'processing'
 * 4. Returns immediately (processing happens async)
 * 
 * @param carId - Car document ID
 * @returns Promise resolving when Cloud Function is triggered (not when complete)
 * @throws Error if Cloud Function call fails
 */
export async function generateCarModel(carId: string): Promise<void> {
    console.log(`[CloudFunctions] Calling generateCarModel for car ${carId}`);

    const generateModel = httpsCallable(functions, 'generateCarModel');

    try {
        const result = await generateModel({ carId });
        console.log(`[CloudFunctions] ✓ generateCarModel triggered:`, result.data);
    } catch (error) {
        console.error(`[CloudFunctions] ✗ generateCarModel failed:`, error);
        throw new Error(`Failed to trigger 3D generation: ${error.message}`);
    }
}
