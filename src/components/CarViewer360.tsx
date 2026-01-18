// src/components/CarViewer360.tsx
// Pseudo-360 viewer with horizontal swipe and parts overlay

import React, { useCallback, useRef, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    View,
    ViewToken,
} from 'react-native';
import type { DemoCarAngle } from '../data/demoCars';
import { anchorToPixels, getAnchorForPart } from '../data/partAnchors';
import type { PartAsset } from '../data/partsCatalog';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CarViewer360Props {
    angles: DemoCarAngle[];
    activeParts: PartAsset[];
}

export function CarViewer360({ angles, activeParts }: CarViewer360Props) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    // Track viewable items for preloading
    const onViewableItemsChanged = useCallback(
        ({ viewableItems }: { viewableItems: ViewToken[] }) => {
            if (viewableItems.length > 0) {
                setCurrentIndex(viewableItems[0].index || 0);
            }
        },
        []
    );

    const viewabilityConfig = {
        itemVisiblePercentThreshold: 50,
    };

    const renderAngle = ({ item, index }: { item: DemoCarAngle; index: number }) => {
        const isVisible = Math.abs(index - currentIndex) <= 1; // Render current + adjacent

        return (
            <View style={styles.angleContainer}>
                {/* Base car image */}
                <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.carImage}
                    resizeMode="contain"
                />

                {/* Parts overlays */}
                {isVisible && activeParts.map((part) => {
                    const anchor = getAnchorForPart(item.angleKey, part.category);
                    if (!anchor) return null;

                    // Convert normalized anchor to pixels
                    const imageWidth = SCREEN_WIDTH;
                    const imageHeight = SCREEN_WIDTH * 0.75; // 4:3 aspect ratio
                    const position = anchorToPixels(anchor, imageWidth, imageHeight);

                    return (
                        <Image
                            key={part.id}
                            source={{ uri: part.overlayUrl }}
                            style={[
                                styles.partOverlay,
                                {
                                    left: position.left,
                                    top: position.top,
                                    width: position.width,
                                    height: position.height,
                                    transform: [{ rotate: `${anchor.rotation || 0}deg` }],
                                },
                            ]}
                            resizeMode="contain"
                        />
                    );
                })}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={angles}
                renderItem={renderAngle}
                keyExtractor={(item) => item.angleKey}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                snapToInterval={SCREEN_WIDTH}
                decelerationRate="fast"
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                getItemLayout={(data, index) => ({
                    length: SCREEN_WIDTH,
                    offset: SCREEN_WIDTH * index,
                    index,
                })}
            />

            {/* Angle indicator */}
            <View style={styles.indicatorContainer}>
                {angles.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.indicatorDot,
                            index === currentIndex && styles.indicatorDotActive,
                        ]}
                    />
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    angleContainer: {
        width: SCREEN_WIDTH,
        height: SCREEN_WIDTH * 0.75,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
    },
    carImage: {
        width: '100%',
        height: '100%',
    },
    partOverlay: {
        position: 'absolute',
    },
    indicatorContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    indicatorDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#444',
    },
    indicatorDotActive: {
        backgroundColor: '#4a9eff',
        width: 10,
        height: 10,
    },
});
