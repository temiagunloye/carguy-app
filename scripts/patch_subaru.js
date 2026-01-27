
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function patchSubaru() {
    console.log('🔧 Patching Subaru BRZ...');

    const docRef = db.collection('standardCars').doc('subaru_brz_2022');

    // Update with a direct GS path or resolved path
    // Since the app resolves paths, we can use the GS path from one of the renders
    // We'll use the driver_front render as the hero
    await docRef.update({
        heroAssetPath: 'standardCars/subaru_brz_2022/renders/driver_front.png'
    });

    console.log('✅ Updated heroAssetPath for subaru_brz_2022');
}

patchSubaru().catch(console.error);
