// src/types/car.ts
// TypeScript types for car data model and 3D rendering state machine

/**
 * RENDER STATUS STATE MACHINE
 * ===========================
 * 
 * State transitions:
 * draft → pending → processing → ready
 *                              ↓
 *                            error
 * 
 * - draft: Car created, photos not yet uploaded
 * - pending: All 10 photos uploaded, waiting for processing to start
 * - processing: 3D model generation in progress
 * - ready: 3D model available at modelUrl
 * - error: Processing failed, see renderError
 */
export type RenderStatus = 'draft' | 'pending' | 'processing' | 'ready' | 'error';

/**
 * USER TIER (from plan system)
 * - free: Base/dealer model fallback only
 * - pro: Custom 3D from user photos
 * - premium: Custom 3D from user photos
 */
export type UserTier = 'free' | 'pro' | 'premium';

/**
 * PHOTO ANGLE KEYS
 * ================
 * These keys MUST match the IDs defined in src/features/carScan/carScanConfig.js
 * DO NOT rename these keys. They are used throughout the capture/upload/processing pipeline.
 * 
 * The 10 mandatory angles are:
 * - driver_front
 * - passenger_front
 * - driver_rear
 * - passenger_rear
 * - full_driver_side
 * - full_passenger_side
 * - front_center
 * - rear_center
 * - front_low
 * - rear_low
 */
export type PhotoAngleKey =
    | 'driver_front'
    | 'passenger_front'
    | 'driver_rear'
    | 'passenger_rear'
    | 'full_driver_side'
    | 'full_passenger_side'
    | 'front_center'
    | 'rear_center'
    | 'front_low'
    | 'rear_low';

/**
 * PHOTO ANGLES RECORD
 * Maps angle keys to Firebase Storage URLs (or null if not yet uploaded)
 */
export type PhotoAngles = Record<PhotoAngleKey, string | null>;

/**
 * CAR DOCUMENT (Firestore: cars/{carId})
 * =======================================
 * Complete data model for a user's car in Firestore.
 * This is the single source of truth for car data and 3D rendering state.
 */
export interface CarDocument {
    // Identity
    userId: string;

    // Car details
    make: string;
    model: string;
    year: number;
    trim: string | null;

    // User tier (determines if custom 3D is allowed)
    tier: UserTier;

    // Photo uploads (keys from carScanConfig.js, values are Firebase Storage URLs)
    photoAngles: PhotoAngles;

    // Base model reference (for garage cars)
    baseModelId: string | null;  // Reference to baseModels/{baseModelId}

    // 3D rendering state
    renderStatus: RenderStatus;
    renderError: string | null;
    modelUrl: string | null;  // Firebase Storage URL to .glb file

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
}

/**
 * PARTIAL UPDATE TYPE
 * For createOrUpdateCarDoc function
 */
export type CarDocumentUpdate = Partial<Omit<CarDocument, 'userId' | 'createdAt'>>;
