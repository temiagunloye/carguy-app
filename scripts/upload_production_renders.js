#!/usr/bin/env node

/**
 * Upload Production Renders to Firebase Storage
 * 
 * Uploads completed renders from production_renders/ to Firebase Storage
 * and updates Firestore mappings for the builds
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin (same pattern as upload_custom_builds.js)
const projectId = process.env.FIREBASE_PROJECT_ID || "carguy-app-demo";
if (admin.apps.length === 0) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(require("../serviceAccountKey.json")),
            storageBucket: `${projectId}.firebasestorage.app`
        });
    } catch (e) {
        admin.initializeApp({
            projectId,
            storageBucket: `${projectId}.appspot.com`
        });
    }
}

const bucket = admin.storage().bucket();
const db = admin.firestore();

// Build configurations
const BUILDS = {
    subaru_brz: {
        id: 'brz_matte_coal_te37',
        name: 'Subaru BRZ - Matte Coal + Bronze TE37',
        folderName: 'subaru_brz',
        firebaseFolder: 'renders/custom_builds/brz_matte_coal'
    },
    mercedes_c63: {
        id: 'c63_matte_coal_rohana',
        name: 'Mercedes-AMG C63 - Matte Coal + Rohana RFX17',
        folderName: 'mercedes_c63',
        firebaseFolder: 'renders/custom_builds/mercedes_c63_coal'
    },
    porsche_camo: {
        id: 'porsche_gt3_camo',
        name: 'Porsche 911 GT3 - Camouflage Green Wrap',
        folderName: 'porsche_camo',
        firebaseFolder: 'renders/custom_builds/porsche_gt3_camo'
    },
    porsche_manthey: {
        id: 'porsche_manthey_racing',
        name: 'Porsche 911 GT3 RS - Manthey Racing Edition',
        folderName: 'porsche_manthey',
        firebaseFolder: 'renders/custom_builds/porsche_manthey'
    },
    audi_rs6: {
        id: 'audi_rs6_ultra_blue',
        name: 'Audi RS6 Avant - Ultra Blue + BBS Mesh',
        folderName: 'audi_rs6',
        firebaseFolder: 'renders/custom_builds/audi_rs6_ultra_blue'
    },
    bmw_m3: {
        id: 'bmw_m3_toronto_red',
        name: 'BMW M3 - Toronto Red + BBS FI-R',
        folderName: 'bmw_m3',
        firebaseFolder: 'renders/custom_builds/bmw_m3_toronto_red'
    }
};

async function uploadBuild(buildKey) {
    const build = BUILDS[buildKey];
    const localDir = path.join(__dirname, '..', 'production_renders', build.folderName);

    console.log(`\n======================================`);
    console.log(`📦 Uploading: ${build.name}`);
    console.log(`======================================`);

    // Check if directory exists
    if (!fs.existsSync(localDir)) {
        console.log(`⚠️  Directory not found: ${localDir}`);
        return { success: false, build: build.name };
    }

    // Get all PNG files
    const files = fs.readdirSync(localDir).filter(f => f.endsWith('.png'));

    if (files.length === 0) {
        console.log(`⚠️  No renders found in ${localDir}`);
        return { success: false, build: build.name };
    }

    console.log(`Found ${files.length}/10 renders`);

    const renderUrls = {};
    let uploadCount = 0;

    // Upload each file
    for (const file of files) {
        const localPath = path.join(localDir, file);
        const remotePath = `${build.firebaseFolder}/${file}`;

        try {
            await bucket.upload(localPath, {
                destination: remotePath,
                metadata: {
                    contentType: 'image/png',
                    cacheControl: 'public, max-age=31536000'
                }
            });

            // Make file public
            await bucket.file(remotePath).makePublic();

            // Get public URL
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${remotePath}`;

            const angleName = file.replace('.png', '');
            renderUrls[angleName] = publicUrl;

            uploadCount++;
            console.log(`✅  ${file} → Firebase Storage`);
        } catch (error) {
            console.error(`❌  Failed to upload ${file}:`, error.message);
        }
    }

    // Update Firestore
    if (uploadCount > 0) {
        try {
            await db.collection('builds').doc(build.id).set({
                buildId: build.id,
                displayName: build.name,
                renderUrls: renderUrls,
                thumbnailUrl: renderUrls['angle_01'] || Object.values(renderUrls)[0],
                featured: true,
                active: true,
                renderCount: uploadCount,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            console.log(`✅  Firestore updated: builds/${build.id}`);
            console.log(`   - ${uploadCount} renders mapped`);

            return { success: true, build: build.name, count: uploadCount };
        } catch (error) {
            console.error(`❌  Firestore update failed:`, error.message);
            return { success: false, build: build.name };
        }
    }

    return { success: false, build: build.name };
}

async function main() {
    console.log(`\n🚀 PRODUCTION RENDER UPLOAD\n`);
    console.log(`Timestamp: ${new Date().toISOString()}\n`);

    // Parse command line arguments
    const args = process.argv.slice(2);
    let buildsToUpload = Object.keys(BUILDS);

    if (args.length > 0 && args[0].startsWith('--builds=')) {
        const buildList = args[0].replace('--builds=', '').split(',');
        buildsToUpload = buildList.filter(b => BUILDS[b]);
        console.log(`📋 Uploading specific builds: ${buildsToUpload.join(', ')}\n`);
    } else {
        console.log(`📋 Uploading all available builds\n`);
    }

    const results = [];

    for (const buildKey of buildsToUpload) {
        const result = await uploadBuild(buildKey);
        results.push(result);
    }

    // Summary
    console.log(`\n======================================`);
    console.log(`📊 UPLOAD SUMMARY`);
    console.log(`======================================\n`);

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`✅ Successful: ${successful.length}`);
    successful.forEach(r => console.log(`   - ${r.build} (${r.count} renders)`));

    if (failed.length > 0) {
        console.log(`\n❌ Failed: ${failed.length}`);
        failed.forEach(r => console.log(`   - ${r.build}`));
    }

    console.log(`\n✨ Upload complete!\n`);
    process.exit(0);
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
