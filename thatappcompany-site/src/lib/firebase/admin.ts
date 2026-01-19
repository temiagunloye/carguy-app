import admin from "firebase-admin";

function getPrivateKey() {
    const key = process.env.FIREBASE_PRIVATE_KEY;
    if (!key) return "";
    // Vercel often stores line breaks escaped
    return key.replace(/\\n/g, "\n");
}

export function getAdminDb() {
    if (!admin.apps.length) {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = getPrivateKey();

        if (!projectId || !clientEmail || !privateKey) {
            console.warn("Missing Firebase Admin env vars. Falling back to Demo Mode.");
            return null;
        }

        try {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey
                })
            });
        } catch (e: any) {
            if (!/already exists/.test(e.message)) {
                console.error("Firebase Admin Init Error", e);
                return null;
            }
        }
    }

    return admin.firestore();
}
