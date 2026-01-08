// functions/src/renderJobs/onRenderJobCreated.ts
// Firestore trigger to submit job to provider when created

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { getProviderAdapter } from './providers';

/**
 * ON RENDER JOB CREATED (Firestore Trigger)
 * ==========================================
 * Triggered when a new renderJob document is created
 * Submits job to the configured provider
 */
export const onRenderJobCreated = functions.firestore
    .document('renderJobs/{jobId}')
    .onCreate(async (snapshot, context) => {
        const jobId = context.params.jobId;
        const job = snapshot.data();

        console.log(`[onRenderJobCreated] Processing job: ${jobId}`);

        try {
            // Validate job has required fields
            if (!job.photoPaths || job.photoPaths.length === 0) {
                throw new Error('No photoPaths in job');
            }

            // Generate signed URLs for photos (24-hour expiry)
            const storage = admin.storage().bucket();
            const signedUrls: string[] = [];

            for (const photoPath of job.photoPaths) {
                try {
                    const file = storage.file(photoPath);
                    const [url] = await file.getSignedUrl({
                        action: 'read',
                        expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
                    });
                    signedUrls.push(url);
                } catch (error) {
                    console.error(`[onRenderJobCreated] Failed to generate signed URL for ${photoPath}:`, error);
                    throw new Error(`Failed to access photo: ${photoPath}`);
                }
            }

            console.log(`[onRenderJobCreated] Generated ${signedUrls.length} signed URLs`);

            // Get provider adapter
            const provider = getProviderAdapter(job.provider || 'test');

            // Submit to provider
            console.log(`[onRenderJobCreated] Submitting to provider: ${job.provider}`);
            const result = await provider.submit(signedUrls);

            // Update job with provider job ID and status
            await snapshot.ref.update({
                providerJobId: result.jobId,
                status: 'processing',
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            console.log(`[onRenderJobCreated] ✓ Job submitted, providerJobId: ${result.jobId}`);

        } catch (error: any) {
            console.error(`[onRenderJobCreated] Error processing job ${jobId}:`, error);

            // Mark job as failed
            await snapshot.ref.update({
                status: 'failed',
                error: error.message || 'Unknown error during submission',
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
    });
