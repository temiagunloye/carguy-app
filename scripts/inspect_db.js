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

async function inspect() {
    console.log("🔍 Inspecting standardCars/porsche_911_2024...");
    const doc = await db.collection('standardCars').doc('porsche_911_2024').get();

    if (!doc.exists) {
        console.error("❌ Document not found!");
        return;
    }

    const data = doc.data();
    console.log("Keys in photoAnglesHttp:");
    if (data.photoAnglesHttp) {
        Object.keys(data.photoAnglesHttp).forEach(k => {
            console.log(` - ${k}: ${data.photoAnglesHttp[k].substring(0, 50)}...`);
        });
    } else {
        console.log("❌ No photoAnglesHttp field found.");
    }
}

inspect().catch(console.error);
