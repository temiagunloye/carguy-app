const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: "carguy-app-demo.firebasestorage.app"
    });
}
const bucket = admin.storage().bucket();
const db = admin.firestore();

const BATCH_DIR = path.join(__dirname, '../renders/batch_01');

// Map Folder Name -> Firestore Document ID (standardCars collection)
const CAR_ID_MAP = {
    'mercedes_c63_2024_matte_coal': 'mercedes_c63_2024',
    'audi_rs6_2024_nardo_grey': 'audi_rs6_2024',
    'bmw_m3_2023_toronto_red': 'bmw_m3_2023',
    'subaru_brz_2022_matte_black': 'subaru_brz_2022',
    'porsche_911_2024_army_green': 'porsche_911_2024'
};

const LEGACY_ANGLE_MAP = {
    '01': 'driver_front',
    '02': 'front_center',
    '03': 'passenger_front',
    '04': 'full_passenger_side',
    '05': 'passenger_rear',
    '06': 'rear_center',
    '07': 'driver_rear',
    '08': 'full_driver_side',
    '09': 'front_low', // Approximate match
    '10': 'rear_low'   // Approximate match
};

async function uploadFile(localPath, remotePath) {
    await bucket.upload(localPath, {
        destination: remotePath,
        public: true,
        metadata: {
            contentType: remotePath.endsWith('.jpg') ? 'image/jpeg' : 'image/png',
            cacheControl: 'public, max-age=31536000'
        }
    });
    return `https://storage.googleapis.com/${bucket.name}/${remotePath}`;
}

async function processBatch() {
    console.log("🚀 Starting Normalized Batch Upload...");

    if (!fs.existsSync(BATCH_DIR)) {
        console.error("❌ Batch directory not found.");
        return;
    }

    const folders = fs.readdirSync(BATCH_DIR).filter(f => fs.statSync(path.join(BATCH_DIR, f)).isDirectory());

    for (const folder of folders) {
        const carId = CAR_ID_MAP[folder];
        if (!carId) {
            console.warn(`⚠️ skipping unknown folder: ${folder}`);
            continue;
        }

        console.log(`\nProcessing ${carId} (from ${folder})...`);
        const localFolder = path.join(BATCH_DIR, folder);
        const manifestPath = path.join(localFolder, 'manifest.json');

        if (!fs.existsSync(manifestPath)) {
            console.warn(`❌ No manifest found for ${carId}`);
            continue;
        }

        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        const photoAnglesHttp = {};
        const photoAngles = {}; // gs:// format

        for (const angle of manifest.angles) {
            const localFile = path.join(localFolder, angle.filename);

            // Destination: standardCars/{carId}/renders/{legacy_name}.png
            // We want to support the legacy viewer which expects 'driver_front', etc.
            // AND the new viewer which might want 'angle_01'.
            // For now, let's upload as 'angle_01.png' etc BUT ALSO map them to the legacy keys in Firestore.

            // Wait, the user wants "sleek" which implies the new viewer. 
            // But the app might still be using legacy keys.
            // Let's safe-bet: upload as canonical filenames, but map to legacy keys in DB if needed.
            // Actually, best practice: Upload exactly as filename, store URL in map.

            const destFilename = angle.filename;
            const remotePath = `standardCars/${carId}/renders/${destFilename}`;

            console.log(`   Uploading ${destFilename}...`);
            const publicUrl = await uploadFile(localFile, remotePath);
            const gsUrl = `gs://${bucket.name}/${remotePath}`;

            // Store in map using Angle ID (01, 02)
            photoAnglesHttp[angle.angleId] = publicUrl;

            // ALSO map to legacy keys for backward compatibility?
            const legacyKey = LEGACY_ANGLE_MAP[angle.angleId];
            if (legacyKey) {
                photoAnglesHttp[legacyKey] = publicUrl;
            }
        }

        // Upload Manifest too
        await uploadFile(manifestPath, `standardCars/${carId}/manifest.json`);

        // Database Update
        await db.collection('standardCars').doc(carId).set({
            photoAnglesHttp: photoAnglesHttp, // Now contains both '01' and 'driver_front' keys!
            renderConfig: {
                source: 'normalized_batch_01',
                manifestVersion: '2.0',
                isCanonical: true
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log(`✅ ${carId} Synced to Firestore.`);
    }
}

processBatch().catch(console.error);
