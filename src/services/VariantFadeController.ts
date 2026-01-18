// src/services/VariantFadeController.ts

import { Animated } from 'react-native';
import standardCarLibraryService from './StandardCarLibraryService';

/**
 * Controller for smooth fade transitions between paint variants
 * Maintains rotation angle during color changes
 */

export interface FadeTransitionOptions {
    duration?: number; // Default 300ms
    onComplete?: () => void;
    onError?: (error: Error) => void;
}

class VariantFadeController {
    /**
     * Transition from one variant to another while maintaining the current angle
     * 
     * @param fromVariantId - Current variant ID
     * @param toVariantId - Target variant ID
     * @param currentAngleName - The angle to maintain during transition
     * @param options - Transition options
     * @returns Promise that resolves when transition is complete
     */
    async transitionToVariant(
        fromVariantId: string,
        toVariantId: string,
        currentAngleName: string,
        options: FadeTransitionOptions = {}
    ): Promise<{
        success: boolean;
        targetAngleUrl?: string;
        error?: Error;
    }> {
        const { duration = 300, onComplete, onError } = options;

        try {
            // Preload the target variant's current angle before fading
            const targetAngleUrl = await standardCarLibraryService.resolveAngleAsset(
                toVariantId,
                currentAngleName
            );

            if (!targetAngleUrl) {
                throw new Error(
                    `Failed to load angle ${currentAngleName} for variant ${toVariantId}`
                );
            }

            // Return success with the preloaded URL
            // The actual fade animation will be handled by the component
            if (onComplete) {
                setTimeout(onComplete, duration);
            }

            return { success: true, targetAngleUrl };
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Unknown error');

            if (onError) {
                onError(err);
            }

            return { success: false, error: err };
        }
    }

    /**
     * Preload all angles for a target variant
     * Useful when transitioning to a new variant to ensure smooth rotation
     * 
     * @param variantId - Variant to preload
     * @param angleNames - List of all angle names
     * @param priorityAngleName - Angle to load first (usually current view)
     */
    async preloadVariant(
        variantId: string,
        angleNames: string[],
        priorityAngleName?: string
    ): Promise<void> {
        // Load priority angle first if specified
        if (priorityAngleName) {
            try {
                await standardCarLibraryService.resolveAngleAsset(variantId, priorityAngleName);
            } catch (error) {
                console.warn(`Failed to preload priority angle ${priorityAngleName}:`, error);
            }
        }

        // Load remaining angles in background
        const loadPromises = angleNames
            .filter((angleName) => angleName !== priorityAngleName)
            .map((angleName) =>
                standardCarLibraryService
                    .resolveAngleAsset(variantId, angleName)
                    .catch(() => null) // Ignore errors for background preloading
            );

        await Promise.all(loadPromises);
    }

    /**
     * Create animated crossfade values for component use
     * Returns two Animated.Value instances for opacity control
     */
    createFadeAnimation(duration = 300): {
        fromOpacity: Animated.Value;
        toOpacity: Animated.Value;
        startFade: () => void;
    } {
        const fromOpacity = new Animated.Value(1);
        const toOpacity = new Animated.Value(0);

        const startFade = () => {
            Animated.parallel([
                Animated.timing(fromOpacity, {
                    toValue: 0,
                    duration,
                    useNativeDriver: true,
                }),
                Animated.timing(toOpacity, {
                    toValue: 1,
                    duration,
                    useNativeDriver: true,
                }),
            ]).start();
        };

        return { fromOpacity, toOpacity, startFade };
    }
}

// Export singleton instance
export const variantFadeController = new VariantFadeController();
export default variantFadeController;
