#!/usr/bin/env node
/**
 * CLEANUP OLD RENDERS FROM FIREBASE STORAGE
 * Deletes old low-resolution renders that are being served instead of the new high-res ones
 */

const admin = require('firebase-admin');

const projectId = process.env.FIREBASE_PROJECT_ID || "carguy-app-demo";
if (admin.apps.length === 0) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(require("../serviceAccountKey.json")),
            storageBucket: `${projectId}.firebasestorage.app`
        });
    } catch (e) {
        admin.initializeApp({ projectId, storageBucket: `${projectId}.appspot.com` });
    }
}

const bucket = admin.storage().bucket();

// Old paths to delete
const OLD_PATHS = [
    'renders/subaru_brz_te37_build/',
    'renders/porsche_911_camo/',
];

async function cleanup() {
    console.log('\n🗑️  CLEANUP OLD RENDERS');
    console.log('='.repeat(70));

    for (const oldPath of OLD_PATHS) {
        console.log(`\n📂 Checking: ${oldPath}`);

        const [files] = await bucket.getFiles({ prefix: oldPath });

        if (files.length === 0) {
            console.log(`   ✅ No old files found`);
            continue;
        }

        console.log(`   ⚠️  Found ${files.length} old files`);

        for (const file of files) {
            const [metadata] = await file.getMetadata();
            console.log(`      Deleting: ${file.name} (${metadata.size} bytes)`);
            await file.delete();
        }

        console.log(`   ✅ Deleted ${files.length} files`);
    }

    console.log('\n✅ CLEANUP COMPLETE\n');
}

cleanup().catch(console.error);
