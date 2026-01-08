// src/services/cloudFunctions.ts
// Client-side calls to Firebase Cloud Functions

import { getFunctions, httpsCallable } from 'firebase/functions';
import type { GenerateCarModelRequest, GenerateCarModelResponse } from '../types/renderJob';

const functions = getFunctions();

/**
 * GENERATE CAR MODEL
 * ==================
 * Callable Cloud Function to create a 3D reconstruction render job
 * 
 * @param request - { carId: string, photoPaths: string[] }
 * @returns { jobId: string, status: string }
 */
export async function generateCarModel(
    request: GenerateCarModelRequest
): Promise<GenerateCarModelResponse> {
    console.log('[cloudFunctions] Calling generateCarModel:', request);

    const callable = httpsCallable<GenerateCarModelRequest, GenerateCarModelResponse>(
        functions,
        'generateCarModel'
    );

    const result = await callable(request);

    console.log('[cloudFunctions] generateCarModel result:', result.data);
    return result.data;
}
