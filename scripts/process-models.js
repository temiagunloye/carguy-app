#!/usr/bin/env node

/**
 * Automated pipeline for processing car models:
 * 1. Validate raw models
 * 2. Optimize with Blender
 * 3. Add anchors
 * 4. Upload to Firebase Storage
 * 5. Register in Firestore
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../functions/service-account-key.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'carguy-app-demo.firebasestorage.app'
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

const MODELS_CONFIG = [
    {
        id: 'porsche_911_2024',
        displayName: '2024 Porsche 911',
        make: 'Porsche',
        model: '911',
        year: 2024,
        rawFile: 'assets/raw-models/porsche_911_raw.glb',
        optimizedFile: 'assets/optimized-models/porsche_911_optimized.glb',
        finalFile: 'assets/optimized-models/porsche_911_2024_v2.glb',
        firebasePath: 'models/base/porsche_911_2024_v2.glb'
    },
    {
        id: 'bmw_m3_2024',
        displayName: '2024 BMW M3',
        make: 'BMW',
        model: 'M3',
        year: 2024,
        rawFile: 'assets/raw-models/bmw_m3_raw.glb',
        optimizedFile: 'assets/optimized-models/bmw_m3_optimized.glb',
        finalFile: 'assets/optimized-models/bmw_m3_2024_v2.glb',
        firebasePath: 'models/base/bmw_m3_2024_v2.glb'
    },
    {
        id: 'mercedes_amg_gt_2024',
        displayName: '2024 Mercedes-Benz AMG GT',
        make: 'Mercedes-Benz',
        model: 'AMG GT',
        year: 2024,
        rawFile: 'assets/raw-models/mercedes_amg_raw.glb',
        optimizedFile: 'assets/optimized-models/mercedes_amg_optimized.glb',
        finalFile: 'assets/optimized-models/mercedes_amg_gt_2024_v2.glb',
        firebasePath: 'models/base/mercedes_amg_gt_2024_v2.glb'
    }
];

async function processModels() {
    console.log('🚀 Starting car model processing pipeline...\n');

    for (const model of MODELS_CONFIG) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`Processing: ${model.displayName}`);
        console.log('='.repeat(60));

        // Step 1: Check if raw model exists
        if (!fs.existsSync(model.rawFile)) {
            console.log(`⚠️  Raw model not found: ${model.rawFile}`);
            console.log(`Please download and place the model file there first.`);
            continue;
        }

        const rawSize = (fs.statSync(model.rawFile).size / (1024 * 1024)).toFixed(2);
        console.log(`✅ Raw model found (${rawSize} MB)`);

        // Step 2: Optimize with Blender
        console.log(`\n🔧 Optimizing model...`);
        try {
            execSync(
                `blender --background --python scripts/blender/optimize_car_model.py -- ${model.rawFile} ${model.optimizedFile} 120000`,
                { stdio: 'inherit' }
            );
        } catch (error) {
            console.error(`❌ Optimization failed for ${model.id}`);
            continue;
        }

        const optimizedSize = (fs.statSync(model.optimizedFile).size / (1024 * 1024)).toFixed(2);
        console.log(`✅ Optimized (${optimizedSize} MB)`);

        // Check stats
        const statsFile = model.optimizedFile.replace('.glb', '_stats.json');
        if (fs.existsSync(statsFile)) {
            const stats = JSON.parse(fs.readFileSync(statsFile, 'utf8'));
            console.log(`   Triangles: ${stats.before.triangles} → ${stats.after.triangles} (-${stats.reduction_percent}%)`);
        }

        // Step 3: Add anchors
        console.log(`\n⚓ Adding anchor points...`);
        try {
            execSync(
                `blender --background --python scripts/blender/add_anchors.py -- ${model.optimizedFile} ${model.finalFile}`,
                { stdio: 'inherit' }
            );
        } catch (error) {
            console.error(`❌ Anchor addition failed for ${model.id}`);
            continue;
        }

        const finalSize = (fs.statSync(model.finalFile).size / (1024 * 1024)).toFixed(2);
        console.log(`✅ Anchors added (${finalSize} MB)`);

        // Quality gate check
        if (parseFloat(finalSize) > 10) {
            console.log(`⚠️  WARNING: Model size ${finalSize}MB exceeds 10MB target`);
        }

        // Step 4: Upload to Firebase Storage
        console.log(`\n☁️  Uploading to Firebase Storage...`);
        try {
            await bucket.upload(model.finalFile, {
                destination: model.firebasePath,
                metadata: {
                    contentType: 'model/gltf-binary',
                    cacheControl: 'public,max-age=31536000',
                    metadata: {
                        modelId: model.id,
                        version: 'v2'
                    }
                }
            });

            // Make publicly accessible
            const file = bucket.file(model.firebasePath);
            await file.makePublic();

            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${model.firebasePath}`;
            console.log(`✅ Uploaded: ${publicUrl}`);

            // Step 5: Register in Firestore
            console.log(`\n📝 Registering in Firestore...`);
            await db.collection('baseModels').doc(model.id).set({
                modelId: model.id,
                displayName: model.displayName,
                make: model.make,
                model: model.model,
                year: model.year,
                glbUrl: publicUrl,
                source: 'Sketchfab',
                sourceUrl: '', // TODO: Fill in manually
                license: {
                    type: '', // TODO: Fill in manually
                    commercialOk: true,
                    attributionRequired: true,
                    attributionText: '' // TODO: Fill in manually
                },
                assets: {
                    sizeMB: parseFloat(finalSize),
                    triangles: stats?.after?.triangles || 0,
                    draco: true,
                    texturesEmbedded: true
                },
                active: true,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log(`✅ Registered in Firestore: baseModels/${model.id}`);
            console.log(`\n✨ ${model.displayName} processing complete!`);

        } catch (error) {
            console.error(`❌ Upload/registration failed for ${model.id}:`, error.message);
        }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('🎉 Pipeline complete!');
    console.log('='.repeat(60));

    console.log('\n📋 Summary:');
    const results = await db.collection('baseModels').get();
    results.docs.forEach(doc => {
        const data = doc.data();
        console.log(`  ✅ ${data.displayName}: ${data.assets.sizeMB}MB, ${data.assets.triangles} tris`);
    });

    console.log('\n⚠️  TODO: Update license information in Firestore manually');
    process.exit(0);
}

// Run pipeline
processModels().catch(error => {
    console.error('❌ Pipeline failed:', error);
    process.exit(1);
});
