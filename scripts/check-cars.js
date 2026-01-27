const admin = require('firebase-admin');

if (!admin.apps.length) {
    const serviceAccount = require('../serviceAccountKey.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

const db = admin.firestore();

async function checkCars() {
    const snap = await db.collection('standardCars').get();
    snap.forEach(doc => {
        console.log(`ID: ${doc.id}`);
        console.log(`Display: ${doc.data().displayName}`);
        console.log(`Angles: ${Object.keys(doc.data().photoAnglesHttp || {}).length}`);
        console.log('---');
    });
}

checkCars().catch(console.error);
