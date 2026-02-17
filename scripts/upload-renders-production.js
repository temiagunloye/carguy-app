const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
// Try to load service account
let serviceAccount;
try {
    serviceAccount = require('../serviceAccountKey.json');
} catch (e) {
    console.error('❌ Service account key not found at ../serviceAccountKey.json');
    process.exit(1);
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: "carguy-app-demo.firebasestorage.app"
    });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

const STAGING_DIR = path.resolve(__dirname, '../tmp/final_staging');

// Mapping folder names to Firestore IDs
const ID_MAP = {
    'audi_rs6': 'audi_rs6_2024',
    'bmw_m3': 'bmw_m3_2023',
    'mercedes_c63': 'mercedes_c63_2024',
    'mercedes_c63_rohana': 'mercedes_c63_rohana_build',
    'porsche_911': 'porsche_911_2024',
    'porsche_911_manthey': 'porsche_911_manthey_build',
    'subaru_brz': 'subaru_brz_2022',
    'subaru_brz_te37': 'subaru_brz_te37_build'
};

// Metadata Map for Custom Builds (matches visualizer-v2.js logic)
const BUILD_METADATA = {
    'subaru_brz_te37': {
        carId: 'subaru_brz_2022',
        wheelId: 'brz-volk-te37',
        wrapId: null // Factory
    },
    'mercedes_c63_rohana': {
        carId: 'mercedes_c63_2024',
        wheelId: 'mercedes-rohana-rfx17',
        wrapId: null
    },
    'porsche_911_manthey': {
        carId: 'porsche_911_2024',
        wheelId: 'porsche-911-manthey',
        wrapId: 'camo-green-cg51'
    }
};

async function uploadRenders() {
    console.log('🚀 Starting Production Render Upload (Admin SDK)...\n');

    if (!fs.existsSync(STAGING_DIR)) {
        console.error(`❌ Staging directory not found: ${STAGING_DIR}`);
        process.exit(1);
    }

    const folders = fs.readdirSync(STAGING_DIR).filter(f => fs.statSync(path.join(STAGING_DIR, f)).isDirectory());

    for (const folder of folders) {
        if (!ID_MAP[folder]) {
            console.log(`⚠️  Skipping unmapped folder: ${folder}`);
            continue;
        }

        const modelId = ID_MAP[folder];
        console.log(`📦 Processing ${folder} -> ${modelId}`);

        const angleFiles = fs.readdirSync(path.join(STAGING_DIR, folder))
            .filter(f => f.startsWith('angle_') && f.endsWith('.png'))
            .sort();

        if (angleFiles.length === 0) {
            console.log(`   ❌ No angle files found.`);
            continue;
        }

        const imageUrls = {};

        for (const file of angleFiles) {
            const localPath = path.join(STAGING_DIR, folder, file);
            const storagePath = `renders/${modelId}/${file}`;

            process.stdout.write(`   ⬆️  Uploading ${file}... `);

            try {
                // Upload with Admin SDK
                await bucket.upload(localPath, {
                    destination: storagePath,
                    public: true,
                    metadata: {
                        contentType: 'image/png',
                        cacheControl: 'public, max-age=31536000'
                    }
                });

                // Construct Public URL
                const url = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

                // Store angle key
                const angleKey = path.parse(file).name;
                imageUrls[angleKey] = url;

                process.stdout.write(`✅ Done\n`);
            } catch (err) {
                process.stdout.write(`❌ Failed: ${err.message}\n`);
            }
        }

        // Update Firestore
        // Only update 'baseModels' if it's a base model ID (simple check: if it exists in ID_MAP vals 1-5)
        // For custom builds, we might just print the URLs for now unless there's a specific 'builds' collection usage.
        if (['audi_rs6_2024', 'bmw_m3_2023', 'mercedes_c63_2024', 'porsche_911_2024', 'subaru_brz_2022'].includes(modelId)) {
            console.log(`📝 Updating Firestore doc: baseModels/${modelId}`);
            try {
                await db.collection('baseModels').doc(modelId).update({
                    images: imageUrls,
                    renderSet: 'sleek_studio_v3_public',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                console.log(`   ✅ Firestore updated.`);
            } catch (err) {
                console.log(`   ⚠️  Firestore update failed: ${err.message}`);
                // Try Set if Update fails?
            }

        } else {
            console.log(`ℹ️  Custom build - Updating 'builds' collection...`);
            try {
                const meta = BUILD_METADATA[ID_MAP[folder]] || BUILD_METADATA[folder] || {};

                await db.collection('builds').doc(modelId).set({
                    id: modelId,
                    carId: meta.carId || modelId.split('_build')[0], // Fallback
                    wheelId: meta.wheelId || null,
                    wrapId: meta.wrapId || null,
                    images: imageUrls,
                    photoAnglesHttp: imageUrls,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    manifestUrl: null
                }, { merge: true });
                console.log(`   ✅ 'builds' collection updated for ${modelId}`);
                if (meta.carId) console.log(`      Linked to Car: ${meta.carId}, Wheel: ${meta.wheelId}`);

            } catch (err) {
                console.log(`   ❌ Failed to update custom build doc: ${err.message}`);
            }
        }
        console.log('');
    }

    console.log('🎉 Upload Complete.');
    process.exit(0);
}

uploadRenders();
