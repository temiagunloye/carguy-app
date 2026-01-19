// src/hooks/useBaseModels.ts
// Hook to fetch and cache base car models from Firestore

import { collection, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../services/firebaseConfig';
import type { BaseModel, BaseModelSnapshot } from '../types/BaseModel';

export function useBaseModels() {
    const [models, setModels] = useState<BaseModelSnapshot[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function fetchBaseModels() {
            try {
                console.log('[useBaseModels] Fetching base models from Firestore...');

                if (!db) {
                    throw new Error('Firestore instance not initialized');
                }

                const baseModelsRef = collection(db, 'baseModels');
                const q = query(baseModelsRef, where('active', '==', true));
                const snapshot = await getDocs(q);

                if (!isMounted) return;

                const modelsList: BaseModelSnapshot[] = snapshot.docs.map(doc => ({
                    id: doc.id,
                    data: doc.data() as BaseModel
                }));

                console.log(`[useBaseModels] Found ${modelsList.length} active models`);
                setModels(modelsList);
                setError(null);
            } catch (err) {
                console.error('[useBaseModels] Error fetching models:', err);
                if (isMounted) {
                    setError(err as Error);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        fetchBaseModels();

        return () => {
            isMounted = false;
        };
    }, []);

    return { models, loading, error };
}
