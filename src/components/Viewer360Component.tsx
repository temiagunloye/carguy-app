// src/components/Viewer360Component.tsx

import { Image } from 'expo-image';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import standardCarLibraryService from '../services/StandardCarLibraryService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Viewer360Props {
    variantId?: string;
    angleNames?: string[];
    imageUrls?: string[]; // Direct URL mode (Overrides variantId/angleNames)
    initialAngle?: string;
    onAngleChange?: (angleName: string, angleIndex: number) => void;
    enablePreload?: boolean;
    preloadRadius?: number;
}

/**
 * 360° Viewer Component
 * 
 * Features:
 * - Smooth drag-to-rotate with gesture handling
 * - Snap to nearest angle on release
 * - Infinite wraparound loop
 * - Adjacent frame preloading
 * - Memory management (unload far angles)
 */
const Viewer360Component: React.FC<Viewer360Props> = ({
    variantId,
    angleNames,
    imageUrls,
    initialAngle,
    onAngleChange,
    enablePreload = true,
    preloadRadius = 2,
}) => {
    // State
    const totalAngles = imageUrls?.length || angleNames?.length || 0;

    const [currentAngleIndex, setCurrentAngleIndex] = useState<number>(() => {
        if (initialAngle && angleNames) {
            const index = angleNames.indexOf(initialAngle);
            return index >= 0 ? index : 0;
        }
        return 0;
    });

    const [loadedAngles, setLoadedAngles] = useState<Map<number, string>>(new Map());
    const [loadingAngles, setLoadingAngles] = useState<Set<number>>(new Set());
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    // Animation refs
    const dragOffset = useRef(0);
    const rotationAnim = useRef(new Animated.Value(currentAngleIndex)).current;
    const isDragging = useRef(false);

    // Constants - Increased sensitivity for faster, smoother rotation
    const DRAG_SENSITIVITY = SCREEN_WIDTH / 3;
    const SNAP_DURATION = 200; // ms

    /**
     * Load asset URL for a specific angle
     */
    const loadAngleAsset = useCallback(
        async (angleIndex: number): Promise<string | null> => {
            if (loadedAngles.has(angleIndex)) {
                return loadedAngles.get(angleIndex) || null;
            }

            // Mode 1: Direct URLs (Manifest)
            if (imageUrls && imageUrls.length > angleIndex) {
                const url = imageUrls[angleIndex];
                setLoadedAngles((prev) => new Map(prev).set(angleIndex, url));
                return url;
            }

            // Mode 2: Legacy Variant/AngleNames
            if (angleNames && variantId) {
                const angleName = angleNames[angleIndex];
                if (!angleName) return null;

                try {
                    const url = await standardCarLibraryService.resolveAngleAsset(variantId, angleName);
                    setLoadedAngles((prev) => new Map(prev).set(angleIndex, url));
                    return url;
                } catch (error) {
                    console.error(`Failed to load angle ${angleName}:`, error);
                    return null;
                }
            }

            return null;
        },
        [variantId, angleNames, imageUrls, loadedAngles]
    );

    /**
     * Preload adjacent angles for smooth rotation
     */
    const preloadAdjacentAngles = useCallback(
        async (centerIndex: number) => {
            if (!enablePreload || totalAngles === 0) return;

            const anglesToLoad: number[] = [];

            for (let offset = -preloadRadius; offset <= preloadRadius; offset++) {
                if (offset === 0) continue; // Skip current angle (already loaded)
                const targetIndex = (centerIndex + offset + totalAngles) % totalAngles;

                if (!loadedAngles.has(targetIndex) && !loadingAngles.has(targetIndex)) {
                    anglesToLoad.push(targetIndex);
                }
            }

            if (anglesToLoad.length === 0) return;

            // Mark as loading
            setLoadingAngles((prev) => {
                const next = new Set(prev);
                anglesToLoad.forEach((idx) => next.add(idx));
                return next;
            });

            // Load in parallel
            await Promise.all(
                anglesToLoad.map(async (idx) => {
                    await loadAngleAsset(idx);
                    setLoadingAngles((prev) => {
                        const next = new Set(prev);
                        next.delete(idx);
                        return next;
                    });
                })
            );
        },
        [totalAngles, loadedAngles, loadingAngles, enablePreload, preloadRadius, loadAngleAsset]
    );

    /**
     * Unload angles far from current view to save memory
     */
    const unloadDistantAngles = useCallback(
        (centerIndex: number) => {
            if (totalAngles === 0) return;
            const maxDistance = preloadRadius + 1;

            setLoadedAngles((prev) => {
                const next = new Map(prev);
                const anglesToUnload: number[] = [];

                prev.forEach((_, angleIndex) => {
                    // Calculate distance with wraparound
                    const dist1 = Math.abs(angleIndex - centerIndex);
                    const dist2 = totalAngles - dist1;
                    const minDist = Math.min(dist1, dist2);

                    if (minDist > maxDistance) {
                        anglesToUnload.push(angleIndex);
                    }
                });

                anglesToUnload.forEach((idx) => next.delete(idx));
                return next;
            });
        },
        [totalAngles, preloadRadius]
    );

    /**
     * Initialize: load initial angle and preload adjacent
     */
    useEffect(() => {
        const init = async () => {
            if (totalAngles === 0) return;
            setIsInitialLoading(true);
            await loadAngleAsset(currentAngleIndex);
            await preloadAdjacentAngles(currentAngleIndex);
            setIsInitialLoading(false);
        };

        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [variantId, imageUrls]); // Re-init when variant or URLs changes

    /**
     * Snap to nearest angle with animation
     */
    const snapToAngle = useCallback(
        (targetIndex: number) => {
            if (totalAngles === 0) return;
            const normalizedIndex = ((targetIndex % totalAngles) + totalAngles) % totalAngles;

            setCurrentAngleIndex(normalizedIndex);

            Animated.spring(rotationAnim, {
                toValue: normalizedIndex,
                useNativeDriver: false,
                speed: 20,
                bounciness: 0,
            }).start();

            // Callback
            if (onAngleChange) {
                // If using imageUrls, we don't really have angleNames. Pass empty or URL?
                const name = angleNames ? angleNames[normalizedIndex] : String(normalizedIndex);
                onAngleChange(name, normalizedIndex);
            }

            // Preload adjacent angles
            preloadAdjacentAngles(normalizedIndex);

            // Unload distant angles
            unloadDistantAngles(normalizedIndex);
        },
        [totalAngles, angleNames, rotationAnim, onAngleChange, preloadAdjacentAngles, unloadDistantAngles]
    );

    /**
     * Navigate to previous angle
     */
    const goToPreviousAngle = useCallback(() => {
        if (totalAngles === 0) return;
        const newIndex = (currentAngleIndex - 1 + totalAngles) % totalAngles;
        snapToAngle(newIndex);
    }, [currentAngleIndex, totalAngles, snapToAngle]);

    /**
     * Navigate to next angle
     */
    const goToNextAngle = useCallback(() => {
        if (totalAngles === 0) return;
        const newIndex = (currentAngleIndex + 1) % totalAngles;
        snapToAngle(newIndex);
    }, [currentAngleIndex, totalAngles, snapToAngle]);

    /**
     * Get current angle URL
     */
    const currentAngleUrl = loadedAngles.get(currentAngleIndex);

    /**
     * Find closest loaded angle if current is missing (fallback)
     */
    const getFallbackAngleUrl = useCallback((): string | null => {
        if (loadedAngles.size === 0 || totalAngles === 0) return null;

        // Try to find closest loaded angle
        for (let radius = 1; radius < totalAngles; radius++) {
            const index1 = (currentAngleIndex + radius) % totalAngles;
            const index2 = (currentAngleIndex - radius + totalAngles) % totalAngles;

            if (loadedAngles.has(index1)) return loadedAngles.get(index1) || null;
            if (loadedAngles.has(index2)) return loadedAngles.get(index2) || null;
        }

        // Return any loaded angle
        return Array.from(loadedAngles.values())[0] || null;
    }, [loadedAngles, currentAngleIndex, totalAngles]);

    const displayUrl = currentAngleUrl || getFallbackAngleUrl();

    return (
        <View style={styles.container}>
            {isInitialLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Loading 360° viewer...</Text>
                </View>
            ) : displayUrl ? (
                <>
                    <Image
                        source={{ uri: displayUrl }}
                        style={styles.image}
                        contentFit="contain"
                        transition={100}
                        priority="high"
                    />

                    {/* Left Arrow Button */}
                    <TouchableOpacity
                        style={[styles.arrowButton, styles.leftArrow]}
                        onPress={goToPreviousAngle}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.arrowText}>←</Text>
                    </TouchableOpacity>

                    {/* Right Arrow Button */}
                    <TouchableOpacity
                        style={[styles.arrowButton, styles.rightArrow]}
                        onPress={goToNextAngle}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.arrowText}>→</Text>
                    </TouchableOpacity>
                </>
            ) : (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Unable to load image</Text>
                </View>
            )}

            {/* Angle Indicator */}
            <View style={styles.debugInfo}>
                <Text style={styles.debugText}>
                    {currentAngleIndex + 1}/{totalAngles}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#fff',
        fontSize: 14,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: '#ff4444',
        fontSize: 14,
    },
    debugInfo: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 8,
        borderRadius: 4,
    },
    debugText: {
        color: '#fff',
        fontSize: 10,
        fontFamily: 'monospace',
    },
    arrowButton: {
        position: 'absolute',
        top: '50%',
        transform: [{ translateY: -25 }],
        width: 50,
        height: 50,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 25,
    },
    leftArrow: {
        left: 16,
    },
    rightArrow: {
        right: 16,
    },
    arrowText: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
    },
});

export default Viewer360Component;
