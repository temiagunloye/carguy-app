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

const CAR_METADATA = {
    'porsche_911_2024': { displayName: 'PORSCHE 911 2024', make: 'Porsche', model: '911', year: 2024 },
    'bmw_m3_2024': { displayName: 'BMW M3 2024', make: 'BMW', model: 'M3', year: 2024 },
    'audi_rs6_2024': { displayName: 'AUDI RS6 2024', make: 'Audi', model: 'RS6', year: 2024 },
    'mercedes_c63_2024': { displayName: 'MERCEDES-AMG C63 2024', make: 'Mercedes-AMG', model: 'C63', year: 2024 },
    'subaru_brz_2024': { displayName: 'SUBARU BRZ 2024', make: 'Subaru', model: 'BRZ', year: 2024 }
};

async function addDisplayNames() {
    console.log("🏷️  Adding display names to all cars...\n");

    for (const [carId, metadata] of Object.entries(CAR_METADATA)) {
        console.log(`Updating ${carId}...`);
        try {
            await db.collection('standardCars').doc(carId).update(metadata);
            console.log(`✓ Added: ${metadata.displayName}\n`);
        } catch (e) {
            console.error(`✗ Failed to update ${carId}:`, e.message);
        }
    }

    console.log("✅ All display names added!");
}

addDisplayNames().catch(console.error);
