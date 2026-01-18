// src/hooks/useBuildState.ts
// Hook for managing build state (active parts + tier limits)

import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import type { PartAsset } from '../data/partsCatalog';
import { useTier } from './useTier';

export interface BuildState {
    activeParts: PartAsset[];
    addPart: (part: PartAsset) => boolean;
    removePart: (partId: string) => void;
    togglePart: (part: PartAsset) => void;
    clearParts: () => void;
    canAddPart: () => boolean;
}

export function useBuildState(): BuildState {
    const [activeParts, setActiveParts] = useState<PartAsset[]>([]);
    const { limits } = useTier();

    const canAddPart = useCallback(() => {
        return activeParts.length < limits.maxActiveParts;
    }, [activeParts.length, limits.maxActiveParts]);

    const addPart = useCallback(
        (part: PartAsset): boolean => {
            // Check if already active
            if (activeParts.find((p) => p.id === part.id)) {
                return false;
            }

            // Check tier limit
            if (!canAddPart()) {
                Alert.alert(
                    'Parts Limit Reached',
                    `You can only have ${limits.maxActiveParts} active parts at a time. Remove a part to add another.`
                );
                return false;
            }

            setActiveParts((prev) => [...prev, part]);
            return true;
        },
        [activeParts, canAddPart, limits.maxActiveParts]
    );

    const removePart = useCallback((partId: string) => {
        setActiveParts((prev) => prev.filter((p) => p.id !== partId));
    }, []);

    const togglePart = useCallback(
        (part: PartAsset) => {
            const existing = activeParts.find((p) => p.id === part.id);
            if (existing) {
                removePart(part.id);
            } else {
                addPart(part);
            }
        },
        [activeParts, addPart, removePart]
    );

    const clearParts = useCallback(() => {
        setActiveParts([]);
    }, []);

    return {
        activeParts,
        addPart,
        removePart,
        togglePart,
        clearParts,
        canAddPart,
    };
}
