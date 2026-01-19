import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (key) {
    try {
        const serviceAccount = JSON.parse(key);
        // Only initialize if we have a valid project_id (basic check)
        if (serviceAccount.project_id && !getApps().length) {
            initializeApp({
                credential: cert(serviceAccount),
            });
        }
    } catch (error) {
        console.warn('Firebase Admin Init skipped (Build Step or Invalid Key)', error);
    }
} else {
    console.warn('FIREBASE_SERVICE_ACCOUNT_KEY missing for admin init.');
}

// Export safe accessors that might throw if used before init, or return simplified mocks for build
const adminDb = getApps().length ? getFirestore() : {} as any;
const adminAuth = getApps().length ? getAuth() : {} as any;

export { adminAuth, adminDb };

