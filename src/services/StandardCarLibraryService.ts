// src/services/StandardCarLibraryService.ts

import {
    collection,
    doc,
    DocumentSnapshot,
    limit as firestoreLimit,
    getDoc,
    getDocs,
    orderBy,
    query,
    startAfter,
    where,
} from 'firebase/firestore';
import { getDownloadURL, ref } from 'firebase/storage';
import { getDb, getStorageInstance } from './firebaseConfig';

/**
 * Service for querying and managing the Standard Dealer Car Library
 * Provides caching, prefetching, and asset resolution
 */

// In-memory cache
interface CachedCar {
    data: StandardCar;
    timestamp: number;
}

interface CachedVariant {
    data: StandardCarVariant;
    timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const carCache = new Map<string, CachedCar>();
const variantCache = new Map<string, CachedVariant>();
const urlCache = new Map<string, { url: string; timestamp: number }>();

export interface StandardCar {
    id: string;
    displayName: string;
    make: string;
    model: string;
    year: number;
    trim: string;
    dealerName?: string;
    sourceType: 'dealer';
    status: 'draft' | 'review' | 'approved' | 'archived';
    angleCount: number;
    angleNames: string[];
    styleProfileId: string;
    defaultVariantId: string;
    dealerColorVariantIds: string[];
    wrapColorEnabled: boolean;
    allowedPartTypes: string[];
    heroAssetPath: string;
    enrichedSpecs?: {
        trim: string;
        engine: string;
        drivetrain: string;
        mpg: string;
        exteriorColor: string;
        interiorColor: string;
        features: string[];
        confidence: number;
        provenance: string;
        timestamp: any;
    };
    listingUrl?: string;
    vin?: string;
    stockNumber?: string;
    createdAt: any;
    updatedAt: any;
}

export interface StandardCarVariant {
    id: string;
    standardCarId: string;
    variantType: 'dealer_paint' | 'wrap_color';
    colorName: string;
    colorKey: string;
    status: 'draft' | 'approved';
    angleAssets: Record<string, string>; // angleName -> storagePath
    thumbPath: string;
    createdAt: any;
    updatedAt: any;
}

export interface StyleProfile {
    id: string;
    name: string;
    uiTokens: {
        background: string;
        surface: string;
        text: string;
        accent: string;
    };
    lightingNotes: string;
    createdAt: any;
    updatedAt: any;
}

class StandardCarLibraryService {
    private db = getDb();
    private storage = getStorageInstance();

    /**
     * List all approved standard cars with pagination
     */
    async listApprovedStandardCars(
        pageSize = 20,
        lastDoc?: DocumentSnapshot
    ): Promise<{ cars: StandardCar[]; lastDoc: DocumentSnapshot | null }> {
        if (!this.db) throw new Error('Firestore not initialized');

        const carsRef = collection(this.db, 'standardCars');
        let q = query(
            carsRef,
            where('status', '==', 'approved'),
            orderBy('createdAt', 'desc'),
            firestoreLimit(pageSize)
        );

        if (lastDoc) {
            q = query(q, startAfter(lastDoc));
        }

        const snapshot = await getDocs(q);
        const cars: StandardCar[] = [];

        snapshot.forEach((doc) => {
            const data = { id: doc.id, ...doc.data() } as StandardCar;
            cars.push(data);
            // Cache the car
            carCache.set(doc.id, { data, timestamp: Date.now() });
        });

        const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;
        return { cars, lastDoc: lastVisible };
    }

    /**
     * Get a single standard car by ID with caching
     */
    async getStandardCarById(carId: string): Promise<StandardCar | null> {
        // Check cache first
        const cached = carCache.get(carId);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return cached.data;
        }

        if (!this.db) throw new Error('Firestore not initialized');

        const carRef = doc(this.db, 'standardCars', carId);
        const carSnap = await getDoc(carRef);

        if (!carSnap.exists()) {
            return null;
        }

        const car = { id: carSnap.id, ...carSnap.data() } as StandardCar;
        carCache.set(carId, { data: car, timestamp: Date.now() });
        return car;
    }

    /**
     * Get all variants for a standard car
     */
    async getVariantsForCar(carId: string): Promise<StandardCarVariant[]> {
        if (!this.db) throw new Error('Firestore not initialized');

        const variantsRef = collection(this.db, 'standardCarVariants');
        const q = query(
            variantsRef,
            where('standardCarId', '==', carId),
            where('status', '==', 'approved')
        );

        const snapshot = await getDocs(q);
        const variants: StandardCarVariant[] = [];

        snapshot.forEach((doc) => {
            const data = { id: doc.id, ...doc.data() } as StandardCarVariant;
            variants.push(data);
            // Cache the variant
            variantCache.set(doc.id, { data, timestamp: Date.now() });
        });

        return variants;
    }

