const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const auth = admin.auth();
const db = admin.firestore();

const DEMO_USER = {
    email: 'demo@carguy.app',
    password: 'password123',
    displayName: 'Demo Admin'
};

async function createAdminUser() {
    console.log(`Checking for user: ${DEMO_USER.email}...`);

    try {
        // Check if exists
        try {
            const existingUser = await auth.getUserByEmail(DEMO_USER.email);
            console.log(`User already exists: ${existingUser.uid}`);

            // Update password just in case
            await auth.updateUser(existingUser.uid, {
                password: DEMO_USER.password,
                displayName: DEMO_USER.displayName
            });
            console.log("Password reset to default.");
            return existingUser.uid;
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                // Create new
                const newUser = await auth.createUser({
                    email: DEMO_USER.email,
                    password: DEMO_USER.password,
                    displayName: DEMO_USER.displayName,
                    emailVerified: true
                });
                console.log(`Created new user: ${newUser.uid}`);
                return newUser.uid;
            }
            throw error;
        }
    } catch (error) {
        console.error("Error managing user:", error);
        process.exit(1);
    }
}

async function setAdminRole(uid) {
    try {
        // Set custom claims (optional, but good practice)
        await auth.setCustomUserClaims(uid, { admin: true, shop: true });
        console.log("Set admin/shop custom claims.");

        // Create Shop User entry in Firestore
        await db.collection('shopUsers').doc(uid).set({
            email: DEMO_USER.email,
            displayName: DEMO_USER.displayName,
            role: 'admin',
            shopName: 'Demo Shop',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        console.log("Created/Updated Firestore shopUsers entry.");

    } catch (error) {
        console.error("Error setting roles:", error);
    }
}

(async () => {
    const uid = await createAdminUser();
    await setAdminRole(uid);
    console.log("\n✅ Demo Available:");
    console.log(`   Email: ${DEMO_USER.email}`);
    console.log(`   Password: ${DEMO_USER.password}`);
    process.exit(0);
})();
