#!/usr/bin/env node

/**
 * Automated pipeline for processing standalone parts:
 * 1. Takes raw GLBs from assets/parts-raw/
 * 2. Optimizes with Blender (poly reduction + texture resize)
 * 3. Uploads to Firebase Storage (assets/parts/{id}/{version}/)
 * 4. Registers in Firestore (parts/{id})
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Configuration
const RAW_DIR = 'assets/parts-raw';
const OUT_DIR = 'assets/parts-optimized';
const VERSION = 'v1';

// Part Configuration Mapping (Could be separate JSON, inline for speed)
// Expected filename format: {category}_{id}.glb OR just {id}.glb if mapped here
const KNOWN_PARTS = {
    // Example: 'wheel_te37': { name: 'TE37 Bronze', category: 'wheel', targetTris: 10000 }
};

// Initialize Firebase Admin
// Try to load service account, warn if missing
let serviceAccount;
try {
    serviceAccount = require('../functions/service-account-key.json');
} catch (e) {
    console.error('❌ Service account key not found at scripts/functions/service-account-key.json');
    console.error('   Please verify the path or skip upload step.');
    process.exit(1);
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: 'carguy-app-demo.firebasestorage.app'
    });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

async function processParts() {
    console.log('🚀 Starting PART processing pipeline...\n');

    // Ensure directories
    if (!fs.existsSync(RAW_DIR)) {
        console.log(`Creating ${RAW_DIR}... place raw .glb files here.`);
        fs.mkdirSync(RAW_DIR, { recursive: true });
    }
    if (!fs.existsSync(OUT_DIR)) {
        fs.mkdirSync(OUT_DIR, { recursive: true });
    }

    // Find files
    const files = fs.readdirSync(RAW_DIR).filter(f => f.endsWith('.glb'));
    if (files.length === 0) {
        console.log(`⚠️  No .glb files found in ${RAW_DIR}`);
        return;
    }

    for (const file of files) {
        const partId = path.basename(file, '.glb').toLowerCase().replace(/[^a-z0-9_]/g, '_');
        const rawPath = path.join(RAW_DIR, file);
        const optimizedPath = path.join(OUT_DIR, `${partId}_${VERSION}.glb`);
        const metaPath = optimizedPath.replace('.glb', '_meta.json');

        console.log(`\n${'-'.repeat(40)}`);
        console.log(`Part: ${partId} (${file})`);

        // OPTIMIZE
        console.log('🔧 Optimizing...');
        try {
            // Default target 15k tris unless specified
            const targetTris = 15000;
            execSync(
                `blender --background --python scripts/blender/optimize_part.py -- "${rawPath}" "${optimizedPath}" ${targetTris}`,
                { stdio: 'inherit' }
            );
        } catch (e) {
            console.error(`❌ Blender optimization failed for ${partId}`);
            continue;
        }

        // LOAD METADATA
        let meta = {};
        if (fs.existsSync(metaPath)) {
            meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
            console.log(`   Dimensions: ${Math.round(meta.dimensionsMm.x)}x${Math.round(meta.dimensionsMm.y)}x${Math.round(meta.dimensionsMm.z)}mm`);
            console.log(`   Tris: ${meta.stats.after.triangles}`);
        }

        // UPLOAD
        console.log('☁️  Uploading...');
        const storagePath = `assets/parts/${partId}/${VERSION}/model.glb`;

        try {
            await bucket.upload(optimizedPath, {
                destination: storagePath,
                metadata: {
                    contentType: 'model/gltf-binary',
                    cacheControl: 'public,max-age=31536000',
                    metadata: { partId, version: VERSION }
                }
            });
            await bucket.file(storagePath).makePublic();
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
            console.log(`   URL: ${publicUrl}`);

            // REGISTER FIRESTORE
            console.log('📝 Registering...');

            // Infer category from filename or simple heuristic
            let category = 'misc';
            if (partId.includes('wheel')) category = 'wheel';
            if (partId.includes('spoiler') || partId.includes('wing')) category = 'spoiler';
            if (partId.includes('bumper')) category = 'bumper';

            const partDoc = {
                partId,
                name: partId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                category,
                activeVersion: VERSION,
                storagePath,
                glbUrl: publicUrl, // Legacy compat
                meta: {
                    triCount: meta.stats?.after?.triangles || 0,
                    dimensionsMm: meta.dimensionsMm || {},
                    defaultScale: 1.0
                },
                placementDefaults: {
                    anchorName: category === 'wheel' ? 'ANCHOR_WHEEL_*' : `ANCHOR_${category.toUpperCase()}`,
                    offset: { x: 0, y: 0, z: 0 },
                    rotation: { x: 0, y: 0, z: 0 },
                    scaleMode: category === 'wheel' ? 'relativeToWheelAnchors' : 'fixed'
                },
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };

            await db.collection('parts').doc(partId).set(partDoc, { merge: true });
            console.log(`✅ Registered parts/${partId}`);

        } catch (e) {
            console.error(`❌ Upload/Register failed: ${e.message}`);
        }
    }
}

processParts().catch(console.error);
