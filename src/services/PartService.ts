// src/services/PartService.ts

import {
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    where
} from 'firebase/firestore';
import { getDownloadURL, ref } from 'firebase/storage';
import { getDb, getStorageInstance } from './firebaseConfig';

export interface Part {
    partId: string;
    name: string;
    category: 'wheel' | 'spoiler' | 'bumper' | 'hood' | 'roof' | 'misc';
    brand?: string;
    activeVersion: string;
    storagePath: string;
    glbUrl?: string; // Cacheable public URL
    meta: {
        triCount: number;
        dimensionsMm: { x: number; y: number; z: number };
        defaultScale: number;
        materials?: string[];
    };
    placementDefaults: {
        anchorName: string;
        offset: { x: number; y: number; z: number };
        rotation: { x: number; y: number; z: number };
        scaleMode: 'fixed' | 'relativeToWheelAnchors' | 'relativeToCarWidth';
    };
}

class PartService {
    private db = getDb();
    private storage = getStorageInstance();
    private startAfterDoc: any = null;

    // Cache
    private partCache = new Map<string, Part>();

    /**
     * Get a part by ID
     */
    async getPartById(partId: string): Promise<Part | null> {
        if (this.partCache.has(partId)) {
            return this.partCache.get(partId)!;
        }

        if (!this.db) throw new Error('Firestore not initialized');

        const docRef = doc(this.db, 'parts', partId);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
            const data = snap.data() as Part;
            this.partCache.set(partId, data);
            return data;
        }
        return null;
    }

    /**
     * List parts by category
     */
    async getPartsByCategory(category: string, pageSize = 20): Promise<Part[]> {
        if (!this.db) throw new Error('Firestore not initialized');

        const partsRef = collection(this.db, 'parts');
        const q = query(
            partsRef,
            where('category', '==', category),
            orderBy('createdAt', 'desc'), // Assuming createdAt exists
            limit(pageSize)
        );

        const snapshot = await getDocs(q);
        const parts: Part[] = [];

        snapshot.forEach(doc => {
            const part = doc.data() as Part;
            parts.push(part);
            this.partCache.set(part.partId, part);
        });

        return parts;
    }

    /**
     * Search parts (Client-side filtered for v1)
     */
    async searchParts(queryText: string): Promise<Part[]> {
        if (!this.db) throw new Error('Firestore not initialized');

        // Simple implementation: fetch recent parts and filter
        // In prod, use Algolia/Typesense
        const partsRef = collection(this.db, 'parts');
        const q = query(partsRef, limit(50));

        const snapshot = await getDocs(q);
        const lowerQ = queryText.toLowerCase();

        return snapshot.docs
            .map(d => d.data() as Part)
            .filter(p =>
                p.name.toLowerCase().includes(lowerQ) ||
                p.category.toLowerCase().includes(lowerQ)
            );
    }

    /**
     * Get real user builds that use this part
     */
    async getPartExamples(partId: string, limitCount = 10): Promise<any[]> {
        if (!this.db) throw new Error('Firestore not initialized');

        const buildsRef = collection(this.db, 'builds');
        // Note: Needs 'installedPartIds' + 'createdAt' index
        const q = query(
            buildsRef,
            where('installedPartIds', 'array-contains', partId),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    /**
     * Resolve GLB URL from storage path if not already public
     */
    async resolvePartGlbUrl(part: Part): Promise<string> {
        if (part.glbUrl) return part.glbUrl;

        if (!this.storage) throw new Error('Storage not initialized');
        const url = await getDownloadURL(ref(this.storage, part.storagePath));
        return url;
    }
}

export const partService = new PartService();
