// src/hooks/useTier.ts
// Hook for accessing user tier and enforcing limits

import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { TierName } from '../config/entitlements';
import { TIER_LIMITS, getEffectiveVehicleLimit } from '../config/entitlements';
import { auth, db } from '../services/firebaseConfig';

export interface TierState {
    tier: TierName;
    extraVehicleSlots: number;
    limits: typeof TIER_LIMITS[TierName];
    effectiveVehicleLimit: number;
    isLoading: boolean;
}

/**
 * Hook to get current user's tier and limits
 * Defaults to 'free' for unauthenticated users
 */
export function useTier(): TierState {
    const [tierState, setTierState] = useState<TierState>({
        tier: 'free',
        extraVehicleSlots: 0,
        limits: TIER_LIMITS.free,
        effectiveVehicleLimit: 0,
        isLoading: true,
    });

    useEffect(() => {
        const user = auth?.currentUser;

        // Unauthenticated = free tier
        if (!user || !db) {
            setTierState({
                tier: 'free',
                extraVehicleSlots: 0,
                limits: TIER_LIMITS.free,
                effectiveVehicleLimit: 0,
                isLoading: false,
            });
            return;
        }

        // Subscribe to user document for tier changes
        const userRef = doc(db, 'users', user.uid);
        const unsubscribe = onSnapshot(
            userRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.data();
                    const tier = (data.tier || 'free') as TierName;
                    const extraSlots = data.extraVehicleSlots || 0;

                    setTierState({
                        tier,
                        extraVehicleSlots: extraSlots,
                        limits: TIER_LIMITS[tier],
                        effectiveVehicleLimit: getEffectiveVehicleLimit(tier, extraSlots),
                        isLoading: false,
                    });
                } else {
                    // User doc doesn't exist yet, default to free
                    setTierState({
                        tier: 'free',
                        extraVehicleSlots: 0,
                        limits: TIER_LIMITS.free,
                        effectiveVehicleLimit: 0,
                        isLoading: false,
                    });
                }
            },
            (error) => {
                console.error('[useTier] Error loading tier:', error);
                // Fallback to free on error
                setTierState({
                    tier: 'free',
                    extraVehicleSlots: 0,
                    limits: TIER_LIMITS.free,
                    effectiveVehicleLimit: 0,
                    isLoading: false,
                });
            }
        );

        return () => unsubscribe();
    }, []);

    return tierState;
}
