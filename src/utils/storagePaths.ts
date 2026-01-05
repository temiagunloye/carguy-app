// src/utils/storagePaths.ts
// Pure functions for generating Firebase Storage paths
// NO side effects, NO Firebase SDK imports - just path string generation

/**
 * STORAGE PATH STRUCTURE
 * ======================
 * 
 * Photos: users/{userId}/cars/{carId}/photos/{angleKey}.jpg
 * Models: users/{userId}/cars/{carId}/models/main.glb
 * 
 * This structure:
 * - Isolates user data by userId
 * - Groups car assets by carId
 * - Separates photos and models into subdirectories
 * - Uses consistent file extensions (.jpg for photos, .glb for models)
 */

/**
 * Get Firebase Storage path for a car photo
 * 
 * @param userId - User's Firebase Auth UID
 * @param carId - Car document ID
 * @param angleKey - Photo angle key (must match carScanConfig.js IDs)
 * @returns Storage path string (e.g., "users/abc123/cars/car456/photos/driver_front.jpg")
 */
export function getCarPhotoPath(
    userId: string,
    carId: string,
    angleKey: string
): string {
    return `users/${userId}/cars/${carId}/photos/${angleKey}.jpg`;
}

/**
 * Get Firebase Storage path for a car's 3D model
 * 
 * @param userId - User's Firebase Auth UID
 * @param carId - Car document ID
 * @returns Storage path string (e.g., "users/abc123/cars/car456/models/main.glb")
 */
export function getCarModelPath(
    userId: string,
    carId: string
): string {
    return `users/${userId}/cars/${carId}/models/main.glb`;
}

/**
 * Get all photo paths for a car (useful for batch operations)
 * 
 * @param userId - User's Firebase Auth UID
 * @param carId - Car document ID
 * @param angleKeys - Array of angle keys
 * @returns Object mapping angle keys to storage paths
 */
export function getAllCarPhotoPaths(
    userId: string,
    carId: string,
    angleKeys: string[]
): Record<string, string> {
    const paths: Record<string, string> = {};
    angleKeys.forEach(angleKey => {
        paths[angleKey] = getCarPhotoPath(userId, carId, angleKey);
    });
    return paths;
}
