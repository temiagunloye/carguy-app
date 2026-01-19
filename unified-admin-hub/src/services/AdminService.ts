import { db } from '@/lib/firebase/client'; // Client-side use for dashboard
import { addDoc, collection, deleteDoc, doc, getDocs, limit, orderBy, query } from 'firebase/firestore';

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
 * Fetch all admin links ordered by category/order
 */
export const getAdminLinks = async (): Promise<AdminLink[]> => {
    try {
        const q = query(collection(db, 'admin_links'), orderBy('label')); // Todo: add 'order' field
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminLink));
    } catch (e) {
        console.error('Error fetching links', e);
        return [];
    }
}

/**
 * Fetch recent activity
 */
export const getRecentActivity = async (): Promise<ActivityLog[]> => {
    try {
        const q = query(collection(db, 'admin_activity'), orderBy('createdAt', 'desc'), limit(10));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Convert timestamp to date if needed, usually simple serializable format preferred
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
