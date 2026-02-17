#!/usr/bin/env node
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase
try {
    const serviceAccount = require(path.join(process.cwd(), 'serviceAccountKey.json'));
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: 'carguy-app-demo.firebasestorage.app'
    });
} catch (e) {
    console.error("Failed to load service account:", e.message);
    // Fallback or exit
    process.exit(1);
}

const bucket = admin.storage().bucket();

const CARS_TO_UPLOAD = [
    { id: 'audi_rs6', dir: 'assets/cars/audi_rs6' },
    { id: 'subaru_brz_custom', dir: 'assets/cars/subaru_brz_custom' }, // Note: files renamed to custom in previous step
    { id: 'porsche_manthey', dir: 'assets/cars/porsche_manthey' }
];

async function uploadImages() {
    console.log('🚀 Starting Verification Batch Upload...\n');

    for (const car of CARS_TO_UPLOAD) {
        console.log(`\n🚗 Processing ${car.id}...`);

        if (!fs.existsSync(car.dir)) {
            console.error(`❌ Directory not found: ${car.dir}`);
            continue;
        }

        const files = fs.readdirSync(car.dir).filter(f => f.endsWith('.png'));
        console.log(`   Found ${files.length} images.`);

        for (const file of files) {
            const localPath = path.join(car.dir, file);
            const destination = `cars/${car.id}/${file}`;

            try {
                await bucket.upload(localPath, {
                    destination: destination,
                    metadata: {
                        contentType: 'image/png',
                        cacheControl: 'public,max-age=31536000'
                    }
                });

                await bucket.file(destination).makePublic();
                console.log(`   ✅ Uploaded: ${destination}`);
            } catch (err) {
                console.error(`   ❌ Failed to upload ${file}:`, err.message);
            }
        }
    }
    console.log('\n✨ Upload Complete.');
}

uploadImages();
