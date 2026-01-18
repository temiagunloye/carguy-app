#!/usr/bin/env node

/**
 * Update Firestore baseModels with anchor metadata
 * Usage: node scripts/update-base-model-anchors.js <model-id> <anchors-json-file>
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../functions/service-account-key.json');
if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ Service account key not found at:', serviceAccountPath);
    console.error('   Please ensure service-account-key.json exists in functions/ directory');
    process.exit(1);
}

const serviceAccount = require(serviceAccountPath);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'carguy-app-demo.firebasestorage.app'
});

const db = admin.firestore();

async function updateBaseModelAnchors(modelId, anchorsJsonPath) {
    try {
        // Read anchor metadata JSON
        if (!fs.existsSync(anchorsJsonPath)) {
            console.error(`❌ Anchors JSON not found: ${anchorsJsonPath}`);
            process.exit(1);
        }

        const anchorsData = JSON.parse(fs.readFileSync(anchorsJsonPath, 'utf8'));
        const { anchorPoints, anchorsVersion, anchorCount } = anchorsData;

        console.log(`\n📍 Updating baseModels/${modelId} with ${anchorCount} anchors...`);
        console.log(`   Version: ${anchorsVersion}`);
        console.log(`   Anchor names: ${Object.keys(anchorPoints).join(', ')}\n`);

        // Update Firestore document
        const docRef = db.collection('baseModels').doc(modelId);

        // Check if document exists
        const doc = await docRef.get();
        if (!doc.exists) {
            console.error(`❌ baseModels/${modelId} does not exist in Firestore!`);
            console.error(`   Create the base model document first before adding anchors.`);
            process.exit(1);
        }

        await docRef.update({
            anchorPoints,
            anchorsVersion,
            anchorCount,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`✅ Successfully updated baseModels/${modelId}`);
        console.log(`   Firestore Console: https://console.firebase.google.com/project/carguy-app-demo/firestore/data/~2FbaseModels~2F${modelId}\n`);

    } catch (error) {
        console.error('❌ Error updating Firestore:', error.message);
        process.exit(1);
    }
}

// Main execution
const args = process.argv.slice(2);
if (args.length < 2) {
    console.log('Usage: node scripts/update-base-model-anchors.js <model-id> <anchors-json-file>');
    console.log('\nExample:');
    console.log('  node scripts/update-base-model-anchors.js porsche_911_2024 ./tmp/porsche_anchors.json');
    process.exit(1);
}

const [modelId, anchorsJsonPath] = args;
updateBaseModelAnchors(modelId, anchorsJsonPath).then(() => process.exit(0));
