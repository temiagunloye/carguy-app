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
const ARTIFACT_DIR = '/Users/temiagunloye/.gemini/antigravity/brain/88ff0a07-0d5d-42c6-b10e-3ca7bc9fc818';

// Newly generated Porsche 911 files
const PORSCHE_FILES = {
    'porsche_911_driver_front_1769377740858.png': 'driver_front',
    'porsche_911_passenger_front_1769377755248.png': 'passenger_front',
    'porsche_911_full_driver_side_1769377773424.png': 'full_driver_side',
    'porsche_911_full_passenger_side_1769377787426.png': 'full_passenger_side',
    'porsche_911_driver_rear_1769377801268.png': 'driver_rear',
    'porsche_911_passenger_rear_1769377817728.png': 'passenger_rear',
    'porsche_911_front_center_1769377834134.png': 'front_center',
    'porsche_911_rear_center_1769377848580.png': 'rear_center',
    'porsche_911_front_low_1769377866495.png': 'front_low',
    'porsche_911_rear_low_1769377883258.png': 'rear_low'
};

async function uploadPorsche() {
    console.log('\n🚀 UPLOADING PORSCHE 911 AI RENDERS\n');

    const photoAnglesHttp = {};
    const photoAngles = {};
    let uploadedCount = 0;

    for (const [filename, angle] of Object.entries(PORSCHE_FILES)) {
        const localFile = path.join(ARTIFACT_DIR, filename);

        if (!fs.existsSync(localFile)) {
            console.log(`   ⚠️  ${filename} not found, skipping`);
            continue;
        }

        try {
            const destination = `standardCars/porsche_911_2024/renders/${angle}.png`;

            // Upload new file
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

    // OVERWRITE (not merge) the Firestore document to remove old duplicate angles
    await db.collection('standardCars').doc('porsche_911_2024').set({
        photoAnglesHttp,
        photoAngles,
        renderSource: 'gemini_ai_generated',
        renderQuality: 'professional_studio',
        backgroundStyle: 'white_studio',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: false }); // IMPORTANT: merge: false to replace, not merge

    console.log(`\n   📦 Firestore updated (${uploadedCount}/10 angles)`);
    console.log(`   🎨 New AI renders replace old Blender renders`);
    console.log(`   ✨ Porsche 911 2024 now matches quality of other cars\n`);
}

uploadPorsche().catch(console.error);
