// functions/src/reconstruction.js
// Cloud Function to request 3D car reconstruction

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

const db = admin.firestore();

/**
 * HTTPS Callable Function: requestCarReconstruction
 * 
 * Validates that a car has all 10 angle photos, then submits a reconstruction
 * job to the external 3D photogrammetry service.
 * 
 * @param {Object} data - { carId: string }
 * @param {Object} context - Firebase auth context
 * @returns {Object} - { success: boolean, jobId?: string, error?: string }
 */
exports.requestCarReconstruction = functions.https.onCall(async (data, context) => {
    // 1. Validate authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'User must be authenticated to request 3D reconstruction.'
        );
    }

    const { carId } = data;
    const userId = context.auth.uid;

    if (!carId) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'carId is required.'
        );
    }

    try {
        // 2. Fetch car document
        const carRef = db.collection('cars').doc(carId);
        const carDoc = await carRef.get();

        if (!carDoc.exists) {
            throw new functions.https.HttpsError(
                'not-found',
                `Car ${carId} not found.`
            );
        }

        const carData = carDoc.data();

        // 3. Verify ownership (if car has userId field, otherwise skip in demo mode)
        if (carData.userId && carData.userId !== userId) {
            throw new functions.https.HttpsError(
                'permission-denied',
                'You do not have permission to reconstruct this car.'
            );
        }

        // 4. Validate that all 10 anglePhotos exist
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
            'rear_low'
        ];

        const anglePhotos = carData.anglePhotos || {};
        const missingAngles = requiredAngles.filter(angle => !anglePhotos[angle]);

        if (missingAngles.length > 0) {
            throw new functions.https.HttpsError(
                'failed-precondition',
                `Missing angle photos: ${missingAngles.join(', ')}. Please complete the 10-angle scan first.`
            );
        }

        // 5. Set status to "queued"
        await carRef.update({
            renderJobStatus: 'queued',
            renderJobQueuedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // 6. Prepare payload for 3D service
        const reconstructionPayload = {
            carId: carId,
            userId: userId,
            metadata: {
                year: carData.year || '',
                make: carData.make || '',
                model: carData.model || '',
                trim: carData.trim || '',
                color: carData.paintColor || '',
            },
            anglePhotos: anglePhotos,
            callbackUrl: `${functions.config().service?.callback_url || 'https://your-firebase-project.cloudfunctions.net'}/onReconstructionComplete`,
        };

        // 7. POST to external 3D reconstruction service
        // TODO: Replace with your actual 3D service URL
        const serviceUrl = functions.config().service?.url || 'https://mock-3d-service.example.com/api/reconstruct-car';

        // FOR DEVELOPMENT: Mock the 3D service response
        // In production, this would be a real HTTP request to your photogrammetry service
        if (serviceUrl.includes('mock')) {
            // Simulate async processing - the webhook will be called automatically after 5 seconds
            // In a real implementation, the 3D service would process and call our webhook
            console.log('MOCK MODE: Simulating 3D reconstruction request');
            console.log('Payload:', JSON.stringify(reconstructionPayload, null, 2));

            // Schedule a mock webhook callback after 5 seconds (simulates processing time)
            setTimeout(async () => {
                await simulateMockWebhookCallback(carId, anglePhotos);
            }, 5000);

            return {
                success: true,
                jobId: `mock_job_${carId}_${Date.now()}`,
                message: 'Mock reconstruction queued. Webhook will fire in ~5 seconds.'
            };
        }

        // PRODUCTION: Real HTTP request to 3D service
        try {
            const response = await axios.post(serviceUrl, reconstructionPayload, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': functions.config().service?.api_key || '',
                },
                timeout: 10000, // 10 second timeout for initial request
            });

            return {
                success: true,
                jobId: response.data.jobId || `job_${carId}`,
                message: '3D reconstruction job submitted successfully.'
            };
        } catch (httpError) {
            console.error('Error calling 3D service:', httpError);

            // Revert status to idle on failure
            await carRef.update({
                renderJobStatus: 'failed',
                renderError: httpError.message,
            });

            throw new functions.https.HttpsError(
                'internal',
                `Failed to start 3D reconstruction: ${httpError.message}`
            );
        }

    } catch (error) {
        console.error('Error in requestCarReconstruction:', error);

        if (error instanceof functions.https.HttpsError) {
            throw error;
        }

        throw new functions.https.HttpsError(
            'internal',
            `Unexpected error: ${error.message}`
        );
    }
});

/**
 * MOCK FUNCTION: Simulate 3D service webhook callback
 * This simulates what the real 3D service would do after processing
 * 
 * In production, this would be called by your actual photogrammetry service
 */
async function simulateMockWebhookCallback(carId, anglePhotos) {
    console.log(`[MOCK] Simulating webhook callback for car ${carId}`);

    // Use the existing anglePhotos as "renders" (placeholder until real service)
    const mockPreviewAngles = [
        { angle: 'front34', url: anglePhotos.driver_front || '' },
        { angle: 'side', url: anglePhotos.full_driver_side || '' },
        { angle: 'rear34', url: anglePhotos.driver_rear || '' },
        { angle: 'rear', url: anglePhotos.rear_center || '' },
        { angle: 'front', url: anglePhotos.front_center || '' },
    ];

    const mockPayload = {
        carId: carId,
        status: 'complete',
        modelUrl: `https://storage.googleapis.com/mock-3d-models/${carId}/model.glb`,
        previewAngles: mockPreviewAngles,
    };

    // Update Firestore directly (simulating what the webhook would do)
    try {
        const carRef = db.collection('cars').doc(carId);
        await carRef.update({
            renderJobStatus: 'complete',
            renderMeshUrl: mockPayload.modelUrl,
            renderingPreviewUrl: mockPreviewAngles.find(a => a.angle === 'front34')?.url || '',
            previewAngles: mockPreviewAngles,
            renderCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`[MOCK] Successfully updated car ${carId} with mock 3D data`);
    } catch (error) {
        console.error(`[MOCK] Error updating car ${carId}:`, error);
    }
}
