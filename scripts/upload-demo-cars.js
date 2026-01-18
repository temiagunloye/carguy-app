#!/usr/bin/env node
/**
 * Upload optimized car models to Firebase Storage and register in Firestore
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../base-models-test/service-account-key.json');
if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ Service account key not found at:', serviceAccountPath);
    process.exit(1);
}

const serviceAccount = require(serviceAccountPath);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'carguy-app-demo.firebasestorage.app'
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

const MODELS = [
    {
        id: 'porsche_911_2024',
        displayName: '2024 Porsche 911 Carrera 4S',
        make: 'Porsche',
        model: '911',
        year: 2024,
        localFile: 'assets/optimized-models/porsche_911_2024.glb',
        statsFile: 'assets/optimized-models/porsche_911_2024_stats.json',
        firebasePath: 'models/base/porsche_911_2024_v1.glb'
    },
    {
        id: 'bmw_m3_2023',
        displayName: '2023 BMW M3 Touring',
        make: 'BMW',
        model: 'M3',
        year: 2023,
        localFile: 'assets/optimized-models/bmw_m3_2023.glb',
        statsFile: 'assets/optimized-models/bmw_m3_2023_stats.json',
        firebasePath: 'models/base/bmw_m3_2023_v1.glb'
    },
    {
        id: 'subaru_brz_2024',
        displayName: '2024 Subaru BRZ tS',
        make: 'Subaru',
        model: 'BRZ',
        year: 2024,
        localFile: 'assets/optimized-models/subaru_brz_2024.glb',
        statsFile: 'assets/optimized-models/subaru_brz_2024_stats.json',
        firebasePath: 'models/base/subaru_brz_2024_v1.glb'
    }
];

async function uploadModels() {
    console.log('🚀 Starting Firebase upload pipeline...\n');

    for (const model of MODELS) {
        console.log(`${'='.repeat(60)}`);
        console.log(`Processing: ${model.displayName}`);
        console.log('='.repeat(60));

        if (!fs.existsSync(model.localFile)) {
            console.log(`⚠️  File not found: ${model.localFile}`);
            continue;
        }

        // Read stats
        let stats = {};
        if (fs.existsSync(model.statsFile)) {
            stats = JSON.parse(fs.readFileSync(model.statsFile, 'utf8'));
        }

        const fileSize = (fs.statSync(model.localFile).size / (1024 * 1024)).toFixed(2);
        console.log(`✅ Local file: ${fileSize}MB, ${stats.after?.triangles || 'unknown'} triangles`);

        // Upload to Firebase Storage
        console.log(`☁️  Uploading to Firebase Storage...`);
        try {
            await bucket.upload(model.localFile, {
                destination: model.firebasePath,
                metadata: {
                    contentType: 'model/gltf-binary',
                    cacheControl: 'public,max-age=31536000',
                    metadata: {
                        modelId: model.id,
                        version: 'v1',
                        optimized: 'true'
                    }
                }
            });

            // Make publicly accessible
            const file = bucket.file(model.firebasePath);
            await file.makePublic();

            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${model.firebasePath}`;
            console.log(`✅ Uploaded: ${publicUrl}`);

            // Register in Firestore
            console.log(`📝 Registering in Firestore...`);
            await db.collection('baseModels').doc(model.id).set({
                modelId: model.id,
                displayName: model.displayName,
                make: model.make,
                model: model.model,
                year: model.year,
                glbUrl: publicUrl,
                source: 'Sketchfab',
                sourceUrl: '', // TODO: Add source URL manually
                license: {
                    type: 'CC-BY-4.0', // Update if different
                    commercialOk: true,
                    attributionRequired: true,
                    attributionText: '' // TODO: Add attribution manually
                },
                assets: {
                    sizeMB: parseFloat(fileSize),
                    triangles: stats.after?.triangles || 0,
                    draco: true,
                    texturesEmbedded: true
                },
                version: 'v1',
                active: true,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log(`✅ Registered: baseModels/${model.id}\n`);

        } catch (error) {
            console.error(`❌ Error processing ${model.id}:`, error.message);
        }
    }

    console.log(`${'='.repeat(60)}`);
    console.log('✨ Upload complete!');
    console.log('='.repeat(60));

    // Summary
    console.log('\n📊 PHASE 1 SUMMARY:\n');
    const results = await db.collection('baseModels').get();
    results.docs.forEach(doc => {
        const data = doc.data();
        console.log(`✅ ${data.displayName}`);
        console.log(`   - Doc ID: ${doc.id}`);
        console.log(`   - URL: ${data.glbUrl}`);
        console.log(`   - Size: ${data.assets.sizeMB}MB`);
        console.log(`   - Triangles: ${data.assets.triangles.toLocaleString()}`);
        console.log('');
    });

    console.log('⚠️  TODO: Update license URLs and attribution in Firebase Console');
    console.log('📍 https://console.firebase.google.com/project/carguy-app-demo/firestore/data/~2FbaseModels\n');

    process.exit(0);
}

uploadModels().catch(error => {
    console.error('❌ Pipeline failed:', error);
    process.exit(1);
});
