// functions/src/renderJobs/providers/ProviderAdapter.ts
// Interface for 3D reconstruction provider adapters

/**
 * PROVIDER STATUS RESPONSE
 * ========================
 * Standard status response from provider.checkStatus()
 */
export interface ProviderStatusResponse {
    status: 'processing' | 'complete' | 'failed';
    resultUrl?: string;  // Download URL for GLB file (if complete)
    error?: string;      // Error message (if failed)
}

/**
 * PROVIDER ADAPTER INTERFACE
 * ===========================
 * All 3D reconstruction providers must implement this interface
 */
export interface ProviderAdapter {
    /**
     * Submit photos to provider for 3D reconstruction
     * 
     * @param photoUrls - Array of signed download URLs for photos
     * @returns Provider's job ID
     */
    submit(photoUrls: string[]): Promise<{ jobId: string }>;

    /**
     * Check status of a submitted job
     * 
     * @param jobId - Provider's job ID
     * @returns Current status and result URL if complete
     */
    checkStatus(jobId: string): Promise<ProviderStatusResponse>;
}
