#!/usr/bin/env node

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

// CURATED BUILD: Mercedes C63 Stock (6/10 angles)
const BUILD_ID = 'c63_2024_stock_obsidian_black';
const SOURCE_DIR = 'tmp/final-renders/mercedes_c63_2024';
const STORAGE_PREFIX = `renders/builds/${BUILD_ID}`;

const ANGLES = [
    { key: 'angle_01', file: 'driver_front.png' },
    { key: 'angle_02', file: 'front_center.png' },
    { key: 'angle_03', file: 'passenger_front.png' },
    { key: 'angle_04', file: 'full_passenger_side.png' },
    { key: 'angle_05', file: 'passenger_rear.png' },
    { key: 'angle_06', file: 'rear_center.png' }
];

async function uploadMercedesAngles() {
    console.log('🚀 UPLOADING MERCEDES C63 STOCK (6/10 ANGLES)');
    console.log('='.repeat(70));

    const photoAnglesHttp = {};
    let uploadedCount = 0;

    // Upload each angle
    for (const { key, file } of ANGLES) {
        const localPath = path.join(SOURCE_DIR, file);

        if (!fs.existsSync(localPath)) {
            console.log(`   ⚠️  ${file} not found, skipping`);
            continue;
        }

        const destination = `${STORAGE_PREFIX}/${key}.png`;
        console.log(`   📤 Uploading ${file} → ${destination}`);

        await bucket.upload(localPath, {
            destination,
            metadata: {
                contentType: 'image/png',
                cacheControl: 'public, max-age=31536000'
            }
        });

        const fileRef = bucket.file(destination);
        await fileRef.makePublic();

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;
        photoAnglesHttp[key] = publicUrl;
        uploadedCount++;
    }

    // Create manifest
    const manifest = {
        buildId: BUILD_ID,
        label: 'Mercedes-AMG C63 Stock',
        status: 'partial',
        angleCount: 6,
        totalAngles: 10,
        updatedAt: new Date().toISOString(),
        angles: Object.keys(photoAnglesHttp)
    };

    const manifestPath = `${STORAGE_PREFIX}/manifest.json`;
    const manifestFile = bucket.file(manifestPath);
    await manifestFile.save(JSON.stringify(manifest, null, 2), {
        contentType: 'application/json',
        metadata: { cacheControl: 'public, max-age=3600' }
    });
    await manifestFile.makePublic();

    console.log(`   ✅ Manifest created: ${manifestPath}`);

    // Update Firestore approvedRenders collection
    await db.collection('approvedRenders').doc(BUILD_ID).set({
        buildId: BUILD_ID,
        label: 'Mercedes-AMG C63 Stock',
        status: 'partial',
        angleCount: 6,
        storagePrefix: STORAGE_PREFIX,
        manifestUrl: `https://storage.googleapis.com/${bucket.name}/${manifestPath}`,
        photoAnglesHttp,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`   ✅ Firestore approvedRenders updated`);
    console.log('\\n' + '='.repeat(70));
    console.log(`✨ COMPLETE: ${uploadedCount}/6 angles uploaded`);
    console.log(`🔗 View at: https://garagemanager.co/shop/simulator.html?carId=${BUILD_ID}`);
}

uploadMercedesAngles().catch(console.error);
