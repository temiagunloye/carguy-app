#!/usr/bin/env node
/**
 * FIX RENDER MAPPINGS - PRODUCTION
 * Upload ONLY the high-quality existing renders and fix the builds collection
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

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
const db = admin.firestore();

// ONLY the builds with CONFIRMED HIGH-QUALITY renders
const VERIFIED_BUILDS = {
    brz_coal_bronze_te37: {
        id: 'brz_coal_bronze_te37',
        carId: 'subaru_brz_2022',
        displayName: 'BRZ Matte Coal + Bronze TE37',
        localDir: './renders_ai/brz_coal_bronze',
        storagePath: 'builds/subaru_brz_2022/matte_coal_te37_bronze',
        wrapId: 'teckwrap_matte_coal',
        wheelId: 'volk_te37_bronze',
        description: 'Matte Coal wrap with Bronze Volk Racing TE37 Saga S-Plus wheels',
        tags: ['custom', 'street', 'aggressive'],
        featured: true,
        expectedAngles: 10 // ALL 10 angles confirmed good
    },
    // SKIP Porsche Camo Green - missing angle_02, has corrupted renders
    // We'll regenerate this later when quota resets
};

async function uploadAndFixBuild(buildKey, build) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🚗 Processing: ${build.displayName}`);
    console.log('='.repeat(70));

    if (!fs.existsSync(build.localDir)) {
        console.log(`   ⚠️  Directory not found: ${build.localDir}`);
        return { uploaded: 0, skipped: build.expectedAngles };
    }

    const photoAnglesHttp = {};
    let uploadedCount = 0;
    let skippedCount = 0;

    // Upload ALL angles for this build
    for (let i = 1; i <= build.expectedAngles; i++) {
        const angleNum = i.toString().padStart(2, '0');
        const angleName = `angle_${angleNum}`;
        const localFile = path.join(build.localDir, `${angleName}.png`);

        if (!fs.existsSync(localFile)) {
            console.log(`   ⏭️  ${angleName}.png not found, skipping`);
            skippedCount++;
            continue;
        }

        // Check file size (corrupted files are usually tiny)
        const stats = fs.statSync(localFile);
        if (stats.size < 100000) { // < 100KB is suspicious for a high-quality render
            console.log(`   ⚠️  ${angleName}.png is too small (${stats.size} bytes), skipping`);
            skippedCount++;
            continue;
        }

        try {
            const destination = `${build.storagePath}/${angleName}.png`;
            await bucket.upload(localFile, {
                destination,
                metadata: {
                    contentType: 'image/png',
                    cacheControl: 'public, max-age=31536000',
                    metadata: {
                        buildId: build.id,
                        angle: angleName,
                        renderSource: 'gemini_ai_generated',
                        quality: 'photorealistic_studio'
                    }
                }
            });

            const file = bucket.file(destination);
            await file.makePublic();

            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;
            photoAnglesHttp[angleName] = publicUrl;

            uploadedCount++;
            console.log(`   ✅ ${angleName}.png → ${destination}`);
        } catch (error) {
            console.error(`   ❌ ${angleName}: ${error.message}`);
            skippedCount++;
        }
    }

    // Create/Update Firestore builds collection document
    if (uploadedCount > 0) {
        const buildData = {
            id: build.id,
            carId: build.carId,
            displayName: build.displayName,
            wrapId: build.wrapId || null,
            wheelId: build.wheelId || null,
            description: build.description,
            tags: build.tags || [],
            featured: build.featured || false,
            photoAnglesHttp,
            renderSource: 'gemini_ai_generated',
            renderQuality: 'photorealistic_studio',
            backgroundStyle: 'dark_gradient',
            status: 'active',
            totalAngles: uploadedCount,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('builds').doc(build.id).set(buildData, { merge: false });
        console.log(`   📦 Firestore builds/${build.id} created (${uploadedCount} angles)`);
    }

    return { uploaded: uploadedCount, skipped: skippedCount };
}

async function main() {
    console.log('\n🚀 FIX RENDER MAPPINGS - PRODUCTION');
    console.log('='.repeat(70));
    console.log('Uploading ONLY verified high-quality renders...\n');

    const results = {};
    let totalUploaded = 0;
    let totalSkipped = 0;

    for (const [buildKey, build] of Object.entries(VERIFIED_BUILDS)) {
        const result = await uploadAndFixBuild(buildKey, build);
        results[buildKey] = result;
        totalUploaded += result.uploaded;
        totalSkipped += result.skipped;
    }

    console.log('\n' + '='.repeat(70));
    console.log('✨ FIX COMPLETE');
    console.log('='.repeat(70));
    console.log('\n📊 SUMMARY:');

    for (const [buildKey, result] of Object.entries(results)) {
        const build = VERIFIED_BUILDS[buildKey];
        console.log(`\n   🚗 ${build.displayName}:`);
        console.log(`      ✅ Uploaded: ${result.uploaded}/${build.expectedAngles} angles`);
        if (result.skipped > 0) {
            console.log(`      ⏭️  Skipped: ${result.skipped} angles (missing/corrupted)`);
        }
    }

    console.log(`\n📈 TOTALS:`);
    console.log(`   ✅ Total Uploaded: ${totalUploaded}`);
    console.log(`   ⏭️  Total Skipped: ${totalSkipped}`);

    console.log(`\n🎉 High-quality renders are now LIVE on the website!`);
    console.log(`📍 Test at: https://garagemanager.co/shop/simulator.html`);
    console.log(``);
}

main().catch(console.error);
