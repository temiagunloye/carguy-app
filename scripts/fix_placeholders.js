const admin = require('firebase-admin');

// Initialize Firebase
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

const ANGLE_KEYS = [
    'driver_front', 'passenger_front',
    'full_driver_side', 'full_passenger_side',
    'driver_rear', 'passenger_rear',
    'front_center', 'rear_center',
    'front_low', 'rear_low'
];

async function fixPlaceholders() {
    console.log("🛠️ Fixing Placeholders to be Distinct...");

    // Get all cars
    const snap = await db.collection('standardCars').get();

    for (const doc of snap.docs) {
        const carId = doc.id;
        console.log(`Processing ${carId}...`);

        const updates = {
            photoAnglesHttp: {}
        };

        ANGLE_KEYS.forEach((key, idx) => {
            // DISTINCT URL for each angle
            // Using via.placeholder with text matching the angle name
            const color = ['000000', '333333', '666666', '999999'][idx % 4];
            const text = `${carId.split('_')[0].toUpperCase()} - ${key}`;
            const url = `https://via.placeholder.com/800x450/${color}/FFFFFF?text=${text}`;

            updates.photoAnglesHttp[key] = url;
        });

        await db.collection('standardCars').doc(carId).set(updates, { merge: true });
    }

    console.log("✅ Fixed. Now rotation logic should be visible.");
}

fixPlaceholders().catch(console.error);
