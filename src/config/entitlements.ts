// src/config/entitlements.ts
// Single source of truth for tier limits and entitlements

export type TierName = 'free' | 'pro' | 'premium';

export interface TierLimits {
    maxVehicles: number;
    maxBuildsPerVehicle: number;
    maxActiveParts: number;
    requiresAuth: boolean;
    canUploadPhotos: boolean;
    hasInventoryAccess: boolean;
    demoCarsAvailable: number;
}

export const TIER_LIMITS: Record<TierName, TierLimits> = {
    free: {
        maxVehicles: 0, // Demo only
        maxBuildsPerVehicle: 1,
        maxActiveParts: 3,
        requiresAuth: false,
        canUploadPhotos: false,
        hasInventoryAccess: false,
        demoCarsAvailable: 15,
    },
    pro: {
        maxVehicles: 1,
        maxBuildsPerVehicle: 3,
        maxActiveParts: 5,
        requiresAuth: true,
        canUploadPhotos: true,
        hasInventoryAccess: true,
        demoCarsAvailable: 15, // Still accessible
    },
    premium: {
        maxVehicles: 3, // Base, can be extended with extraVehicleSlots
        maxBuildsPerVehicle: 3,
        maxActiveParts: 5,
        requiresAuth: true,
        canUploadPhotos: true,
        hasInventoryAccess: true,
        demoCarsAvailable: 15, // Still accessible
    },
};

export interface UserTierData {
    tier: TierName;
    extraVehicleSlots: number; // Premium add-on (future billing)
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Get effective vehicle limit including add-ons
 */
export function getEffectiveVehicleLimit(tier: TierName, extraSlots: number = 0): number {
    return TIER_LIMITS[tier].maxVehicles + extraSlots;
}

/**
 * Check if tier allows a feature
 */
export function canAccessFeature(tier: TierName, feature: keyof TierLimits): boolean {
    const limit = TIER_LIMITS[tier][feature];
    return typeof limit === 'boolean' ? limit : limit > 0;
}
