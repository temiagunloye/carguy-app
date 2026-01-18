// src/components/Viewer360Component.tsx

import { Image } from 'expo-image';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    PanResponder,
    PanResponderGestureState,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import standardCarLibraryService from '../services/StandardCarLibraryService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Viewer360Props {
    variantId: string;
    angleNames: string[];
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
    initialAngle,
    onAngleChange,
    enablePreload = true,
    preloadRadius = 2,
}) => {
    // State
    const [currentAngleIndex, setCurrentAngleIndex] = useState<number>(() => {
        if (initialAngle) {
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

    // Constants
    const DRAG_SENSITIVITY = SCREEN_WIDTH / angleNames.length; // Pixels per angle
    const SNAP_DURATION = 200; // ms

    /**
     * Load asset URL for a specific angle
     */
    const loadAngleAsset = useCallback(
        async (angleIndex: number): Promise<string | null> => {
            if (loadedAngles.has(angleIndex)) {
                return loadedAngles.get(angleIndex) || null;
            }

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
        },
        [variantId, angleNames, loadedAngles]
    );

    /**
     * Preload adjacent angles for smooth rotation
     */
    const preloadAdjacentAngles = useCallback(
        async (centerIndex: number) => {
            if (!enablePreload) return;

            const totalAngles = angleNames.length;
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
        [angleNames.length, loadedAngles, loadingAngles, enablePreload, preloadRadius, loadAngleAsset]
    );

    /**
     * Unload angles far from current view to save memory
     */
    const unloadDistantAngles = useCallback(
        (centerIndex: number) => {
            const totalAngles = angleNames.length;
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
        [angleNames.length, preloadRadius]
    );

    /**
     * Initialize: load initial angle and preload adjacent
     */
    useEffect(() => {
        const init = async () => {
            setIsInitialLoading(true);
            await loadAngleAsset(currentAngleIndex);
            await preloadAdjacentAngles(currentAngleIndex);
            setIsInitialLoading(false);
        };

        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [variantId]); // Re-init when variant changes

    /**
     * Snap to nearest angle with animation
     */
    const snapToAngle = useCallback(
        (targetIndex: number) => {
            const totalAngles = angleNames.length;
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
                onAngleChange(angleNames[normalizedIndex], normalizedIndex);
            }

            // Preload adjacent angles
            preloadAdjacentAngles(normalizedIndex);

            // Unload distant angles
            unloadDistantAngles(normalizedIndex);
        },
        [angleNames, rotationAnim, onAngleChange, preloadAdjacentAngles, unloadDistantAngles]
    );

    /**
     * Pan Responder for drag gestures
     */
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,

            onPanResponderGrant: () => {
                isDragging.current = true;
                dragOffset.current = 0;
            },

            onPanResponderMove: (_, gestureState: PanResponderGestureState) => {
                const { dx } = gestureState;
                dragOffset.current = dx;

                // Calculate angle change based on drag distance
                const angleChange = -dx / DRAG_SENSITIVITY; // Negative for natural direction
                const totalAngles = angleNames.length;

                // Calculate target index with wraparound
                const rawIndex = currentAngleIndex + angleChange;
                const targetIndex = ((rawIndex % totalAngles) + totalAngles) % totalAngles;

                rotationAnim.setValue(targetIndex);

                // Update current index discretely
                const discreteIndex = Math.round(targetIndex);
                const normalizedIndex = ((discreteIndex % totalAngles) + totalAngles) % totalAngles;

                if (normalizedIndex !== currentAngleIndex) {
                    setCurrentAngleIndex(normalizedIndex);
                    // Load this angle if not already loaded
                    loadAngleAsset(normalizedIndex);
                }
            },

            onPanResponderRelease: () => {
                isDragging.current = false;

                // Snap to nearest angle
                const currentValue = (rotationAnim as any)._value;
                const totalAngles = angleNames.length;
                const nearestIndex = Math.round(currentValue);
                const normalizedIndex = ((nearestIndex % totalAngles) + totalAngles) % totalAngles;

                snapToAngle(normalizedIndex);
            },

            onPanResponderTerminate: () => {
                isDragging.current = false;
                snapToAngle(currentAngleIndex);
            },
        })
    ).current;

    /**
     * Get current angle URL
     */
    const currentAngleUrl = loadedAngles.get(currentAngleIndex);

    /**
     * Find closest loaded angle if current is missing (fallback)
     */
    const getFallbackAngleUrl = useCallback((): string | null => {
        if (loadedAngles.size === 0) return null;

        // Try to find closest loaded angle
        const totalAngles = angleNames.length;
        for (let radius = 1; radius < totalAngles; radius++) {
            const index1 = (currentAngleIndex + radius) % totalAngles;
            const index2 = (currentAngleIndex - radius + totalAngles) % totalAngles;

            if (loadedAngles.has(index1)) return loadedAngles.get(index1) || null;
            if (loadedAngles.has(index2)) return loadedAngles.get(index2) || null;
        }

        // Return any loaded angle
        return Array.from(loadedAngles.values())[0] || null;
    }, [loadedAngles, currentAngleIndex, angleNames.length]);

    const displayUrl = currentAngleUrl || getFallbackAngleUrl();

    return (
        <View style={styles.container} {...panResponder.panHandlers}>
            {isInitialLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Loading 360° viewer...</Text>
                </View>
            ) : displayUrl ? (
                <Image
                    source={{ uri: displayUrl }}
                    style={styles.image}
                    contentFit="contain"
                    transition={100}
                    priority="high"
                />
            ) : (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Unable to load image</Text>
                </View>
            )}

            {/* Debug info (optional - can remove in production) */}
            {__DEV__ && (
                <View style={styles.debugInfo}>
                    <Text style={styles.debugText}>
                        Angle: {angleNames[currentAngleIndex]} ({currentAngleIndex + 1}/{angleNames.length})
                    </Text>
                    <Text style={styles.debugText}>Loaded: {loadedAngles.size} angles</Text>
                </View>
            )}
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
});

export default Viewer360Component;
