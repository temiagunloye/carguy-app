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

// Map of artifact filenames to standard angle names
const BMW_FILES = {
    'bmw_m3_driver_front_1769334373665.png': 'driver_front',
    'bmw_m3_passenger_front_1769334392194.png': 'passenger_front',
    'bmw_m3_full_driver_side_1769334406038.png': 'full_driver_side',
    'bmw_m3_full_passenger_side_1769334419721.png': 'full_passenger_side',
    'bmw_m3_driver_rear_1769334436592.png': 'driver_rear',
    'bmw_m3_passenger_rear_1769334449478.png': 'passenger_rear',
    'bmw_m3_front_center_1769334461810.png': 'front_center',
    'bmw_m3_rear_center_1769334475910.png': 'rear_center',
    'bmw_m3_front_low_1769334495848.png': 'front_low',
    'bmw_m3_rear_low_1769334509285.png': 'rear_low'
};

const SUBARU_FILES = {
    'subaru_brz_driver_front_1769334531869.png': 'driver_front',
    'subaru_brz_passenger_front_1769334543245.png': 'passenger_front',
    'subaru_brz_full_driver_side_1769334557740.png': 'full_driver_side',
    'subaru_brz_full_passenger_side_1769334575449.png': 'full_passenger_side',
    'subaru_brz_driver_rear_1769334593703.png': 'driver_rear',
    'subaru_brz_passenger_rear_1769334606663.png': 'passenger_rear',
    'subaru_brz_front_center_1769334620607.png': 'front_center'
    // Missing: rear_center, front_low, rear_low (will be generated after quota reset)
};

async function uploadCar(carId, fileMapping, artifactDir) {
    console.log(`\n🚗 Uploading ${carId} to Firebase Storage...`);

    const photoAnglesHttp = {};
    const photoAngles = {};
    let uploadedCount = 0;

    for (const [filename, angle] of Object.entries(fileMapping)) {
        const localFile = path.join(artifactDir, filename);

        if (!fs.existsSync(localFile)) {
            console.log(`   ⚠️  ${filename} not found, skipping`);
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
        backgroundStyle: carId === 'bmw_m3_2023' ? 'dark_gradient' : 'white_studio',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`   📦 Firestore updated (${uploadedCount}/${Object.keys(fileMapping).length} angles)`);
    return uploadedCount;
}

async function main() {
    const artifactDir = '/Users/temiagunloye/.gemini/antigravity/brain/88ff0a07-0d5d-42c6-b10e-3ca7bc9fc818';

    console.log('🚀 Starting upload of completed AI renders...\n');
    console.log('='.repeat(60));

    // Upload BMW M3 (all 10 angles complete)
    const bmwCount = await uploadCar('bmw_m3_2023', BMW_FILES, artifactDir);
    console.log(`\n✅ BMW M3: ${bmwCount}/10 angles uploaded`);

    console.log('\n' + '='.repeat(60));

    // Upload Subaru BRZ (7 angles complete)
    const subaruCount = await uploadCar('subaru_brz_2022', SUBARU_FILES, artifactDir);
    console.log(`\n✅ Subaru BRZ: ${subaruCount}/10 angles uploaded (3 pending quota reset)`);

    console.log('\n' + '='.repeat(60));
    console.log('✨ UPLOAD COMPLETE');
    console.log('='.repeat(60));
    console.log('\n📋 Summary:');
    console.log(`   • BMW M3: ${bmwCount}/10 angles live`);
    console.log(`   • Subaru BRZ: ${subaruCount}/10 angles live`);
    console.log(`\n⏳ Remaining work:`);
    console.log(`   • Subaru BRZ: 3 more angles (after quota reset)`);
    console.log(`   • Audi RS6: 10 angles (after quota reset)`);
    console.log(`   • Mercedes C63: 10 angles (after quota reset)`);
    console.log(`\n🕐 Quota resets at: 2:45 PM (in ~5 hours)\n`);
}

main().catch(console.error);
