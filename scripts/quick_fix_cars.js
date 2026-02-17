const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

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

// Quick solution: Use Porsche renders as templates for other cars
async function quickFixOtherCars() {
    console.log("🚗 Quick-fix: Copying Porsche renders to other cars...\n");

    const CARS_TO_FIX = [
        { id: 'audi_rs6_2024', displayName: 'AUDI RS6 2024' },
        { id: 'bmw_m3_2024', displayName: 'BMW M3 2024' },
        { id: 'mercedes_c63_2024', displayName: 'MERCEDES-AMG C63 2024' },
        { id: 'subaru_brz_2024', displayName: 'SUBARU BRZ 2024' }
    ];

    const ANGLE_KEYS = [
        'driver_front', 'passenger_front',
        'full_driver_side', 'full_passenger_side',
        'driver_rear', 'passenger_rear',
        'front_center', 'rear_center',
        'front_low', 'rear_low'
    ];

    for (const car of CARS_TO_FIX) {
        console.log(`\n📦 Processing ${car.displayName}...`);

        const photoAnglesHttp = {};
        const photoAngles = {};
        let successCount = 0;

        for (const angleKey of ANGLE_KEYS) {
            try {
                // Source: Porsche render
                const sourcePath = `standardCars/porsche_911_2024/renders/${angleKey}.jpg`;
                const sourceFile = bucket.file(sourcePath);

                // Check if source exists
                const [exists] = await sourceFile.exists();
                if (!exists) {
                    console.log(`   ⚠️  Skipping ${angleKey}: source not found`);
                    continue;
                }

                // Destination: This car
                const destPath = `standardCars/${car.id}/renders/${angleKey}.jpg`;
                const destFile = bucket.file(destPath);

                // Copy file
                console.log(`   📋 Copying ${angleKey}...`);
                await sourceFile.copy(destFile);

                // Make public
                await destFile.makePublic();

                const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destPath}`;
                const gsUrl = `gs://${bucket.name}/${destPath}`;

                photoAnglesHttp[angleKey] = publicUrl;
                photoAngles[angleKey] = gsUrl;

                successCount++;
                console.log(`      ✓ ${angleKey}`);

            } catch (error) {
                console.error(`   ❌ Error with ${angleKey}:`, error.message);
            }
        }

        // Update Firestore
        if (successCount > 0) {
            console.log(`\n   📝 Updating Firestore (${successCount} angles)...`);
            await db.collection('standardCars').doc(car.id).set({
                photoAnglesHttp,
                photoAngles,
                renderSource: 'porsche_template_placeholder',
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            console.log(`   ✅ ${car.displayName} complete!`);
        }
    }

    console.log('\n🎉 All cars fixed with placeholder renders!');
}

quickFixOtherCars().catch(console.error);
