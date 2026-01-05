// functions/src/generateCarModel.ts
// Cloud Function to trigger 3D car model generation from uploaded photos

import * as admin from 'firebase-admin';
import { getStorage } from 'firebase-admin/storage';
import * as functions from 'firebase-functions';

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();
const storage = getStorage();

/**
 * GENERATE CAR MODEL
 * ==================
 * Callable Cloud Function to start 3D model generation
 * 
 * Workflow:
 * 1. Validate car document and renderStatus
 * 2. Generate signed URLs for all photos
 * 3. Call external photogrammetry API
 * 4. Save resulting GLB to Firebase Storage
 * 5. Update car document with modelUrl
 * 
 * @param data.carId - Car document ID
 * @returns Success message
 */
export const generateCarModel = functions.https.onCall(async (data, context) => {
    const { carId } = data;

    // Validate authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'User must be authenticated'
        );
    }

    const userId = context.auth.uid;
    console.log(`[generateCarModel] Starting for car ${carId}, user ${userId}`);

    try {
        // 1. READ CAR DOCUMENT
        const carRef = db.collection('cars').doc(carId);
        const carSnap = await carRef.get();

        if (!carSnap.exists) {
            throw new functions.https.HttpsError('not-found', 'Car not found');
        }

        const carData = carSnap.data()!;

        // Validate ownership
        if (carData.userId !== userId) {
            throw new functions.https.HttpsError(
                'permission-denied',
                'Not authorized to process this car'
            );
        }

        // 2. VALIDATE RENDER STATUS
        if (carData.renderStatus !== 'pending') {
            throw new functions.https.HttpsError(
                'failed-precondition',
                `Car renderStatus must be 'pending', currently: ${carData.renderStatus}`
            );
        }

        // 3. VALIDATE PHOTO ANGLES
        const photoAngles = carData.photoAngles || {};
        const photoUrls = Object.values(photoAngles).filter((url: any) => url !== null);

        if (photoUrls.length < 8) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                `Need at least 8 photos, have ${photoUrls.length}`
            );
        }

        console.log(`[generateCarModel] Validated ${photoUrls.length} photos`);

        // 4. UPDATE STATUS TO PROCESSING
        await carRef.update({
            renderStatus: 'processing',
            renderError: null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log('[generateCarModel] Status updated to processing');

        // 5. GENERATE SIGNED URLs FOR PHOTOS
        // Convert Firebase download URLs to signed URLs with longer expiry
        const signedUrls: string[] = [];

        for (const angleKey in photoAngles) {
            const downloadUrl = photoAngles[angleKey];
            if (downloadUrl) {
                // For now, use the download URL directly
                // In production, generate signed URLs:
                // const [signedUrl] = await storage.bucket().file(path).getSignedUrl({...});
                signedUrls.push(downloadUrl);
            }
        }

        console.log(`[generateCarModel] Generated ${signedUrls.length} signed URLs`);

        // 6. CALL PHOTOGRAMMETRY API
        // PLACEHOLDER: Replace with actual API endpoint from environment variable
        const photogrammetryApiUrl = process.env.PHOTOGRAMMETRY_API_URL || 'https://placeholder.example.com/api/generate';

        console.log('[generateCarModel] Calling photogrammetry API...');

        const apiPayload = {
            imageUrls: signedUrls,
            meta: {
                carId,
                userId,
                make: carData.make,
                model: carData.model,
                year: carData.year,
                trim: carData.trim,
            },
        };

        // PLACEHOLDER IMPLEMENTATION
        // In production, replace with actual fetch() call:
        /*
        const apiResponse = await fetch(photogrammetryApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.PHOTOGRAMMETRY_API_KEY}`,
          },
          body: JSON.stringify(apiPayload),
        });
        
        if (!apiResponse.ok) {
          throw new Error(`API returned ${apiResponse.status}: ${await apiResponse.text()}`);
        }
        
        const apiResult = await apiResponse.json();
        const glbUrl = apiResult.glbUrl; // or apiResult.glbBinary
        */

        // MOCK: For now, just log and skip actual API call
        console.log('[generateCarModel] MOCK: Skipping actual API call');
        console.log('[generateCarModel] Would send:', JSON.stringify(apiPayload, null, 2));

        // 7. SAVE GLB TO STORAGE
        // PLACEHOLDER: Download GLB from API and upload to Firebase Storage
        const modelStoragePath = `users/${userId}/cars/${carId}/models/main.glb`;

        // MOCK: Skip actual file upload
        console.log(`[generateCarModel] MOCK: Would save GLB to ${modelStoragePath}`);

        // In production:
        /*
        const glbBuffer = await (await fetch(glbUrl)).arrayBuffer();
        const file = storage.bucket().file(modelStoragePath);
        await file.save(Buffer.from(glbBuffer), {
          metadata: { contentType: 'model/gltf-binary' },
        });
        const [modelUrl] = await file.getSignedUrl({
          action: 'read',
          expires: '03-01-2500', // Far future
        });
        */

        // MOCK MODEL URL (for testing UI)
        const modelUrl = `gs://testing-bucket/${modelStoragePath}`;

        // 8. UPDATE CAR DOCUMENT WITH SUCCESS
        await carRef.update({
            renderStatus: 'ready',
            modelUrl,
            renderError: null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log('[generateCarModel] ✓ Complete! Model URL:', modelUrl);

        return {
            success: true,
            message: '3D model generated successfully',
            modelUrl,
        };

    } catch (error: any) {
        console.error('[generateCarModel] Error:', error);

        // Update car document with error
        try {
            await db.collection('cars').doc(carId).update({
                renderStatus: 'error',
                renderError: error.message || 'Unknown error during 3D generation',
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        } catch (updateError) {
            console.error('[generateCarModel] Failed to update error status:', updateError);
        }

        // Throw HttpsError for client
        throw new functions.https.HttpsError(
            'internal',
            `3D generation failed: ${error.message || 'Unknown error'}`
        );
    }
});
