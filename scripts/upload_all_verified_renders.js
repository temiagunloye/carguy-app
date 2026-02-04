#!/usr/bin/env node
/**
 * PRODUCTION RENDER UPLOAD - ALL VERIFIED HIGH-QUALITY RENDERS
 * Uploads BRZ custom build + Porsche base model
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

// Legacy angle names (for Porsche base model)
const LEGACY_ANGLES = [
    'driver_front', 'passenger_front',
    'full_driver_side', 'full_passenger_side',
    'driver_rear', 'passenger_rear',
    'front_center', 'rear_center',
    'front_low', 'rear_low'
];

// VERIFIED HIGH-QUALITY RENDERS
const UPLOADS = [
    {
        type: 'build',
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
        angleFormat: 'numbered', // angle_01, angle_02, etc.
        expectedCount: 10
    },
    {
        type: 'base',
        id: 'porsche_911_2024',
        displayName: '2024 Porsche 911 GT3 RS',
        localDir: './output/renders/porsche_911_2024',
        storagePath: 'renders/porsche_911_2024',
        make: 'Porsche',
        model: '911',
        variant: 'GT3 RS',
        year: 2024,
        tags: ['porsche', '911', 'gt3', 'sports'],
        active: true,
        angleFormat: 'legacy', // driver_front, passenger_front, etc.
        expectedCount: 10
    }
];

async function uploadRenders(config) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🚗 ${config.type.toUpperCase()}: ${config.displayName}`);
    console.log('='.repeat(70));

    if (!fs.existsSync(config.localDir)) {
        console.log(`   ⚠️  Directory not found: ${config.localDir}`);
        return { uploaded: 0, skipped: config.expectedCount };
    }

    const photoAnglesHttp = {};
    let uploadedCount = 0;

    if (config.angleFormat === 'numbered') {
        // Upload angle_01.png through angle_10.png
        for (let i = 1; i <= config.expectedCount; i++) {
            const angleNum = i.toString().padStart(2, '0');
            const angleName = `angle_${angleNum}`;
            const localFile = path.join(config.localDir, `${angleName}.png`);

            if (!fs.existsSync(localFile)) {
                console.log(`   ⏭️  ${angleName}.png not found`);
                continue;
            }

            const stats = fs.statSync(localFile);
            if (stats.size < 100000) {
                console.log(`   ⚠️  ${angleName}.png too small (${stats.size} bytes)`);
                continue;
            }

            try {
                const destination = `${config.storagePath}/${angleName}.png`;
                await bucket.upload(localFile, {
                    destination,
                    metadata: { contentType: 'image/png', cacheControl: 'public, max-age=31536000' }
                });

                await bucket.file(destination).makePublic();
                const url = `https://storage.googleapis.com/${bucket.name}/${destination}`;
                photoAnglesHttp[angleName] = url;
                uploadedCount++;
                console.log(`   ✅ ${angleName}.png → Storage`);
            } catch (error) {
                console.error(`   ❌ ${angleName}: ${error.message}`);
            }
        }
    } else if (config.angleFormat === 'legacy') {
        // Upload legacy angle names (driver_front, etc.)
        for (const angleName of LEGACY_ANGLES) {
            const localFile = path.join(config.localDir, `${angleName}.png`);

            if (!fs.existsSync(localFile)) {
                console.log(`   ⏭️  ${angleName}.png not found`);
                continue;
            }

            const stats = fs.statSync(localFile);
            if (stats.size < 100000) {
                console.log(`   ⚠️  ${angleName}.png too small`);
                continue;
            }

            try {
                const destination = `${config.storagePath}/${angleName}.png`;
                await bucket.upload(localFile, {
                    destination,
                    metadata: { contentType: 'image/png', cacheControl: 'public, max-age=31536000' }
                });

                await bucket.file(destination).makePublic();
                const url = `https://storage.googleapis.com/${bucket.name}/${destination}`;
                photoAnglesHttp[angleName] = url;
                uploadedCount++;
                console.log(`   ✅ ${angleName}.png → Storage`);
            } catch (error) {
                console.error(`   ❌ ${angleName}: ${error.message}`);
            }
        }
    }

    // Update Firestore
    if (uploadedCount > 0) {
        if (config.type === 'build') {
            await db.collection('builds').doc(config.id).set({
                id: config.id,
                carId: config.carId,
                displayName: config.displayName,
                wrapId: config.wrapId || null,
                wheelId: config.wheelId || null,
                description: config.description,
                tags: config.tags,
                featured: config.featured,
                photoAnglesHttp,
                renderSource: 'gemini_ai_generated',
                renderQuality: 'photorealistic_studio',
                backgroundStyle: 'dark_gradient',
                status: 'active',
                totalAngles: uploadedCount,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: false });
            console.log(`   📦 Firestore builds/${config.id} updated`);
        } else if (config.type === 'base') {
            await db.collection('baseModels').doc(config.id).set({
                modelId: config.id,
                displayName: config.displayName,
                make: config.make,
                model: config.model,
                variant: config.variant,
                year: config.year,
                tags: config.tags,
                active: config.active,
                photoAnglesHttp,
                images: photoAnglesHttp, // Also set images for backward compatibility
                renderQuality: 'studio_white_background',
                totalAngles: uploadedCount,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            console.log(`   📦 Firestore baseModels/${config.id} updated`);
        }
    }

    return { uploaded: uploadedCount, skipped: config.expectedCount - uploadedCount };
}

async function main() {
    console.log('\n🚀 PRODUCTION RENDER UPLOAD - ALL VERIFIED RENDERS');
    console.log('='.repeat(70));

    let totalUploaded = 0;
    let totalSkipped = 0;

    for (const config of UPLOADS) {
        const result = await uploadRenders(config);
        totalUploaded += result.uploaded;
        totalSkipped += result.skipped;
    }

    console.log('\n' + '='.repeat(70));
    console.log('✨ UPLOAD COMPLETE');
    console.log('='.repeat(70));
    console.log(`\n📈 TOTALS:`);
    console.log(`   ✅ Uploaded: ${totalUploaded} renders`);
    console.log(`   ⏭️  Skipped: ${totalSkipped} renders`);
    console.log(`\n🎉 HIGH-QUALITY RENDERS NOW LIVE!`);
    console.log(`📍 Test: https://garagemanager.co/shop/simulator.html\n`);
}

main().catch(console.error);
