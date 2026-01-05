// functions/src/webhooks.js
// Webhook endpoint for 3D reconstruction service callbacks

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');

const db = admin.firestore();
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

/**
 * Webhook endpoint: onReconstructionComplete
 * 
 * Called by the external 3D service when reconstruction is complete.
 * Updates the car document with the GLB model URL and preview renders.
 * 
 * Expected payload:
 * {
 *   "carId": "abc123",
 *   "status": "complete" | "failed",
 *   "modelUrl": "https://storage.../car_model.glb",
 *   "previewAngles": [
 *     { "angle": "front34", "url": "https://.../front34.png" },
 *     { "angle": "side", "url": "https://.../side.png" },
 *     ...
 *   ],
 *   "error": "Optional error message if status is failed"
 * }
 */
app.post('/', async (req, res) => {
    try {
        // 1. Validate webhook signature/secret (security)
        const providedSecret = req.headers['x-webhook-secret'];
        const expectedSecret = functions.config().service?.webhook_secret || 'dev-secret-changeme';

        if (providedSecret !== expectedSecret) {
            console.error('Invalid webhook secret provided');
            return res.status(401).json({
                success: false,
                error: 'Unauthorized: Invalid webhook secret'
            });
        }

        // 2. Extract payload
        const {
            carId,
            status,
            modelUrl,
            previewAngles,
            error: reconstructionError
        } = req.body;

        // 3. Validate required fields
        if (!carId) {
            return res.status(400).json({
                success: false,
                error: 'carId is required'
            });
        }

        if (!status || !['complete', 'failed'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'status must be "complete" or "failed"'
            });
        }

        // 4. Fetch car document
        const carRef = db.collection('cars').doc(carId);
        const carDoc = await carRef.get();

        if (!carDoc.exists) {
            console.error(`Car ${carId} not found`);
            return res.status(404).json({
                success: false,
                error: `Car ${carId} not found`
            });
        }

        // 5. Handle success vs failure
        if (status === 'complete') {
            // Validate that we received the necessary data
            if (!modelUrl || !previewAngles || !Array.isArray(previewAngles)) {
                return res.status(400).json({
                    success: false,
                    error: 'modelUrl and previewAngles are required for complete status'
                });
            }

            // Find the primary preview URL (front 3/4 angle)
            const primaryPreview = previewAngles.find(a => a.angle === 'front34');
            if (!primaryPreview) {
                console.warn(`No front34 preview found for car ${carId}, using first available`);
            }

            // Update car document with successful reconstruction
            await carRef.update({
                renderJobStatus: 'complete',
                renderMeshUrl: modelUrl,
                renderingPreviewUrl: primaryPreview?.url || previewAngles[0]?.url || '',
                previewAngles: previewAngles,
                renderCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
                renderError: admin.firestore.FieldValue.delete(), // Clear any previous errors
            });

            console.log(`Successfully updated car ${carId} with 3D reconstruction data`);
            console.log(`- Model URL: ${modelUrl}`);
            console.log(`- Preview angles: ${previewAngles.length}`);

            return res.status(200).json({
                success: true,
                message: `Car ${carId} reconstruction completed successfully`
            });

        } else if (status === 'failed') {
            // Update car document with failure status
            await carRef.update({
                renderJobStatus: 'failed',
                renderError: reconstructionError || 'Unknown error during reconstruction',
                renderCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            console.error(`Reconstruction failed for car ${carId}: ${reconstructionError}`);

            return res.status(200).json({
                success: true,
                message: `Car ${carId} reconstruction failure recorded`
            });
        }

    } catch (error) {
        console.error('Error in onReconstructionComplete webhook:', error);
        return res.status(500).json({
            success: false,
            error: `Internal server error: ${error.message}`
        });
    }
});

// Export as HTTPS function
exports.onReconstructionComplete = functions.https.onRequest(app);
