// functions/src/renderJobs/pollRenderJobs.ts
// Scheduled function to check status of processing jobs

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { getProviderAdapter } from './providers';

/**
 * POLL RENDER JOBS (Scheduled Function)
 * ======================================
 * Runs every 2 minutes to check status of processing jobs
 * Downloads completed models and updates Firestore
 * 
 * Schedule: every 2 minutes
 */
export const pollRenderJobs = functions.pubsub
    .schedule('every 2 minutes')
    .onRun(async (context) => {
        console.log('[pollRenderJobs] Starting poll...');

        const db = admin.firestore();
        const storage = admin.storage().bucket();

        // Query all processing jobs
        const snapshot = await db
            .collection('renderJobs')
            .where('status', '==', 'processing')
            .get();

        if (snapshot.empty) {
            console.log('[pollRenderJobs] No processing jobs found');
            return;
        }

        console.log(`[pollRenderJobs] Found ${snapshot.size} processing jobs`);

        // Process each job
        for (const doc of snapshot.docs) {
            const job = doc.data();
            const jobId = doc.id;

            try {
                console.log(`[pollRenderJobs] Checking job ${jobId}, provider: ${job.provider}`);

                // Get provider adapter
                const provider = getProviderAdapter(job.provider || 'test');

                // Check status
                const status = await provider.checkStatus(job.providerJobId);

                if (status.status === 'processing') {
                    console.log(`[pollRenderJobs] Job ${jobId} still processing...`);
                    continue;
                }

                if (status.status === 'failed') {
                    console.error(`[pollRenderJobs] Job ${jobId} failed:`, status.error);
                    await doc.ref.update({
                        status: 'failed',
                        error: status.error || 'Provider reported failure',
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                    continue;
                }

                // Status === 'complete'
                console.log(`[pollRenderJobs] Job ${jobId} complete! Downloading model...`);

                if (!status.resultUrl) {
                    throw new Error('Provider returned complete but no resultUrl');
                }

                // Download GLB from provider
                const response = await fetch(status.resultUrl);
                if (!response.ok) {
                    throw new Error(`Failed to download model: ${response.status} ${response.statusText}`);
                }

                const glbBuffer = await response.arrayBuffer();
                console.log(`[pollRenderJobs] Downloaded ${glbBuffer.byteLength} bytes`);

                // Upload to Firebase Storage
                const modelPath = `models/${job.uid}/${jobId}/model.glb`;
                const file = storage.file(modelPath);

                await file.save(Buffer.from(glbBuffer), {
                    metadata: {
                        contentType: 'model/gltf-binary',
                    },
                });

                // Generate public download URL
                const [downloadUrl] = await file.getSignedUrl({
                    action: 'read',
                    expires: '03-01-2500', // Far future
                });

                console.log(`[pollRenderJobs] ✓ Model uploaded to ${modelPath}`);

                // Update job as complete
                await doc.ref.update({
                    status: 'complete',
                    'result.modelStoragePath': modelPath,
                    'result.modelUrl': downloadUrl,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });

                console.log(`[pollRenderJobs] ✓ Job ${jobId} marked complete`);

            } catch (error: any) {
                console.error(`[pollRenderJobs] Error processing job ${jobId}:`, error);

                await doc.ref.update({
                    status: 'failed',
                    error: error.message || 'Unknown error during polling',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            }
        }

        console.log('[pollRenderJobs] Poll complete');
    });
