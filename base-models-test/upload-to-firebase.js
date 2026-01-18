const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'carguy-app-demo.firebasestorage.app'
});

const bucket = admin.storage().bucket();
const db = admin.firestore();

const models = [
    {
        file: 'honda_civic.glb',
        storagePath: 'models/base/honda_civic_v1.glb',
        metadata: {
            modelId: 'honda_civic_2022',
            displayName: 'Honda Civic',
            year: 2022,
            make: 'Honda',
            model: 'Civic',
            bodyStyle: 'sedan',
            glbSize: 841212,
            active: true,
            license: {
                type: 'CC-BY 4.0',
                source: 'Sketchfab',
                attribution: 'Model from Sketchfab',
                commercial: true
            },
            metadata: {
                polyCount: 15000,
                version: '1.0',
                dateAdded: admin.firestore.FieldValue.serverTimestamp()
            },
            tags: ['honda', 'civic', 'sedan', '2022']
        }
    },
    {
        file: 'toyota_camry.glb',
        storagePath: 'models/base/toyota_camry_v1.glb',
        metadata: {
            modelId: 'toyota_camry_2018',
            displayName: 'Toyota Camry',
            year: 2018,
            make: 'Toyota',
            model: 'Camry',
            bodyStyle: 'sedan',
            glbSize: 2150196,
            active: true,
            license: {
                type: 'CC-BY 4.0',
                source: 'Sketchfab',
                attribution: 'Model from Sketchfab',
                commercial: true
            },
            metadata: {
                polyCount: 120000,
                version: '1.0',
                dateAdded: admin.firestore.FieldValue.serverTimestamp()
            },
            tags: ['toyota', 'camry', 'sedan', '2018']
        }
    },
    {
        file: 'mercedes_eclass.glb',
        storagePath: 'models/base/mercedes_eclass_v1.glb',
        metadata: {
            modelId: 'mercedes_eclass_2005',
            displayName: 'Mercedes-Benz E-Class',
            year: 2005,
            make: 'Mercedes-Benz',
            model: 'E-Class',
            bodyStyle: 'sedan',
            glbSize: 2452816,
            active: true,
            license: {
                type: 'CC-BY 4.0',
                source: 'Sketchfab',
                attribution: 'Model from Sketchfab',
                commercial: true
            },
            metadata: {
                polyCount: 119981,
                version: '1.0',
                dateAdded: admin.firestore.FieldValue.serverTimestamp()
            },
            tags: ['mercedes', 'eclass', 'luxury', 'sedan', '2005']
        }
    }
];

async function uploadModels() {
    console.log('🚀 Starting automated upload...\n');

    for (const modelData of models) {
        try {
            console.log(`📤 Uploading ${modelData.file}...`);

            // Upload to Storage
            const filePath = path.join(__dirname, modelData.file);
            await bucket.upload(filePath, {
                destination: modelData.storagePath,
                metadata: {
                    contentType: 'model/gltf-binary',
                    cacheControl: 'public, max-age=31536000',
                },
                public: true
            });

            // Get public URL
            const file = bucket.file(modelData.storagePath);
            const [url] = await file.getSignedUrl({
                action: 'read',
                expires: '03-01-2500'
            });

            // Add GLB URL to metadata
            modelData.metadata.glbUrl = `https://storage.googleapis.com/${bucket.name}/${modelData.storagePath}`;

            console.log(`✅ Uploaded to Storage: ${modelData.storagePath}`);

            // Add to Firestore
            console.log(`📝 Creating Firestore document...`);
            await db.collection('baseModels').add(modelData.metadata);

            console.log(`✅ Added to Firestore: ${modelData.metadata.displayName}\n`);

        } catch (error) {
            console.error(`❌ Error with ${modelData.file}:`, error.message);
        }
    }

    console.log('🎉 Upload complete!');
    console.log('\nNext: Check Firebase Console to verify:');
    console.log('- Storage: https://console.firebase.google.com/project/carguy-app-demo/storage');
    console.log('- Firestore: https://console.firebase.google.com/project/carguy-app-demo/firestore');

    process.exit(0);
}

uploadModels().catch(console.error);
