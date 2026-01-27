
import { Image } from 'expo-image';
import React, { useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    PanResponder,
    StyleSheet,
    Text,
    View
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface BuildViewer360Props {
    imageUrls: string[];
    initialIndex?: number;
}

/**
 * 360° Viewer for Builds
 * Optimized for pre-resolved URL arrays
 */
const BuildViewer360Component: React.FC<BuildViewer360Props> = ({
    imageUrls = [],
    initialIndex = 0,
}) => {
    // State
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    // Animation refs
    const dragOffset = useRef(new Animated.Value(0)).current;

    // Setup PanResponder for drag gestures
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                dragOffset.setOffset(0);
                dragOffset.setValue(0);
            },
            onPanResponderMove: (_, gestureState) => {
                // Calculate rotational delta based on drag distance
                // SENSITIVITY: 1 full width = complete rotation (approx)
                // Actually let's make it more sensitive: 1/2 width = full rotation
                const ROTATION_SENSITIVITY = 15; // pixels per frame

                const rawDelta = -gestureState.dx; // Drag left = rotate right (index increases)
                const framesDelta = Math.round(rawDelta / ROTATION_SENSITIVITY);

                if (framesDelta !== 0) {
                    // We don't want to update state on every pixel, maybe just visual feedback?
                    // For simple implementation, we can update state if we want instant feedback
                    // But strictly speaking, updating state on every move can be jittery if valid renders aren't loaded.
                    // But we have URLs.
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                // Calculate final index change
                const ROTATION_SENSITIVITY = 30; // pixels per index step
                const rawDelta = -gestureState.dx;
                const steps = Math.round(rawDelta / ROTATION_SENSITIVITY);

                if (steps !== 0 && imageUrls.length > 0) {
                    setCurrentIndex(prev => {
                        let next = (prev + steps) % imageUrls.length;
                        if (next < 0) next += imageUrls.length;
                        return next;
                    });
                }
            }
        })
    ).current;

    // Direct pan responder move handling was tricky with React state updates in render
    // Let's rely on Release for large jumps, or better:
    // Real-time update logic:

    const lastX = useRef(0);
    const realTimePanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (_, gestureState) => {
                lastX.current = gestureState.x0;
            },
            onPanResponderMove: (_, gestureState) => {
                const currentX = gestureState.moveX;
                const delta = lastX.current - currentX; // drag left (positive) -> next index
                const sensitivity = 20; // 20px per frame

                if (Math.abs(delta) > sensitivity) {
                    const steps = Math.floor(Math.abs(delta) / sensitivity) * Math.sign(delta);
                    if (steps !== 0) {
                        setCurrentIndex(prev => {
                            let next = (prev + steps) % imageUrls.length;
                            if (next < 0) next += imageUrls.length;
                            return next;
                        });
                        lastX.current = currentX; // Reset base
                    }
                }
            },
            onPanResponderTerminationRequest: () => false,
            onPanResponderRelease: () => { },
        })
    ).current;


    const goToPreviousAngle = () => {
        setCurrentIndex(prev => {
            let next = prev - 1;
            if (next < 0) next = imageUrls.length - 1;
            return next;
        });
    };

    const goToNextAngle = () => {
        setCurrentIndex(prev => (prev + 1) % imageUrls.length);
    };

    if (!imageUrls || imageUrls.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>No renders available</Text>
            </View>
        );
    }

    const currentUrl = imageUrls[currentIndex];

    return (
        <View style={styles.container} {...realTimePanResponder.panHandlers}>
            <Image
                source={{ uri: currentUrl }}
                style={styles.image}
                contentFit="contain"
                transition={50} // Fast transition for rotation
            />

            {/* Controls Overlay */}
            <View style={[styles.arrowButton, styles.leftArrow]} onTouchEnd={goToPreviousAngle}>
                <Text style={styles.arrowText}>←</Text>
            </View>

            <View style={[styles.arrowButton, styles.rightArrow]} onTouchEnd={goToNextAngle}>
                <Text style={styles.arrowText}>→</Text>
            </View>

            {/* Debug / Index Info */}
            <View style={styles.debugInfo}>
                <Text style={styles.debugText}>
                    {currentIndex + 1}/{imageUrls.length}
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
        marginTop: -25,
        width: 50,
        height: 50,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 25,
        zIndex: 10,
    },
    leftArrow: {
        left: 10,
    },
    rightArrow: {
        right: 10,
    },
    arrowText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
});

export default BuildViewer360Component;
