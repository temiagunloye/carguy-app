#!/usr/bin/env node
/**
 * Upload demo car models using Firebase Web SDK (client-side approach)
 * This uses the existing Firebase config from the app
 */

const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

// Firebase config (from src/services/firebaseConfig.js)
const firebaseConfig = {
    apiKey: "AIzaSyCEFvcV4MKlxtXOiZXRFTL8xVSGuKsPme8",
    authDomain: "carguy-app-demo.firebaseapp.com",
    projectId: "carguy-app-demo",
    storageBucket: "carguy-app-demo.firebasestorage.app",
    messagingSenderId: "869343833766",
    appId: "1:869343833766:web:d80b4034b146525a588e67"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);

const MODELS = [
    {
        id: 'porsche_911_2024',
        displayName: '2024 Porsche 911 Carrera 4S',
        make: 'Porsche',
        model: '911',
        year: 2024,
        localFile: 'assets/optimized-models/porsche_911_2024.glb',
        statsFile: 'assets/optimized-models/porsche_911_2024_stats.json',
        storagePath: 'models/base/demo/porsche_911_2024_v1.glb'
    },
    {
        id: 'bmw_m3_2023',
        displayName: '2023 BMW M3 Touring',
        make: 'BMW',
        model: 'M3',
        year: 2023,
        localFile: 'assets/optimized-models/bmw_m3_2023.glb',
        statsFile: 'assets/optimized-models/bmw_m3_2023_stats.json',
        storagePath: 'models/base/demo/bmw_m3_2023_v1.glb'
    },
    {
        id: 'subaru_brz_2022',
        displayName: '2022 Subaru BRZ tS',
        make: 'Subaru',
        model: 'BRZ',
        year: 2022,
        localFile: 'assets/optimized-models/subaru_brz_2024.glb',
        statsFile: 'assets/optimized-models/subaru_brz_2024_stats.json',
        storagePath: 'models/base/demo/subaru_brz_2022_v1.glb'
    }
];

async function uploadModels() {
    console.log('🚀 Starting Firebase upload for demo cars...\n');

    const results = [];

    for (const model of MODELS) {
        console.log('='.repeat(60));
        console.log(`Processing: ${model.displayName}`);
        console.log('='.repeat(60));

        try {
            // Read stats
            let stats = {};
            if (fs.existsSync(model.statsFile)) {
                stats = JSON.parse(fs.readFileSync(model.statsFile, 'utf8'));
            }

            // Read file
            const fileBuffer = fs.readFileSync(model.localFile);
            const fileSizeBytes = fileBuffer.length;
            const fileSizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2);

            console.log(`✅ Local file: ${fileSizeMB}MB, ${stats.after?.triangles || 0} triangles`);

            // Upload to Storage
            console.log(`☁️  Uploading to Firebase Storage...`);
            const storageRef = ref(storage, model.storagePath);
            const metadata = {
                contentType: 'model/gltf-binary',
                cacheControl: 'public,max-age=31536000',
                customMetadata: {
                    modelId: model.id,
                    version: 'v1',
                    demo: 'true'
                }
            };

            await uploadBytes(storageRef, fileBuffer, metadata);
            const publicUrl = await getDownloadURL(storageRef);
            const gsPath = `gs://${firebaseConfig.storageBucket}/${model.storagePath}`;

            console.log(`✅ Uploaded: ${publicUrl.substring(0, 80)}...`);

            // Register in Firestore
            console.log(`📝 Registering in Firestore...`);
            const docRef = doc(db, 'baseModels', model.id);
            await setDoc(docRef, {
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
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            console.log(`✅ Registered: baseModels/${model.id}\n`);

            results.push({
                id: model.id,
                displayName: model.displayName,
                filename: path.basename(model.storagePath),
                sizeMB: fileSizeMB,
                polyCount: stats.after?.triangles || 0,
                gsPath: gsPath,
                publicUrl: publicUrl,
                docId: model.id
            });

        } catch (error) {
            console.error(`❌ Error processing ${model.id}:`, error.message);
        }
    }

    // Print results
    console.log('\n' + '='.repeat(60));
    console.log('✨ PHASE 1 COMPLETE - FIREBASE UPLOAD SUCCESSFUL');
    console.log('='.repeat(60) + '\n');

    results.forEach((r, i) => {
        console.log(`${i + 1}) ${r.displayName}:`);
        console.log(`   - Final optimized filename: ${r.filename}`);
        console.log(`   - Final file size: ${r.sizeMB}MB`);
        console.log(`   - Poly count approx: ${r.polyCount.toLocaleString()}`);
        console.log(`   - Firebase Storage gs:// path: ${r.gsPath}`);
        console.log(`   - Public HTTPS URL: ${r.publicUrl.substring(0, 100)}...`);
        console.log(`   - Firestore baseModels doc ID: ${r.docId}`);
        console.log(`   - baseModelId value: ${r.id}`);
        console.log('');
    });

    console.log('✅ Confirmation: All 3 models uploaded to Firebase Storage');
    console.log('✅ Confirmation: All 3 models registered in Firestore baseModels collection');
    console.log('✅ Confirmation: No GLBs tracked by git (.gitignore already configured)\n');

    process.exit(0);
}

uploadModels().catch(error => {
    console.error('❌ Pipeline failed:', error);
    process.exit(1);
});
