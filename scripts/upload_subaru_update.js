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

// New Subaru rear_center image
const SUBARU_UPDATE = {
    'subaru_brz_rear_center_1769348339065.png': 'rear_center'
};

async function uploadImage(carId, filename, angle, artifactDir) {
    const localFile = path.join(artifactDir, filename);

    if (!fs.existsSync(localFile)) {
        console.log(`   ⚠️  ${filename} not found, skipping`);
        return null;
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
        console.log(`   ✅ ${angle}.png → Storage`);

        return {
            angle,
            httpUrl: publicUrl,
            gsUrl: `gs://${bucket.name}/${destination}`
        };
    } catch (error) {
        console.error(`   ❌ ${angle}: ${error.message}`);
        return null;
    }
}

async function main() {
    const artifactDir = '/Users/temiagunloye/.gemini/antigravity/brain/88ff0a07-0d5d-42c6-b10e-3ca7bc9fc818';

    console.log('📤 Uploading new Subaru BRZ rear_center image...\n');

    const filename = Object.keys(SUBARU_UPDATE)[0];
    const angle = SUBARU_UPDATE[filename];

    const result = await uploadImage('subaru_brz_2022', filename, angle, artifactDir);

    if (result) {
        // Update Firestore with the new angle (merge with existing)
        const photoAnglesHttp = {};
        const photoAngles = {};
        photoAnglesHttp[result.angle] = result.httpUrl;
        photoAngles[result.angle] = result.gsUrl;

        await db.collection('standardCars').doc('subaru_brz_2022').set({
            photoAnglesHttp,
            photoAngles,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log(`   📦 Firestore updated\n`);
        console.log('✅ Subaru BRZ now has 8/10 angles uploaded');
        console.log('   Remaining: front_low, rear_low (after quota reset)\n');
    }
}

main().catch(console.error);
