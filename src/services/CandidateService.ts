import {
    addDoc,
    collection,
    doc,
    onSnapshot,
    serverTimestamp
} from 'firebase/firestore';
import { auth, db } from './firebaseConfig';

export interface PartCandidate {
    id?: string;
    submittedByUid: string;
    input: {
        type: 'link' | 'image' | 'text';
        url?: string;
        text?: string;
    };
    status: 'pending' | 'processing' | 'resolved' | 'failed';
    extracted?: any;
    resolution?: {
        mode: '3d_match' | 'community_ref' | 'placeholder';
        partId?: string; // If matched to existing part
        modelUrl?: string; // If 3d_match generated a model
    };
    renderPlan?: any;
    createdAt?: any;
    updatedAt?: any;
}

const COLLECTION = 'partCandidates';

export const CandidateService = {
    /**
     * Submit a new part candidate for processing
     */
    submitCandidate: async (input: PartCandidate['input']): Promise<string> => {
        if (!auth?.currentUser) throw new Error('User must be logged in');
        if (!db) throw new Error('Firestore not initialized');

        const data: Omit<PartCandidate, 'id'> = {
            submittedByUid: auth.currentUser.uid,
            input,
            status: 'pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, COLLECTION), data);
        return docRef.id;
    },

    /**
     * Subscribe to a candidate's status
     */
    monitorCandidate: (candidateId: string, callback: (candidate: PartCandidate) => void) => {
        if (!db) return () => { };

        const docRef = doc(db, COLLECTION, candidateId);
        return onSnapshot(docRef, (snap) => {
            if (snap.exists()) {
                callback({ id: snap.id, ...snap.data() } as PartCandidate);
            }
        });
    }
};
