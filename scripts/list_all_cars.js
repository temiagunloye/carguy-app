const admin = require('firebase-admin');

const projectId = process.env.FIREBASE_PROJECT_ID || "carguy-app-demo";
if (admin.apps.length === 0) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(require("../serviceAccountKey.json")),
            storageBucket: `${projectId}.firebasestorage.app`
        });
    } catch (e) {
        admin.initializeApp({ projectId, storageBucket: `${projectId}.appspot.com` });
    }
}
const db = admin.firestore();

async function listAllCars() {
    console.log("🔍 Listing all cars in standardCars collection...\n");
    const snapshot = await db.collection('standardCars').get();

    if (snapshot.empty) {
        console.log("❌ No cars found in database");
        return;
    }

    snapshot.forEach(doc => {
        const data = doc.data();
        const angleCount = data.photoAnglesHttp ? Object.keys(data.photoAnglesHttp).length : 0;
        console.log(`✓ ${doc.id}`);
        console.log(`  - Display Name: ${data.displayName || 'N/A'}`);
        console.log(`  - Angles: ${angleCount} uploaded`);
        if (angleCount > 0) {
            console.log(`  - Sample angles: ${Object.keys(data.photoAnglesHttp).slice(0, 3).join(', ')}...`);
        }
        console.log('');
    });
}

listAllCars().catch(console.error);
