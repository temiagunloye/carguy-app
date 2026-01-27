const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function checkMercedes() {
    console.log('🔍 Checking Mercedes C63...');
    const doc = await db.collection('standardCars').doc('mercedes_c63_2024').get();

    if (doc.exists) {
        console.log('Exists:', doc.exists);
        console.log('Data:', JSON.stringify(doc.data(), null, 2));
    } else {
        console.log('❌ Does not exist!');
    }
}

checkMercedes().catch(console.error);
