#!/usr/bin/env node

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

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

const ANGLES = [
    'driver_front', 'passenger_front',
    'full_driver_side', 'full_passenger_side',
    'driver_rear', 'passenger_rear',
    'front_center', 'rear_center',
    'front_low', 'rear_low'
];

async function uploadCarRenders(carId, sourcePath) {
    console.log(`\n🚗 Uploading ${carId} to Firebase Storage...`);

    const photoAnglesHttp = {};
    const photoAngles = {};
    let uploadedCount = 0;

    for (const angle of ANGLES) {
        const localFile = path.join(sourcePath, `${angle}.png`);

        if (!fs.existsSync(localFile)) {
            console.log(`   ⚠️  ${angle}.png not found, skipping`);
            continue;
        }

        try {
            const destination = `standardCars/${carId}/renders/${angle}.png`;
            await bucket.upload(localFile, {
                destination,
                metadata: {
                    contentType: 'image/png',
                    cacheControl: 'public, max-age=31536000'
                }
            });

            const file = bucket.file(destination);
            await file.makePublic();

            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;
            photoAnglesHttp[angle] = publicUrl;
            photoAngles[angle] = `gs://${bucket.name}/${destination}`;

            uploadedCount++;
            console.log(`   ✅ ${angle}.png → Storage`);
        } catch (error) {
            console.error(`   ❌ ${angle}: ${error.message}`);
        }
    }

    // Update Firestore
    await db.collection('standardCars').doc(carId).set({
        photoAnglesHttp,
        photoAngles,
        renderSource: 'gemini_ai_generated',
        renderQuality: 'professional_studio',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`   📦 Firestore updated (${uploadedCount}/${ANGLES.length} angles)`);
    return uploadedCount;
}

async function main() {
    const carId = process.argv[2];
    const sourcePath = process.argv[3];

    if (!carId || !sourcePath) {
        console.error('Usage: node upload_car.js <car_id> <source_path>');
        process.exit(1);
    }

    const fullPath = path.join(__dirname, '..', sourcePath);
    const count = await uploadCarRenders(carId, fullPath);

    console.log(`\n✅ ${carId} upload complete: ${count} angles live!`);
}

main().catch(console.error);
