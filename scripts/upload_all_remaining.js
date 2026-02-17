#!/usr/bin/env node

/**
 * AUTOMATED UPLOAD FOR REMAINING CARS
 * 
 * After generating the 22 remaining images with Gemini:
 * 1. Update the GENERATED_FILES mapping below with actual timestamped filenames
 * 2. Run: node scripts/upload_all_remaining.js
 * 3. Script will upload all images and update Firestore
 */

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

// ========================================================================
// UPDATE THESE WITH ACTUAL GENERATED FILENAMES
// ========================================================================

const GENERATED_FILES = {
    'subaru_brz_2022': {
        // 'subaru_brz_front_low_TIMESTAMP.png': 'front_low',
        // 'subaru_brz_rear_low_TIMESTAMP.png': 'rear_low'
    },

    'audi_rs6_2024': {
        // 'audi_rs6_driver_front_TIMESTAMP.png': 'driver_front',
        // 'audi_rs6_passenger_front_TIMESTAMP.png': 'passenger_front',
        // ... etc for all 10 angles
    },

    'mercedes_c63_2024': {
        // 'mercedes_c63_driver_front_TIMESTAMP.png': 'driver_front',
        // 'mercedes_c63_passenger_front_TIMESTAMP.png': 'passenger_front',
        // ... etc for all 10 angles
    }
};

// ========================================================================
// CAR METADATA
// ========================================================================

const CAR_METADATA = {
    'subaru_brz_2022': {
        renderSource: 'gemini_ai_generated',
        renderQuality: 'professional_studio',
        backgroundStyle: 'white_studio'
    },
    'audi_rs6_2024': {
        renderSource: 'gemini_ai_generated',
        renderQuality: 'professional_studio',
        backgroundStyle: 'neutral_gradient'
    },
    'mercedes_c63_2024': {
        renderSource: 'gemini_ai_generated',
        renderQuality: 'professional_studio',
        backgroundStyle: 'dark_gradient'
    }
};

// ========================================================================
// UPLOAD FUNCTIONS
// ========================================================================

async function uploadCar(carId, fileMapping) {
    console.log(`\n🚗 Uploading ${carId}...`);

    const photoAnglesHttp = {};
    const photoAngles = {};
    let uploadedCount = 0;

    for (const [filename, angle] of Object.entries(fileMapping)) {
        const localFile = path.join(ARTIFACT_DIR, filename);

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
    const metadata = CAR_METADATA[carId] || {};
    await db.collection('standardCars').doc(carId).set({
        photoAnglesHttp,
        photoAngles,
        ...metadata,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`   📦 Firestore updated (${uploadedCount}/${Object.keys(fileMapping).length} angles)`);
    return uploadedCount;
}

async function main() {
    console.log('🚀 UPLOADING ALL REMAINING CAR RENDERS');
    console.log('='.repeat(70));

    const results = {};
    let totalUploaded = 0;
    let totalExpected = 0;

    for (const [carId, fileMapping] of Object.entries(GENERATED_FILES)) {
        const count = Object.keys(fileMapping).length;
        totalExpected += count;

        if (count === 0) {
            console.log(`\n⚠️  ${carId}: No files configured, skipping`);
            continue;
        }

        const uploaded = await uploadCar(carId, fileMapping);
        results[carId] = uploaded;
        totalUploaded += uploaded;
    }

    console.log('\n' + '='.repeat(70));
    console.log('✨ UPLOAD COMPLETE');
    console.log('='.repeat(70));
    console.log(`\n📊 Summary:`);

    for (const [carId, count] of Object.entries(results)) {
        console.log(`   • ${carId}: ${count} angles uploaded`);
    }

    console.log(`\n📈 Total: ${totalUploaded}/${totalExpected} angles uploaded`);

    if (totalUploaded === 0) {
        console.log('\n⚠️  WARNING: No files were uploaded!');
        console.log('📝 Make sure to update GENERATED_FILES with actual filenames');
        console.log('   Example:');
        console.log(`   'subaru_brz_front_low_1769123456789.png': 'front_low'`);
    } else {
        console.log('\n✅ Ready for deployment:');
        console.log('   firebase deploy --only hosting\n');
    }
}

main().catch(console.error);
