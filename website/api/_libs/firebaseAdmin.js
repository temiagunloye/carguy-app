import admin from 'firebase-admin';

// Singleton Pattern for Serverless
// Prevents "Firebase App already initialized" error
let app;

function initFirebase() {
    if (app) return app;

    // 1. Try Single JSON Variable (Preferred)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
            app = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            return app;
        } catch (e) {
            console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_JSON', e);
        }
    }

    // 2. Try Breakdown Variables (Fallback)
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
        app = admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            })
        });
        return app;
    }

    // 3. No Credentials = Demo Mode
    return null;
}

export const getFirestore = () => {
    const firebaseApp = initFirebase();
    if (!firebaseApp) return null;
    return firebaseApp.firestore();
};

export const isFirebaseConfigured = () => {
    return !!initFirebase();
};
