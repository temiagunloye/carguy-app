import { db } from '@/lib/firebase/client'; // Client-side use for dashboard
import { addDoc, collection, deleteDoc, doc, getDocs, limit, onSnapshot, orderBy, query, Timestamp } from 'firebase/firestore';

export interface AdminLink {
    id: string;
    label: string;
    url: string;
    category: 'studio' | 'product' | 'tool' | 'other';
    icon: string;
    platform: string;
}

export interface ActivityLog {
    id: string;
    type: 'sync' | 'update' | 'alert' | 'info';
    message: string;
    platform: string;
    createdAt: any;
}

/**
 * Real-time subscription to admin links
 */
export const subscribeToAdminLinks = (callback: (links: AdminLink[]) => void) => {
    const q = query(collection(db, 'admin_links'), orderBy('label'));
    return onSnapshot(q, (snapshot) => {
        const links = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminLink));
        callback(links);
    }, (error) => {
        console.error("Error creating links subscription:", error);
    });
};

/**
 * Real-time subscription to activity
 */
export const subscribeToActivity = (callback: (logs: ActivityLog[]) => void) => {
    const q = query(collection(db, 'admin_activity'), orderBy('createdAt', 'desc'), limit(15));
    return onSnapshot(q, (snapshot) => {
        const logs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as ActivityLog));
        callback(logs);
    }, (error) => {
        console.error("Error creating activity subscription:", error);
    });
};

/**
 * Fetch all admin links ordered by category/order (Legacy)
 */
export const getAdminLinks = async (): Promise<AdminLink[]> => {
    try {
        const q = query(collection(db, 'admin_links'), orderBy('label'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminLink));
    } catch (e) {
        console.error('Error fetching links', e);
        return [];
    }
}

/**
 * Fetch recent activity (Legacy)
 */
export const getRecentActivity = async (): Promise<ActivityLog[]> => {
    try {
        const q = query(collection(db, 'admin_activity'), orderBy('createdAt', 'desc'), limit(10));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as ActivityLog));
    } catch (e) {
        console.error('Error fetching activity', e);
        return [];
    }
}

/**
 * Create a new admin link
 */
export const createAdminLink = async (link: Omit<AdminLink, 'id'>) => {
    await addDoc(collection(db, 'admin_links'), link);
}

/**
 * Delete a link
 */
export const deleteAdminLink = async (id: string) => {
    await deleteDoc(doc(db, 'admin_links', id));
}

/**
 * Create an activity log (for health checks/audits)
 */
export const logActivity = async (message: string, type: ActivityLog['type'] = 'info') => {
    try {
        await addDoc(collection(db, 'admin_activity'), {
            message,
            type,
            platform: 'Unified Admin',
            createdAt: Timestamp.now()
        });
    } catch (e) {
        console.error("Failed to log activity", e);
    }
}

