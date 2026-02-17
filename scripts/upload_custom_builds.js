#!/usr/bin/env node
/**
 * UPLOAD CUSTOM BUILD RENDERS TO FIREBASE
 * Uploads all completed custom build renders to Firebase Storage and updates Firestore
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
        admin.initializeApp({ projectId, storageBucket: `${projectId}.appspot.com` })
            ;
    }
}

const bucket = admin.storage().bucket();
const db = admin.firestore();

// Build definitions
const BUILDS = {
    brz_coal_bronze: {
        carId: 'subaru_brz_2022',
        variantId: 'matte_coal_te37_bronze',
        buildName: 'Subaru BRZ - Matte Coal + Bronze TE37',
        localDir: './renders_ai/brz_coal_bronze',
        metadata: {
            paint: { type: 'wrap', name: 'Teckwrap Matte Coal', code: 'MT01' },
            wheels: { manufacturer: 'Volk Racing', model: 'TE37 Saga S-Plus', finish: 'Bronze', size: '17x9.5' }
        }
    },
    porsche_camo_green: {
        carId: 'porsche_911_2024',
        variantId: 'camo_green_gt3',
        buildName: 'Porsche 911 GT3 - Camouflage Green',
        localDir: './renders_ai/porsche_camo_green',
        metadata: {
            paint: { type: 'wrap', name: 'Teckwrap Camouflage Green', code: 'CG51-HD' },
            trim: 'GT3',
            aero: 'GT3 Aero Kit'
        }
    },
    bmw_toronto_red: {
        carId: 'bmw_m3_2023',
        variantId: 'toronto_red_bbs',
        buildName: 'BMW M3 - Toronto Red + BBS FI-R',
        localDir: './renders_ai/bmw_toronto_red',
        metadata: {
            paint: { type: 'paint', name: 'Toronto Red', manufacturer: 'BMW Individual' },
            wheels: { manufacturer: 'BBS', model: 'Forged FI-R', finish: 'Platinum Silver' }
        }
    },
    audi_ultra_blue: {
        carId: 'audi_rs6_2024',
        variantId: 'ultra_blue_bbs_mesh',
        buildName: 'Audi RS6 - Ultra Blue + BBS Mesh',
        localDir: './renders_ai/audi_ultra_blue',
        metadata: {
            paint: { type: 'paint', name: 'Ultra Blue Metallic', manufacturer: 'Audi Exclusive' },
            wheels: { manufacturer: 'BBS', model: 'Super RS Mesh', finish: 'Silver/Red Cap' }
        }
    },
    mercedes_coal_rohana: {
        carId: 'mercedes_c63_2024',
        variantId: 'matte_coal_rohana',
        buildName: 'Mercedes C63 - Matte Coal + Rohana RFX17',
        localDir: './renders_ai/mercedes_coal_rohana',
        metadata: {
            paint: { type: 'wrap', name: 'Teckwrap Matte Coal', code: 'MT01' },
            wheels: { manufacturer: 'Rohana', model: 'RFX17', finish: 'Titanium', size: '19"' }
        }
    }
};

async function uploadBuild(buildKey, build) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🚗 Uploading: ${build.buildName}`);
    console.log('='.repeat(70));

    const angleUrls = {};
    let uploadedCount = 0;
    let skippedCount = 0;

    // Check if directory exists
    if (!fs.existsSync(build.localDir)) {
        console.log(`   ⚠️  Directory not found: ${build.localDir}`);
        console.log(`   Skipping this build...`);
        return { uploaded: 0, skipped: 10 };
    }

    // Upload all 10 angles
    for (let i = 1; i <= 10; i++) {
        const angleNum = i.toString().padStart(2, '0');
        const angleName = `angle_${angleNum}`;
        const localFile = path.join(build.localDir, `${angleName}.png`);

        if (!fs.existsSync(localFile)) {
            console.log(`   ⏭️  ${angleName}.png not found, skipping`);
            skippedCount++;
            continue;
        }

        try {
            const destination = `builds/${build.carId}/${build.variantId}/${angleName}.png`;
            await bucket.upload(localFile, {
                destination,
                metadata: {
                    contentType: 'image/png',
                    cacheControl: 'public, max-age=31536000',
                    metadata: {
                        buildId: `${build.carId}_${build.variantId}`,
                        angle: angleName,
                        renderSource: 'gemini_ai_generated',
                        quality: 'photorealistic_studio'
                    }
                }
            });

            const file = bucket.file(destination);
            await file.makePublic();

            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;
            angleUrls[angleName] = publicUrl;

            uploadedCount++;
            console.log(`   ✅ ${angleName}.png → Storage`);
        } catch (error) {
            console.error(`   ❌ ${angleName}: ${error.message}`);
            skippedCount++;
        }
    }

    // Update Firestore if any angles were uploaded
    if (uploadedCount > 0) {
        const variantRef = db.collection('standardCars').doc(build.carId)
            .collection('variants').doc(build.variantId);

        await variantRef.set({
            displayName: build.buildName,
            angleUrls,
            ...build.metadata,
            renderSource: 'gemini_ai_generated',
            renderQuality: 'photorealistic_studio',
            backgroundStyle: 'dark_gradient',
            totalAngles: uploadedCount,
            isCustomBuild: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log(`   📦 Firestore updated (${uploadedCount}/10 angles)`);
    }

    return { uploaded: uploadedCount, skipped: skippedCount };
}

async function main() {
    console.log('\n🚀 CUSTOM BUILD UPLOAD PIPELINE');
    console.log('='.repeat(70));
    console.log('Starting upload of all completed custom build renders...\n');

    const results = {};
    let totalUploaded = 0;
    let totalSkipped = 0;

    for (const [buildKey, build] of Object.entries(BUILDS)) {
        const result = await uploadBuild(buildKey, build);
        results[buildKey] = result;
        totalUploaded += result.uploaded;
        totalSkipped += result.skipped;
    }

    console.log('\n' + '='.repeat(70));
    console.log('✨ UPLOAD COMPLETE');
    console.log('='.repeat(70));
    console.log('\n📊 SUMMARY:');

    for (const [buildKey, result] of Object.entries(results)) {
        const build = BUILDS[buildKey];
        console.log(`\n   🚗 ${build.buildName}:`);
        console.log(`      ✅ Uploaded: ${result.uploaded}/10 angles`);
        if (result.skipped > 0) {
            console.log(`      ⏭️  Skipped: ${result.skipped} angles (not generated yet)`);
        }
    }

    console.log(`\n📈 TOTALS:`);
    console.log(`   ✅ Total Uploaded: ${totalUploaded}/${Object.keys(BUILDS).length * 10}`);
    console.log(`   ⏭️  Total Skipped: ${totalSkipped}`);

    if (totalSkipped > 0) {
        console.log(`\n⏳ Generate remaining ${totalSkipped} renders and run this script again.`);
    } else {
        console.log(`\n🎉 All custom builds fully uploaded!`);
    }
    console.log('');
}

main().catch(console.error);
