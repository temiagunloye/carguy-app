
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Load service account
const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ Service account key not found at:', serviceAccountPath);
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
    storageBucket: "carguy-app-demo.firebasestorage.app"
});

const bucket = admin.storage().bucket();

const PARTS_TO_UPLOAD = [
    { filename: 'wheel_aftermarket_01.glb', partId: 'wheel_aftermarket_01' },
    { filename: 'front_lip_01.glb', partId: 'front_lip_01' },
    { filename: 'side_skirt_01.glb', partId: 'side_skirt_01' },
    { filename: 'rear_diffuser_01.glb', partId: 'rear_diffuser_01' }
];

async function uploadParts() {
    console.log('🚀 Starting demo part upload...');

    for (const part of PARTS_TO_UPLOAD) {
        const localPath = path.join(__dirname, '../tmp/parts', part.filename);
        const remotePath = `models/parts/${part.partId}/v1/model.glb`;

        if (!fs.existsSync(localPath)) {
            console.error(`⚠️  File not found: ${localPath}`);
            continue;
        }

        console.log(`Uploading ${part.filename} to ${remotePath}...`);

        try {
            await bucket.upload(localPath, {
                destination: remotePath,
                metadata: {
                    contentType: 'model/gltf-binary',
                    metadata: {
                        version: 'v1',
                        uploadedAt: new Date().toISOString()
                    }
                }
            });
            console.log(`✅ Uploaded ${part.partId}`);
        } catch (error) {
            console.error(`❌ Failed to upload ${part.partId}:`, error.message);
        }
    }

    console.log('🎉 All uploads complete!');
}

uploadParts().catch(console.error);
