// src/data/partAnchors.ts
// Anchor coordinates for part placement across 10 angles
// Coordinates are normalized (0-1) relative to image dimensions

export interface AnchorPoint {
    x: number; // 0-1, left to right
    y: number; // 0-1, top to bottom
    scale: number; // Relative scale multiplier
    rotation?: number; // Degrees
}

export interface AngleAnchors {
    [partCategory: string]: AnchorPoint;
}

// Anchors for each of the 10 required angles
// These are STARTER VALUES - will need tuning per car model
export const PART_ANCHORS: Record<string, AngleAnchors> = {
    driver_front: {
        wheels: { x: 0.25, y: 0.75, scale: 0.15 },
        spoilers: { x: 0.8, y: 0.4, scale: 0.12 },
        splitters: { x: 0.5, y: 0.85, scale: 0.2 },
        exhaust: { x: 0.7, y: 0.9, scale: 0.08 },
    },
    passenger_front: {
        wheels: { x: 0.75, y: 0.75, scale: 0.15 },
        spoilers: { x: 0.2, y: 0.4, scale: 0.12 },
        splitters: { x: 0.5, y: 0.85, scale: 0.2 },
        exhaust: { x: 0.3, y: 0.9, scale: 0.08 },
    },
    driver_rear: {
        wheels: { x: 0.3, y: 0.75, scale: 0.15 },
        spoilers: { x: 0.7, y: 0.35, scale: 0.15 },
        splitters: { x: 0.5, y: 0.9, scale: 0.15 },
        exhaust: { x: 0.5, y: 0.88, scale: 0.12 },
    },
    passenger_rear: {
        wheels: { x: 0.7, y: 0.75, scale: 0.15 },
        spoilers: { x: 0.3, y: 0.35, scale: 0.15 },
        splitters: { x: 0.5, y: 0.9, scale: 0.15 },
        exhaust: { x: 0.5, y: 0.88, scale: 0.12 },
    },
    full_driver_side: {
        wheels: { x: 0.35, y: 0.7, scale: 0.12 },
        spoilers: { x: 0.85, y: 0.3, scale: 0.15 },
        splitters: { x: 0.2, y: 0.85, scale: 0.18 },
        exhaust: { x: 0.9, y: 0.82, scale: 0.1 },
    },
    full_passenger_side: {
        wheels: { x: 0.65, y: 0.7, scale: 0.12 },
        spoilers: { x: 0.15, y: 0.3, scale: 0.15 },
        splitters: { x: 0.8, y: 0.85, scale: 0.18 },
        exhaust: { x: 0.1, y: 0.82, scale: 0.1 },
    },
    front_center: {
        wheels: { x: 0.5, y: 0.75, scale: 0.18 },
        spoilers: { x: 0.5, y: 0.25, scale: 0.08 },
        splitters: { x: 0.5, y: 0.88, scale: 0.25 },
        exhaust: { x: 0.5, y: 0.92, scale: 0.06 },
    },
    rear_center: {
        wheels: { x: 0.5, y: 0.75, scale: 0.18 },
        spoilers: { x: 0.5, y: 0.3, scale: 0.2 },
        splitters: { x: 0.5, y: 0.92, scale: 0.15 },
        exhaust: { x: 0.5, y: 0.85, scale: 0.15 },
    },
    front_low: {
        wheels: { x: 0.5, y: 0.6, scale: 0.2 },
        spoilers: { x: 0.5, y: 0.15, scale: 0.05 },
        splitters: { x: 0.5, y: 0.75, scale: 0.3 },
        exhaust: { x: 0.5, y: 0.95, scale: 0.04 },
    },
    rear_low: {
        wheels: { x: 0.5, y: 0.6, scale: 0.2 },
        spoilers: { x: 0.5, y: 0.25, scale: 0.25 },
        splitters: { x: 0.5, y: 0.95, scale: 0.2 },
        exhaust: { x: 0.5, y: 0.7, scale: 0.18 },
    },
};

/**
 * Get anchor point for a specific part category and angle
 */
export function getAnchorForPart(angleKey: string, partCategory: string): AnchorPoint | null {
    const angleAnchors = PART_ANCHORS[angleKey];
    if (!angleAnchors) return null;
    return angleAnchors[partCategory] || null;
}

/**
 * Convert normalized anchor to absolute pixels
 */
export function anchorToPixels(
    anchor: AnchorPoint,
    imageWidth: number,
    imageHeight: number
): { left: number; top: number; width: number; height: number } {
    const baseSize = Math.min(imageWidth, imageHeight);
    const size = baseSize * anchor.scale;

    return {
        left: anchor.x * imageWidth - size / 2,
        top: anchor.y * imageHeight - size / 2,
        width: size,
        height: size,
    };
}
