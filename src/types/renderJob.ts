// src/types/renderJob.ts
// TypeScript types for 3D reconstruction render jobs

import type { Timestamp } from 'firebase/firestore';

/**
 * RENDER JOB STATUS
 * =================
 * State machine for 3D reconstruction jobs:
 * queued → processing → complete
 *                    ↓
 *                  failed
 */
export type RenderJobStatus = 'queued' | 'processing' | 'complete' | 'failed';

/**
 * PROVIDER TYPES
 * ==============
 * - test: Local test mode with sample GLB (no API calls)
 * - external_api: External 3D reconstruction API (Luma, Polycam, etc.)
 * - aws_gpu: Custom AWS GPU-based reconstruction
 */
export type RenderJobProvider = 'test' | 'external_api' | 'aws_gpu';

/**
 * RENDER JOB DOCUMENT
 * ===================
 * Firestore collection: renderJobs/{jobId}
 * Represents a single 3D reconstruction job
 */
export interface RenderJob {
    // Identity
    jobId: string;
    uid: string;          // User ID
    carId: string;        // Associated car

    // Status
    status: RenderJobStatus;

    // Input (Firebase Storage object paths, NOT download URLs)
    // Example: "users/abc123/cars/car_456/photos/driver_front.jpg"
    photoPaths: string[];

    // Provider configuration
    provider: RenderJobProvider;
    providerJobId?: string | null;

    // Output
    result: {
        modelStoragePath?: string | null;  // Storage path to GLB file
        modelUrl?: string | null;          // Public HTTPS download URL
    };

    // Future: Anchor points for part swapping (wheels, paint, etc.)
    anchors?: {
        wheels?: Array<{
            name: string;                    // "front_left", "front_right", etc.
            center: [number, number, number]; // 3D position
            radius: number;                   // Wheel radius in meters
        }>;
    } | null;

    // Metadata
    createdAt: Timestamp;
    updatedAt: Timestamp;
    error?: string | null;
}

/**
 * GENERATE CAR MODEL REQUEST
 * ===========================
 * Input for generateCarModel Cloud Function
 */
export interface GenerateCarModelRequest {
    carId: string;
    photoPaths: string[];  // Firebase Storage object paths
}

/**
 * GENERATE CAR MODEL RESPONSE
 * ============================
 * Output from generateCarModel Cloud Function
 */
export interface GenerateCarModelResponse {
    jobId: string;
    status: RenderJobStatus;
}
