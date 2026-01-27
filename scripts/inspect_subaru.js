
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function inspectSubaru() {
    console.log('🔍 Searching for Subaru BRZ in standardCars...');

    const carsRef = db.collection('standardCars');
    const snapshot = await carsRef.get();

    let found = false;
    snapshot.forEach(doc => {
        const data = doc.data();
        if ((data.make === 'Subaru' && data.model === 'BRZ') || (data.displayName && data.displayName.includes('Subaru'))) {
            console.log(`\nFound Car Document: ${doc.id}`);
            console.log(JSON.stringify(data, null, 2));
            found = true;
        }
    });

    if (!found) {
        console.log('❌ No Subaru BRZ found in standardCars');
    }
}

inspectSubaru().catch(console.error);
