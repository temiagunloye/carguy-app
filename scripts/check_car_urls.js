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

async function checkCarURLs() {
    console.log("🔍 Checking car URLs in Firestore...\n");

    const snapshot = await db.collection('standardCars').get();

    snapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`\n📦 ${doc.id}`);
        console.log(`   Display Name: ${data.displayName || 'N/A'}`);

        if (data.photoAnglesHttp) {
            const urls = Object.values(data.photoAnglesHttp);
            const firstUrl = urls[0] || 'none';
            const hasPlaceholder = firstUrl.includes('placeholder');
            const hasStorage = firstUrl.includes('storage.googleapis');

            console.log(`   URL Type: ${hasPlaceholder ? '❌ PLACEHOLDER' : hasStorage ? '✅ STORAGE' : '⚠️  UNKNOWN'}`);
            console.log(`   Sample URL: ${firstUrl.substring(0, 80)}...`);
            console.log(`   Total Angles: ${urls.length}`);
        } else {
            console.log(`   ❌ NO URLS FOUND`);
        }
    });
}

checkCarURLs().catch(console.error);
