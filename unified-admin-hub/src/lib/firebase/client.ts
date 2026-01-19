import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase safely
let app: any;
let auth: any;
let db: any;

try {
    // Only initialize if we have the critical config (at least API key or Project ID)
    if (firebaseConfig.apiKey && firebaseConfig.projectId) {
        app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        auth = getAuth(app);
        db = getFirestore(app);
    } else {
        console.warn('Firebase Client Config missing (Build Step or Dev Mode without Env Vars)');
        // Mock for build time to prevent crash
        auth = {
            currentUser: null,
            onAuthStateChanged: () => () => { },
            signOut: async () => { },
            signInWithPopup: async () => { }
        };
        db = {
            app: {},
            type: 'firestore'
        }; // Minimal mock
    }
} catch (e) {
    console.warn('Firebase Client Init Failed', e);
    auth = { currentUser: null };
    db = {};
}

export { app, auth, db };