    /**
     * Get a single variant by ID with caching
     */
    async getVariantById(variantId: string): Promise<StandardCarVariant | null> {
        // Check cache first
        const cached = variantCache.get(variantId);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return cached.data;
        }

        if (!this.db) throw new Error('Firestore not initialized');

        const variantRef = doc(this.db, 'standardCarVariants', variantId);
        const variantSnap = await getDoc(variantRef);

        if (!variantSnap.exists()) {
            return null;
        }

        const variant = { id: variantSnap.id, ...variantSnap.data() } as StandardCarVariant;
        variantCache.set(variantId, { data: variant, timestamp: Date.now() });
        return variant;
    }

    /**
     * Resolve a storage path to a download URL with caching
     */
    async resolveStoragePath(storagePath: string): Promise<string> {
        // Check URL cache
        const cached = urlCache.get(storagePath);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return cached.url;
        }

        if (!this.storage) throw new Error('Firebase Storage not initialized');

        const storageRef = ref(this.storage, storagePath);
        const url = await getDownloadURL(storageRef);

        // Cache the URL
        urlCache.set(storagePath, { url, timestamp: Date.now() });
        return url;
    }

    /**
     * Get download URL for a specific angle asset
     */
    async resolveAngleAsset(variantId: string, angleName: string): Promise<string> {
        const variant = await this.getVariantById(variantId);
        if (!variant) {
            throw new Error(`Variant ${variantId} not found`);
        }

        const assetPath = variant.angleAssets[angleName];
        if (!assetPath) {
            throw new Error(`Angle ${angleName} not found for variant ${variantId}`);
        }

        return this.resolveStoragePath(assetPath);
    }

    /**
     * Get thumbnail URL for a variant
     */
    async resolveVariantThumb(variantId: string): Promise<string> {
        const variant = await this.getVariantById(variantId);
        if (!variant) {
            throw new Error(`Variant ${variantId} not found`);
        }

        return this.resolveStoragePath(variant.thumbPath);
    }

    /**
     * Prefetch adjacent angle assets for smooth rotation
     * @param variantId - The variant ID
     * @param currentAngleName - Current angle being viewed
     * @param radius - Number of angles to prefetch on each side (default 2)
     */
    async prefetchAdjacentAngles(
        variantId: string,
        currentAngleName: string,
        angleNames: string[],
        radius = 2
    ): Promise<void> {
        const currentIndex = angleNames.indexOf(currentAngleName);
        if (currentIndex === -1) return;

        const totalAngles = angleNames.length;
        const prefetchPromises: Promise<string>[] = [];

        for (let i = -radius; i <= radius; i++) {
            if (i === 0) continue; // Skip current angle
            // Wraparound using modulo
            const targetIndex = (currentIndex + i + totalAngles) % totalAngles;
            const targetAngleName = angleNames[targetIndex];

            // Prefetch this angle (promises will resolve and cache URLs)
            prefetchPromises.push(
                this.resolveAngleAsset(variantId, targetAngleName).catch(() => '')
            );
        }

        // Fire all prefetch requests in parallel
        await Promise.all(prefetchPromises);
    }

    /**
     * Search standard cars by make, model, or year
     */
    async searchStandardCars(searchTerm: string): Promise<StandardCar[]> {
        if (!this.db) throw new Error('Firestore not initialized');

        const carsRef = collection(this.db, 'standardCars');
        const q = query(
            carsRef,
            where('status', '==', 'approved'),
            orderBy('createdAt', 'desc'),
            firestoreLimit(50)
        );

        const snapshot = await getDocs(q);
        const cars: StandardCar[] = [];

        // Client-side filtering (simple search)
        snapshot.forEach((doc) => {
            const car = { id: doc.id, ...doc.data() } as StandardCar;
            const searchLower = searchTerm.toLowerCase();

            if (
                car.make.toLowerCase().includes(searchLower) ||
                car.model.toLowerCase().includes(searchLower) ||
                car.displayName.toLowerCase().includes(searchLower) ||
                car.year.toString().includes(searchLower)
            ) {
                cars.push(car);
                carCache.set(doc.id, { data: car, timestamp: Date.now() });
            }
        });

        return cars;
    }

    /**
     * Get style profile by ID
     */
    async getStyleProfile(profileId: string): Promise<StyleProfile | null> {
        if (!this.db) throw new Error('Firestore not initialized');

        const profileRef = doc(this.db, 'styleProfiles', profileId);
        const profileSnap = await getDoc(profileRef);

        if (!profileSnap.exists()) {
            return null;
        }

        return { id: profileSnap.id, ...profileSnap.data() } as StyleProfile;
    }

    /**
     * Clear all caches (useful for testing or forced refresh)
     */
    clearCache(): void {
        carCache.clear();
        variantCache.clear();
        urlCache.clear();
    }
}

// Export singleton instance
export const standardCarLibraryService = new StandardCarLibraryService();
export default standardCarLibraryService;
