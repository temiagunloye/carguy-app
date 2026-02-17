const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

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

const bucket = admin.storage().bucket();
const db = admin.firestore();

// Target Build ID
const CAR_ID = 'c63_2024_stock_obsidian_black';
const SOURCE_DIR = 'tmp/final-renders/mercedes_c63_2024';

// Map generic angle names to file names found in directory
const FILE_MAPPING = {
    'driver_front': ['mercedes_c63_driver_front_1769352697239.png', 'driver_front.png'],
    'front_center': ['front_center.png'],
    'passenger_front': ['mercedes_c63_passenger_front_1769352712492.png', 'passenger_front.png'],
    'full_passenger_side': ['mercedes_c63_full_passenger_side_1769352743473.png', 'full_passenger_side.png'],
    'passenger_rear': ['passenger_rear.png'],
    'rear_center': ['rear_center.png'],
    'driver_rear': ['driver_rear.png'],
    'full_driver_side': ['mercedes_c63_full_driver_side_1769352728036.png', 'full_driver_side.png'],
    'front_low': ['front_low.png'],
    'rear_low': ['rear_low.png']
};

const ANGLE_KEYS = {
    'driver_front': 'angle_01',
    'front_center': 'angle_02',
    'passenger_front': 'angle_03',
    'full_passenger_side': 'angle_04',
    'passenger_rear': 'angle_05',
    'rear_center': 'angle_06',
    'driver_rear': 'angle_07',
    'full_driver_side': 'angle_08',
    'front_low': 'angle_09',
    'rear_low': 'angle_10'
};

async function uploadRecovery() {
    console.log(`🚑 Recovering Renders for ${CAR_ID}...`);

    const photoAnglesHttp = {};
    const photoAngles = {};
    let count = 0;

    for (const [angleName, candidates] of Object.entries(FILE_MAPPING)) {
        // Find first existing file
        const filename = candidates.find(f => fs.existsSync(path.join(SOURCE_DIR, f)));

        if (!filename) {
            console.log(`   ⚠️  Missing file for ${angleName}`);
            continue;
        }

        const localPath = path.join(SOURCE_DIR, filename);
        const angleKey = ANGLE_KEYS[angleName];
        const destination = `standardCars/${CAR_ID}/renders/${angleKey}.png`;

        console.log(`   📤 Uploading ${filename} -> ${angleKey}`);

        await bucket.upload(localPath, {
            destination,
            metadata: { contentType: 'image/png', cacheControl: 'public, max-age=31536000' }
        });

        const file = bucket.file(destination);
        await file.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;

        photoAnglesHttp[angleKey] = publicUrl;
        photoAngles[angleKey] = `gs://${bucket.name}/${destination}`;
        count++;
    }

    // Update Firestore
    if (count > 0) {
        await db.collection('standardCars').doc(CAR_ID).set({
            photoAnglesHttp,
            photoAngles,
            angleCount: 10,
            status: 'recovered',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        console.log(`\n✅ Recovery Complete! ${count}/10 angles updated in Firestore.`);
    } else {
        console.log('\n❌ No files found to recover.');
    }
}

uploadRecovery().catch(console.error);
