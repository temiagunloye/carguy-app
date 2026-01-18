// src/data/partsCatalog.ts
// Curated parts library for overlays

export type PartCategory = 'wheels' | 'spoilers' | 'splitters' | 'exhaust';

export interface PartAsset {
    id: string;
    category: PartCategory;
    displayName: string;
    thumbnailUrl: string;
    overlayUrl: string; // PNG with transparency
    tier: 'free' | 'pro' | 'premium'; // Availability
}

// Curated parts library
export const PARTS_CATALOG: PartAsset[] = [
    // WHEELS (5 styles)
    {
        id: 'wheels_sport_01',
        category: 'wheels',
        displayName: 'Sport Wheels',
        thumbnailUrl: 'https://via.placeholder.com/150?text=Sport+Wheels',
        overlayUrl: '/parts/wheels/sport_01.png', // Placeholder path
        tier: 'free',
    },
    {
        id: 'wheels_chrome_01',
        category: 'wheels',
        displayName: 'Chrome Rims',
        thumbnailUrl: 'https://via.placeholder.com/150?text=Chrome+Rims',
        overlayUrl: '/parts/wheels/chrome_01.png',
        tier: 'free',
    },
    {
        id: 'wheels_racing_01',
        category: 'wheels',
        displayName: 'Racing Wheels',
        thumbnailUrl: 'https://via.placeholder.com/150?text=Racing+Wheels',
        overlayUrl: '/parts/wheels/racing_01.png',
        tier: 'pro',
    },
    {
        id: 'wheels_forged_01',
        category: 'wheels',
        displayName: 'Forged Wheels',
        thumbnailUrl: 'https://via.placeholder.com/150?text=Forged+Wheels',
        overlayUrl: '/parts/wheels/forged_01.png',
        tier: 'pro',
    },
    {
        id: 'wheels_carbon_01',
        category: 'wheels',
        displayName: 'Carbon Fiber Wheels',
        thumbnailUrl: 'https://via.placeholder.com/150?text=Carbon+Wheels',
        overlayUrl: '/parts/wheels/carbon_01.png',
        tier: 'premium',
    },

    // SPOILERS (3 types)
    {
        id: 'spoiler_gt_01',
        category: 'spoilers',
        displayName: 'GT Wing',
        thumbnailUrl: 'https://via.placeholder.com/150?text=GT+Wing',
        overlayUrl: '/parts/spoilers/gt_01.png',
        tier: 'free',
    },
    {
        id: 'spoiler_ducktail_01',
        category: 'spoilers',
        displayName: 'Ducktail Spoiler',
        thumbnailUrl: 'https://via.placeholder.com/150?text=Ducktail',
        overlayUrl: '/parts/spoilers/ducktail_01.png',
        tier: 'pro',
    },
    {
        id: 'spoiler_carbon_01',
        category: 'spoilers',
        displayName: 'Carbon Wing',
        thumbnailUrl: 'https://via.placeholder.com/150?text=Carbon+Wing',
        overlayUrl: '/parts/spoilers/carbon_01.png',
        tier: 'premium',
    },

    // SPLITTERS (2 types)
    {
        id: 'splitter_basic_01',
        category: 'splitters',
        displayName: 'Front Splitter',
        thumbnailUrl: 'https://via.placeholder.com/150?text=Front+Splitter',
        overlayUrl: '/parts/splitters/basic_01.png',
        tier: 'free',
    },
    {
        id: 'splitter_carbon_01',
        category: 'splitters',
        displayName: 'Carbon Splitter',
        thumbnailUrl: 'https://via.placeholder.com/150?text=Carbon+Splitter',
        overlayUrl: '/parts/splitters/carbon_01.png',
        tier: 'pro',
    },

    // EXHAUST (3 types)
    {
        id: 'exhaust_dual_01',
        category: 'exhaust',
        displayName: 'Dual Tips',
        thumbnailUrl: 'https://via.placeholder.com/150?text=Dual+Tips',
        overlayUrl: '/parts/exhaust/dual_01.png',
        tier: 'free',
    },
    {
        id: 'exhaust_quad_01',
        category: 'exhaust',
        displayName: 'Quad Tips',
        thumbnailUrl: 'https://via.placeholder.com/150?text=Quad+Tips',
        overlayUrl: '/parts/exhaust/quad_01.png',
        tier: 'pro',
    },
    {
        id: 'exhaust_titanium_01',
        category: 'exhaust',
        displayName: 'Titanium Exhaust',
        thumbnailUrl: 'https://via.placeholder.com/150?text=Titanium',
        overlayUrl: '/parts/exhaust/titanium_01.png',
        tier: 'premium',
    },
];

export function getPartsByCategory(category: PartCategory): PartAsset[] {
    return PARTS_CATALOG.filter((part) => part.category === category);
}

export function getPartById(id: string): PartAsset | undefined {
    return PARTS_CATALOG.find((part) => part.id === id);
}
