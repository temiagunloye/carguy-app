// src/services/kiri.js
// KIRI Engine API Integration for 3D Car Model Generation
// Using official KIRI API endpoints (no mocking)

import { KIRI_API_KEY } from "@env";

const KIRI_API_BASE = "https://api.kiriengine.app";

/**
 * Upload car photos to KIRI Engine and start 3D model generation
 * 
 * @param {Object} params - Upload parameters
 * @param {string} params.carId - Car document ID
 * @param {string[]} params.imageUris - Array of 10 image URIs (local file paths or URLs)
 * @returns {Promise<{success: boolean, jobId?: string, error?: string}>}
 */
export const uploadCarPhotosToKiri = async ({ carId, imageUris }) => {
    try {
        console.log('[KIRI] Starting upload for car:', carId);
        console.log('[KIRI] Image count:', imageUris.length);

        if (!imageUris || imageUris.length === 0) {
            throw new Error('No images provided for KIRI upload');
        }

        // Build multipart form data
        const formData = new FormData();

        // Add each image to imagesFiles array
        for (let i = 0; i < imageUris.length; i++) {
            const uri = imageUris[i];

            // Create file object for React Native
            const file = {
                uri,
                type: 'image/jpeg', // KIRI accepts JPEG
                name: `car_${carId}_angle_${i + 1}.jpg`,
            };

            formData.append('imagesFiles', file);
        }

        // Add KIRI parameters (from official docs)
        formData.append('modelQuality', '1');
        formData.append('textureQuality', '1');
        formData.append('fileFormat', 'glb');
        formData.append('isMask', '1');
        formData.append('textureSmoothing', '1');

        // Call KIRI API
        console.log('[KIRI] Calling API endpoint...');
        const response = await fetch(`${KIRI_API_BASE}/api/v1/open/photo/image`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${KIRI_API_KEY}`,
                // Note: Don't set Content-Type for FormData, browser/RN will set it with boundary
            },
            body: formData,
        });

        const data = await response.json();
        console.log('[KIRI] Response:', data);

        // Check response according to KIRI docs
        if (data.code !== 0 || !data.ok) {
            throw new Error(data.msg || 'KIRI upload failed');
        }

        const jobId = data.data.serialize;
        console.log('[KIRI] Job created:', jobId);

        return {
            success: true,
            jobId,
            calculateType: data.data.calculateType,
        };

    } catch (error) {
        console.error('[KIRI] Upload error:', error);
        return {
            success: false,
            error: error.message || 'Failed to upload to KIRI',
        };
    }
};

/**
 * Poll KIRI API for model generation status
 * 
 * @param {string} jobId - KIRI job ID (serialize from upload response)
 * @returns {Promise<{status: string, modelUrl?: string, viewerUrl?: string, progress?: number}>}
 */
export const pollKiriModel = async (jobId) => {
    try {
        // According to KIRI docs, check result endpoint
        // Note: Adjust this endpoint based on actual KIRI docs for result checking
        const response = await fetch(`${KIRI_API_BASE}/api/v1/open/photo/result/${jobId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${KIRI_API_KEY}`,
            },
        });

        const data = await response.json();

        if (data.code !== 0) {
            throw new Error(data.msg || 'Failed to get model status');
        }

        // Map KIRI status to our app status
        const result = data.data;

        // KIRI status mapping (adjust based on actual response structure)
        let status = 'processing';
        let modelUrl = null;
        let viewerUrl = null;
        let progress = result.progress || 0;

        if (result.status === 'completed' || result.modelUrl) {
            status = 'complete';
            modelUrl = result.modelUrl || result.glbUrl;
            viewerUrl = result.viewerUrl || result.shareUrl;
        } else if (result.status === 'failed' || result.error) {
            status = 'error';
        } else if (result.status === 'processing') {
            status = 'processing';
        }

        return {
            status,
            modelUrl,
            viewerUrl,
            progress,
            error: result.error,
        };

    } catch (error) {
        console.error('[KIRI] Poll error:', error);
        return {
            status: 'error',
            error: error.message,
        };
    }
};

/**
 * Complete workflow: Upload photos and start polling
 * 
 * @param {Object} params - Parameters
 * @param {string} params.carId - Car ID
 * @param {string[]} params.imageUris - Image URIs
 * @param {Function} params.onProgress - Progress callback (status, progress, jobId)
 * @param {Function} params.onComplete - Completion callback (modelUrl, viewerUrl)
 * @param {Function} params.onError - Error callback (error)
 * @returns {Promise<void>}
 */
export const startKiriWorkflow = async ({
    carId,
    imageUris,
    onProgress,
    onComplete,
    onError
}) => {
    try {
        // Step 1: Upload photos
        onProgress?.({ status: 'uploading', progress: 0 });

        const uploadResult = await uploadCarPhotosToKiri({ carId, imageUris });

        if (!uploadResult.success) {
            onError?.(uploadResult.error);
            return;
        }

        const { jobId } = uploadResult;
        onProgress?.({ status: 'processing', progress: 10, jobId });

        // Step 2: Poll for completion (every 30 seconds)
        const pollInterval = setInterval(async () => {
            const result = await pollKiriModel(jobId);

            onProgress?.({
                status: result.status,
                progress: result.progress,
                jobId,
            });

            if (result.status === 'complete') {
                clearInterval(pollInterval);
                onComplete?.(result.modelUrl, result.viewerUrl);
            } else if (result.status === 'error') {
                clearInterval(pollInterval);
                onError?.(result.error || 'Model generation failed');
            }
        }, 30000); // Poll every 30 seconds

        // Return cleanup function
        return () => clearInterval(pollInterval);

    } catch (error) {
        onError?.(error.message);
    }
};

/**
 * Get display info for KIRI status
 */
export const getKiriStatusDisplay = (status) => {
    switch (status) {
        case 'uploading':
            return {
                text: 'Uploading photos to KIRI...',
                color: '#f59e0b',
                icon: 'cloud-upload-outline',
            };
        case 'processing':
            return {
                text: 'Generating 3D model...',
                color: '#4a9eff',
                icon: 'construct-outline',
            };
        case 'complete':
            return {
                text: '3D Model Ready',
                color: '#22c55e',
                icon: 'checkmark-circle',
            };
        case 'error':
            return {
                text: 'Generation failed',
                color: '#ef4444',
                icon: 'alert-circle',
            };
        default:
            return {
                text: 'Ready',
                color: '#666',
                icon: 'cube-outline',
            };
    }
};
