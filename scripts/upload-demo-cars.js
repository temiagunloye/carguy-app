#!/usr/bin/env node
/**
 * Upload optimized demo car models to Firebase Storage and register in Firestore
 * Uses Firebase client SDK credentials from .env
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Try to initialize from application default credentials or service account
try {
    admin.initializeApp({
        storageBucket: 'carguy-app-demo.firebasestorage.app'
    });
} catch (e) {
    console.log('Trying alternative initialization...');
    // If that fails, try with project ID
    admin.initializeApp({
        projectId: 'carguy-app-demo',
        storageBucket: 'carguy-app-demo.firebasestorage.app'
    });
}

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
        firebasePath: 'models/base/demo/porsche_911_2024_v1.glb'
    },
    {
        id: 'bmw_m3_2023',
        displayName: '2023 BMW M3 Touring',
        make: 'BMW',
        model: 'M3',
        year: 2023,
        localFile: 'assets/optimized-models/bmw_m3_2023.glb',
        statsFile: 'assets/optimized-models/bmw_m3_2023_stats.json',
        firebasePath: 'models/base/demo/bmw_m3_2023_v1.glb'
    },
    {
        id: 'subaru_brz_2022',
        displayName: '2022 Subaru BRZ tS',
        make: 'Subaru',
        model: 'BRZ',
        year: 2022,
        localFile: 'assets/optimized-models/subaru_brz_2024.glb',
        statsFile: 'assets/optimized-models/subaru_brz_2024_stats.json',
        firebasePath: 'models/base/demo/subaru_brz_2022_v1.glb'
    }
];

async function uploadModels() {
    console.log('🚀 Starting Firebase upload for demo cars...\n');

    const results = [];

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

        const fileSizeBytes = fs.statSync(model.localFile).size;
        const fileSizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2);
        console.log(`✅ Local file: ${fileSizeMB}MB, ${stats.after?.triangles || 'unknown'} triangles`);

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
                        optimized: 'true',
                        demo: 'true'
                    }
                }
            });

            // Make publicly accessible
            const file = bucket.file(model.firebasePath);
            await file.makePublic();

            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${model.firebasePath}`;
            const gsPath = `gs://${bucket.name}/${model.firebasePath}`;
            console.log(`✅ Uploaded: ${publicUrl}`);

            // Register in Firestore
            console.log(`📝 Registering in Firestore baseModels...`);
            await db.collection('baseModels').doc(model.id).set({
                modelId: model.id,
                displayName: model.displayName,
                make: model.make,
                model: model.model,
                year: model.year,
                glbUrl: publicUrl,
                storagePath: gsPath,
                version: 'v1',
                demo: true,
                active: true,
                license: {
                    source: 'Sketchfab',
                    type: 'CC-BY-4.0',
                    attributionRequired: true,
                    attributionText: `${model.displayName} model sourced from Sketchfab under CC-BY-4.0 license`
                },
                metrics: {
                    fileSizeBytes: fileSizeBytes,
                    polyCountApprox: stats.after?.triangles || 0
                },
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log(`✅ Registered: baseModels/${model.id}\n`);

            results.push({
                id: model.id,
                displayName: model.displayName,
                filename: path.basename(model.firebasePath),
                sizeMB: fileSizeMB,
                polyCount: stats.after?.triangles || 0,
                gsPath: gsPath,
                publicUrl: publicUrl,
                docId: model.id,
                baseModelId: model.id
            });

        } catch (error) {
            console.error(`❌ Error processing ${model.id}:`, error.message);
        }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('✨ PHASE 1 COMPLETE');
    console.log('='.repeat(60) + '\n');

    // Output results in requested format
    results.forEach((r, i) => {
        console.log(`${i + 1}) ${r.displayName}:`);
        console.log(`   - Final optimized filename: ${r.filename}`);
        console.log(`   - Final file size: ${r.sizeMB}MB`);
        console.log(`   - Poly count approx: ${r.polyCount.toLocaleString()}`);
        console.log(`   - Firebase Storage gs:// path: ${r.gsPath}`);
        console.log(`   - Public HTTPS URL: ${r.publicUrl}`);
        console.log(`   - Firestore baseModels doc ID: ${r.docId}`);
        console.log(`   - baseModelId value: ${r.baseModelId}`);
        console.log('');
    });

    console.log('📋 Next: Update demoCars mapping (if it exists in src/data/demoCars.ts)\n');

    process.exit(0);
}

uploadModels().catch(error => {
    console.error('❌ Pipeline failed:', error);
    process.exit(1);
});
