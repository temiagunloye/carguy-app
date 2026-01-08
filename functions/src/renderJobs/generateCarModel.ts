// functions/src/renderJobs/generateCarModel.ts
// Callable Cloud Function to create 3D reconstruction job

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

/**
 * GENERATE CAR MODEL (Callable Function)
 * =======================================
 * Creates a render job for 3D reconstruction
 * 
 * Input: { carId: string, photoPaths: string[] }
 * Output: { jobId: string, status: string }
 */
export const generateCarModel = functions.https.onCall(async (data, context) => {
    const { carId, photoPaths } = data;

    // Validate authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'User must be authenticated'
        );
    }

    const uid = context.auth.uid;

    // Validate input
    if (!carId || !photoPaths || !Array.isArray(photoPaths)) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'carId and photoPaths (array) are required'
        );
    }

    if (photoPaths.length < 8) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            `Need at least 8 photos, received ${photoPaths.length}`
        );
    }

    console.log(`[generateCarModel] Creating job for car ${carId}, ${photoPaths.length} photos`);

    // Determine provider from environment (default to 'test')
    const provider = process.env.RENDER_PROVIDER || 'test';

    // Create render job
    const db = admin.firestore();
    const jobRef = db.collection('renderJobs').doc();
    const jobId = jobRef.id;

    await jobRef.set({
        jobId,
        uid,
        carId,
        status: 'queued',
        photoPaths,
        provider,
        providerJobId: null,
        result: {
            modelStoragePath: null,
            modelUrl: null,
        },
        anchors: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        error: null,
    });

    console.log(`[generateCarModel] ✓ Job created: ${jobId}, provider: ${provider}`);

    return {
        jobId,
        status: 'queued',
    };
});
