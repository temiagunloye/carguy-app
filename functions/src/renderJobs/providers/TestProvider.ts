// functions/src/renderJobs/providers/TestProvider.ts
// Test provider for local development (no API calls)

import type { ProviderAdapter, ProviderStatusResponse } from './ProviderAdapter';

/**
 * TEST PROVIDER
 * =============
 * Local test mode for development without external API
 * 
 * Behavior:
 * - submit() returns instant job ID
 * - checkStatus() simulates 30-second processing time
 * - Returns sample GLB from glTF-Sample-Models repo
 */
export class TestProvider implements ProviderAdapter {
    private readonly PROCESSING_TIME_MS = 30000; // 30 seconds
    private readonly SAMPLE_GLB_URL = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoxAnimated/glTF-Binary/BoxAnimated.glb';

    /**
     * Submit photos (no-op in test mode)
     * Returns instant job ID based on timestamp
     */
    async submit(photoUrls: string[]): Promise<{ jobId: string }> {
        console.log(`[TestProvider] Simulating submission of ${photoUrls.length} photos`);

        const jobId = `test_${Date.now()}`;
        console.log(`[TestProvider] Created test job: ${jobId}`);

        return { jobId };
    }

    /**
     * Check job status
     * Simulates processing time, then returns sample GLB
     */
    async checkStatus(jobId: string): Promise<ProviderStatusResponse> {
        console.log(`[TestProvider] Checking status for job: ${jobId}`);

        // Extract timestamp from job ID
        const timestamp = parseInt(jobId.split('_')[1]);
        const now = Date.now();
        const elapsed = now - timestamp;

        // Still processing if less than PROCESSING_TIME_MS
        if (elapsed < this.PROCESSING_TIME_MS) {
            const remainingSeconds = Math.ceil((this.PROCESSING_TIME_MS - elapsed) / 1000);
            console.log(`[TestProvider] Still processing... ${remainingSeconds}s remaining`);

            return {
                status: 'processing',
            };
        }

        // Processing complete - return sample GLB
        console.log(`[TestProvider] Processing complete! Returning sample GLB`);

        return {
            status: 'complete',
            resultUrl: this.SAMPLE_GLB_URL,
        };
    }
}
