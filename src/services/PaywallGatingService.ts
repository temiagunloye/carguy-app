// src/services/PaywallGatingService.ts

/**
 * Centralized service for tier-based feature gating
 * Handles plan limitations and upgrade messaging
 */

export type UserTier = 'free' | 'pro' | 'premium';

export interface TierLimits {
    canAccessStandardCars: boolean;
    canUploadCar: boolean;
    maxSavedParts: number | 'unlimited';
    maxBuilds: number | 'unlimited';
    maxVehicleSlots: number | 'unlimited';
}

class PaywallGatingService {
    /**
     * Get tier limits for a given user tier
     */
    getTierLimits(tier: UserTier): TierLimits {
        switch (tier) {
            case 'free':
                return {
                    canAccessStandardCars: true,
                    canUploadCar: false,
                    maxSavedParts: 3,
                    maxBuilds: 1,
                    maxVehicleSlots: 0, // Free tier cannot upload vehicles
                };
            case 'pro':
                return {
                    canAccessStandardCars: true,
                    canUploadCar: true,
                    maxSavedParts: 'unlimited',
                    maxBuilds: 'unlimited',
                    maxVehicleSlots: 5,
                };
            case 'premium':
                return {
                    canAccessStandardCars: true,
                    canUploadCar: true,
                    maxSavedParts: 'unlimited',
                    maxBuilds: 'unlimited',
                    maxVehicleSlots: 'unlimited',
                };
            default:
                // Default to free tier
                return this.getTierLimits('free');
        }
    }

    /**
     * Check if user can access standard dealer cars
     */
    canAccessStandardCars(tier: UserTier): boolean {
        return this.getTierLimits(tier).canAccessStandardCars;
    }

    /**
     * Check if user can upload their own car
     */
    canUploadCar(tier: UserTier): boolean {
        return this.getTierLimits(tier).canUploadCar;
    }

    /**
     * Get maximum number of saved parts for tier
     */
    getMaxSavedParts(tier: UserTier): number | 'unlimited' {
        return this.getTierLimits(tier).maxSavedParts;
    }

    /**
     * Get maximum number of builds for tier
     */
    getMaxBuilds(tier: UserTier): number | 'unlimited' {
        return this.getTierLimits(tier).maxBuilds;
    }

    /**
     * Get maximum number of vehicle slots for tier
     */
    getMaxVehicleSlots(tier: UserTier): number | 'unlimited' {
        return this.getTierLimits(tier).maxVehicleSlots;
    }

    /**
     * Get contextual upgrade message for a specific feature
     */
    getUpgradeMessage(feature: string, currentTier: UserTier): string {
        switch (feature) {
            case 'upload_car':
                return 'Upgrade to Pro to scan and upload your own vehicle with our 10-angle photo capture.';
            case 'unlimited_parts':
                return 'Upgrade to Pro for unlimited part customizations and multiple saved builds.';
            case 'extra_builds':
                return 'Free users can only save 1 build. Upgrade to Pro for unlimited builds.';
            case 'extra_parts':
                return 'Free users can save up to 3 parts (paint + wheels + one cosmetic). Upgrade to Pro for unlimited parts.';
            case 'extra_vehicles':
                return 'Upgrade to Pro to upload up to 5 vehicles, or Premium for unlimited vehicles.';
            default:
                return 'Upgrade to Pro to unlock this feature and much more!';
        }
    }

    /**
     * Get upgrade CTA button text
     */
    getUpgradeButtonText(currentTier: UserTier): string {
        switch (currentTier) {
            case 'free':
                return 'Upgrade to Pro';
            case 'pro':
                return 'Upgrade to Premium';
            case 'premium':
                return 'Manage Subscription';
            default:
                return 'Upgrade';
        }
    }

    /**
     * Check if a feature is available for the user's tier
     */
    isFeatureAvailable(feature: string, tier: UserTier): boolean {
        const limits = this.getTierLimits(tier);

        switch (feature) {
            case 'standard_cars':
                return limits.canAccessStandardCars;
            case 'upload_car':
                return limits.canUploadCar;
            case 'unlimited_parts':
                return limits.maxSavedParts === 'unlimited';
            case 'unlimited_builds':
                return limits.maxBuilds === 'unlimited';
            case 'unlimited_vehicles':
                return limits.maxVehicleSlots === 'unlimited';
            default:
                return false;
        }
    }

    /**
     * Get feature comparison for upgrade screen
     */
    getFeatureComparison() {
        return [
            {
                feature: 'Browse Standard Dealer Cars',
                free: true,
                pro: true,
                premium: true,
            },
            {
                feature: 'Try Parts in Sandbox',
                free: true,
                pro: true,
                premium: true,
            },
            {
                feature: 'Saved Parts Limit',
                free: '3 parts max',
                pro: 'Unlimited',
                premium: 'Unlimited',
            },
            {
                feature: 'Active Builds',
                free: '1 build',
                pro: 'Unlimited',
                premium: 'Unlimited',
            },
            {
                feature: 'Upload Your Own Car',
                free: false,
                pro: true,
                premium: true,
            },
            {
                feature: 'Vehicle Slots',
                free: '0',
                pro: '5',
                premium: 'Unlimited',
            },
            {
                feature: '360° Photo Viewer',
                free: true,
                pro: true,
                premium: true,
            },
            {
                feature: 'Premium Support',
                free: false,
                pro: false,
                premium: true,
            },
        ];
    }
}

// Export singleton instance
export const paywallGatingService = new PaywallGatingService();
export default paywallGatingService;
