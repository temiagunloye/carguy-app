const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function bumpMercedes() {
    console.log('🚀 Bumping Mercedes C63 to top...');
    const docRef = db.collection('standardCars').doc('mercedes_c63_2024');

    await docRef.set({
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'approved',
        // Ensure angleNames are correct for the viewer
        angleNames: ['front', 'front_low', 'driver_front', 'full_driver_side', 'driver_rear', 'rear', 'rear_low', 'passenger_rear', 'front_center']
    }, { merge: true });

    console.log('✅ Mercedes C63 updated!');
}

bumpMercedes().catch(console.error);
