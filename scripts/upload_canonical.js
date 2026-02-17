#!/usr/bin/env node
/**
 * CANONICAL FIREBASE STORAGE UPLOADER
 * Uploads verified Gemini renders to Firebase Storage using canonical paths:
 * cars/<model_key>/angle_01.png ... angle_10.png
 * 
 * Usage: node scripts/upload_canonical.js <model_key>
 * Example: node scripts/upload_canonical.js brz_custom_matte
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'carguy-app-demo.appspot.com'
});

const bucket = admin.storage().bucket();

// Canonical model keys
const CANONICAL_KEYS = [
    'brz_stock_blue',
    'brz_custom_matte',
    'rs6_stock_grey',
    'rs6_custom_blue',
    'c63_stock_black',
    'm3_stock_white',
    'm3_custom_red',
    'gt3_stock_red',
    'gt3_manthey_green',
    'carrera4s_studio_base',
    'demo_sandbox_car'
];

async function uploadModel(modelKey) {
    if (!CANONICAL_KEYS.includes(modelKey)) {
        console.error(`❌ Error: "${modelKey}" is not a canonical model key`);
        console.log('Valid keys:', CANONICAL_KEYS.join(', '));
        process.exit(1);
    }

    const localPath = `/Users/temiagunloye/Desktop/carguy-app/website/public/assets/cars/${modelKey}`;

    if (!fs.existsSync(localPath)) {
        console.error(`❌ Error: Local path does not exist: ${localPath}`);
        process.exit(1);
    }

    console.log(`\n📤 Uploading ${modelKey} to Firebase Storage...`);
    console.log(`Source: ${localPath}`);
    console.log(`Destination: cars/${modelKey}/\n`);

    const uploadedFiles = [];

    for (let i = 1; i <= 10; i++) {
        const angleNum = i.toString().padStart(2, '0');
        const filename = `angle_${angleNum}.png`;
        const localFile = path.join(localPath, filename);

        if (!fs.existsSync(localFile)) {
            console.warn(`⚠️  Warning: ${filename} not found, skipping...`);
            continue;
        }

        const stats = fs.statSync(localFile);
        const storagePath = `cars/${modelKey}/${filename}`;

        try {
            await bucket.upload(localFile, {
                destination: storagePath,
                metadata: {
                    contentType: 'image/png',
                    metadata: {
                        uploadedAt: new Date().toISOString(),
                        modelKey: modelKey,
                        angleNumber: angleNum
                    }
                }
            });

            const sizeKB = Math.round(stats.size / 1024);
            console.log(`✅ ${filename} (${sizeKB}KB) → cars/${modelKey}/${filename}`);
            uploadedFiles.push(storagePath);
        } catch (error) {
            console.error(`❌ Failed to upload ${filename}:`, error.message);
        }
    }

    console.log(`\n✅ Upload complete: ${uploadedFiles.length}/10 files uploaded`);
    console.log('\nFirebase Storage paths:');
    uploadedFiles.forEach(path => console.log(`  - ${path}`));

    return uploadedFiles;
}

// Main execution
const modelKey = process.argv[2];
if (!modelKey) {
    console.error('Usage: node scripts/upload_canonical.js <model_key>');
    console.log('\nCanonical keys:', CANONICAL_KEYS.join(', '));
    process.exit(1);
}

uploadModel(modelKey)
    .then(() => {
        console.log('\n🎉 Done!');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Upload failed:', error);
        process.exit(1);
    });
