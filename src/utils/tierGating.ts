// src/utils/tierGating.ts
// Tier gating logic and limit checking

import { TIER_LIMITS } from '../config/entitlements';
import { getUserVehicles } from '../services/vehicles';

export interface TierCheckResult {
    allowed: boolean;
    reason?: string;
    currentCount: number;
    limit: number;
}

/**
 * Check if user can create a new scanned vehicle
 */
export async function canCreateScannedVehicle(
    userId: string,
    tier: 'free' | 'pro' | 'premium',
    extraSlots: number = 0
): Promise<TierCheckResult> {
    try {
        const vehicles = await getUserVehicles(userId);
        const scannedVehicles = vehicles.filter(v => v.type === 'scanned');
        const currentCount = scannedVehicles.length;

        const baseLimit = TIER_LIMITS[tier]?.maxVehicles || 0;
        const limit = baseLimit + extraSlots;

        if (currentCount >= limit) {
            return {
                allowed: false,
                reason: 'Vehicle limit reached',
                currentCount,
                limit,
            };
        }

        return {
            allowed: true,
            currentCount,
            limit,
        };
    } catch (error) {
        console.error('Error checking vehicle limit:', error);
        return {
            allowed: false,
            reason: 'Error checking limits',
            currentCount: 0,
            limit: 0,
        };
    }
}

/**
 * Get user's current tier limits
 */
export function getTierLimits(tier: 'free' | 'pro' | 'premium') {
    return TIER_LIMITS[tier] || TIER_LIMITS.free;
}
