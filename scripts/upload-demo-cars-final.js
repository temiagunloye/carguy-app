const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Use the same service account as base-models-test
const serviceAccount = require('../base-models-test/service-account-key.json');


// FORCE EMULATOR CONNECTION
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
process.env.FIREBASE_STORAGE_EMULATOR_HOST = "127.0.0.1:9199";

console.log("🔧 Forced Emulator Hosts:", {
    firestore: process.env.FIRESTORE_EMULATOR_HOST,
    auth: process.env.FIREBASE_AUTH_EMULATOR_HOST,
    storage: process.env.FIREBASE_STORAGE_EMULATOR_HOST
});

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'carguy-app-demo.firebasestorage.app',
    projectId: 'demo-carapp' // Match the emulator project ID
});

const bucket = admin.storage().bucket();
const db = admin.firestore();

const models = [
    {
        file: 'assets/optimized-models/porsche_911_2024.glb',
        storagePath: 'models/base/demo/porsche_911_2024_v1.glb',
        metadata: {
            modelId: 'porsche_911_2024',
            displayName: '2024 Porsche 911 Carrera 4S',
            year: 2024,
            make: 'Porsche',
            model: '911',
            bodyStyle: 'coupe',
            glbSize: 2253568,
            demo: true,
            version: 'v1',
            active: true,
            license: {
                type: 'CC-BY-4.0',
                source: 'Sketchfab',
                attribution: '2024 Porsche 911 model sourced from Sketchfab under CC-BY-4.0 license',
                commercial: true
            },
            metrics: {
                fileSizeBytes: 2253568,
                polyCountApprox: 81166,
                version: '1.0',
                dateAdded: admin.firestore.FieldValue.serverTimestamp()
            },
            tags: ['porsche', '911', 'sports', 'coupe', '2024', 'demo']
        }
    },
    {
        file: 'assets/optimized-models/bmw_m3_2023.glb',
        storagePath: 'models/base/demo/bmw_m3_2023_v1.glb',
        metadata: {
            modelId: 'bmw_m3_2023',
            displayName: '2023 BMW M3 Touring',
            year: 2023,
            make: 'BMW',
            model: 'M3',
            bodyStyle: 'wagon',
            glbSize: 3014656,
            demo: true,
            version: 'v1',
            active: true,
            license: {
                type: 'CC-BY-4.0',
                source: 'Sketchfab',
                attribution: '2023 BMW M3 Touring model sourced from Sketchfab under CC-BY-4.0 license',
                commercial: true
            },
            metrics: {
                fileSizeBytes: 3014656,
                polyCountApprox: 69082,
                version: '1.0',
                dateAdded: admin.firestore.FieldValue.serverTimestamp()
            },
            tags: ['bmw', 'm3', 'performance', 'wagon', '2023', 'demo']
        }
    },
    {
        file: 'assets/optimized-models/subaru_brz_2024.glb',
        storagePath: 'models/base/demo/subaru_brz_2022_v1.glb',
        metadata: {
            modelId: 'subaru_brz_2022',
            displayName: '2022 Subaru BRZ tS',
            year: 2022,
            make: 'Subaru',
            model: 'BRZ',
            bodyStyle: 'coupe',
            glbSize: 1224704,
            demo: true,
            version: 'v1',
            active: true,
            license: {
                type: 'CC-BY-4.0',
                source: 'Sketchfab',
                attribution: '2022 Subaru BRZ tS model sourced from Sketchfab under CC-BY-4.0 license',
                commercial: true
            },
            metrics: {
                fileSizeBytes: 1224704,
                polyCountApprox: 55945,
                version: '1.0',
                dateAdded: admin.firestore.FieldValue.serverTimestamp()
            },
            tags: ['subaru', 'brz', 'sports', 'coupe', '2022', 'demo']
        }
    }
];

async function uploadModels() {
    console.log('🚀 Starting automated upload (using base-models-test credentials)...\n');

    for (const modelData of models) {
        try {
            console.log(`📤 Uploading ${path.basename(modelData.file)}...`);

            // Upload to Storage
            const filePath = path.join(__dirname, '..', modelData.file);
            await bucket.upload(filePath, {
                destination: modelData.storagePath,
                metadata: {
                    contentType: 'model/gltf-binary',
                    cacheControl: 'public, max-age=31536000',
                },
                public: true
            });

            // Get public URL
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${modelData.storagePath}`;

            // Add GLB URL and storage path to metadata
            modelData.metadata.glbUrl = publicUrl;
            modelData.metadata.storagePath = `gs://${bucket.name}/${modelData.storagePath}`;

            console.log(`✅ Uploaded to Storage: ${modelData.storagePath}`);

            // Add to Firestore using document ID = modelId
            console.log(`📝 Creating Firestore document...`);
            await db.collection('baseModels').doc(modelData.metadata.modelId).set(modelData.metadata);

            console.log(`✅ Added to Firestore: ${modelData.metadata.displayName}`);
            console.log(`   Doc ID: ${modelData.metadata.modelId}`);
            console.log(`   Public URL: ${publicUrl}\n`);

        } catch (error) {
            console.error(`❌ Error with ${modelData.file}:`, error.message);
        }
    }

    console.log('🎉 Upload complete!');
    console.log('\n📊 All 3 demo cars are now accessible in the app!');
    console.log('✅ You can now browse these models like the Toyota Camry');
    console.log('\nVerify in Firebase Console:');
    console.log('- Storage: https://console.firebase.google.com/project/carguy-app-demo/storage');
    console.log('- Firestore: https://console.firebase.google.com/project/carguy-app-demo/firestore/data/~2FbaseModels');

    process.exit(0);
}

uploadModels().catch(console.error);
