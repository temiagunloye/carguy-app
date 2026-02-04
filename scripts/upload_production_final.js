#!/usr/bin/env node
/**
 * UPLOAD PRODUCTION RENDERS TO FIREBASE
 * Uploads all production renders from production_renders/ directory
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

// Build definitions with CORRECT paths
const BUILDS = {
    porsche_manthey: {
        carId: 'porsche_911_2024',
        variantId: 'manthey_racing_green',
        buildName: 'Porsche 911 GT3 RS - Manthey Racing',
        localDir: './production_renders/porsche_manthey',
        metadata: {
            paint: { type: 'wrap', name: 'Camouflage Green', code: 'Custom' },
            trim: 'GT3 RS',
            parts: 'Manthey Racing Manthey Racing Carbon Aero Disc Set (991)',
            aero: 'Manthey Racing Kit'
        }
    },
    porsche_camo: {
        carId: 'porsche_911_2024',
        variantId: 'camo_green_gt3',
        buildName: 'Porsche 911 GT3 - Camouflage Green',
        localDir: './production_renders/porsche_camo',
        metadata: {
            paint: { type: 'wrap', name: 'Teckwrap Camouflage Green', code: 'CG51-HD' },
            trim: 'GT3',
            aero: 'GT3 Aero Kit'
        }
    },
    subaru_brz: {
        carId: 'subaru_brz_2022',
        variantId: 'matte_coal_te37_bronze',
        buildName: 'Subaru BRZ - Matte Coal + Bronze TE37',
        localDir: './production_renders/subaru_brz',
        metadata: {
            paint: { type: 'wrap', name: 'Teckwrap Matte Coal', code: 'MT01' },
            wheels: { manufacturer: 'Volk Racing', model: 'TE37 Saga S-Plus', finish: 'Bronze', size: '17x9.5' }
        }
    },
    bmw_m3: {
        carId: 'bmw_m3_2023',
        variantId: 'toronto_red_bbs',
        buildName: 'BMW M3 - Toronto Red + BBS FI-R',
        localDir: './production_renders/bmw_m3',
        metadata: {
            paint: { type: 'paint', name: 'Toronto Red', manufacturer: 'BMW Individual' },
            wheels: { manufacturer: 'BBS', model: 'Forged FI-R', finish: 'Platinum Silver' }
        }
    },
    audi_rs6: {
        carId: 'audi_rs6_2024',
        variantId: 'ultra_blue_bbs_mesh',
        buildName: 'Audi RS6 - Ultra Blue + BBS Mesh',
        localDir: './production_renders/audi_rs6',
        metadata: {
            paint: { type: 'paint', name: 'Ultra Blue Metallic', manufacturer: 'Audi Exclusive' },
            wheels: { manufacturer: 'BBS', model: 'Super RS Mesh', finish: 'Silver/Red Cap' }
        }
    },
    mercedes_c63: {
        carId: 'mercedes_c63_2024',
        variantId: 'matte_coal_rohana',
        buildName: 'Mercedes C63 - Matte Coal + Rohana RFX17',
        localDir: './production_renders/mercedes_c63',
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
            const destination = `renders/custom_builds/${buildKey}/${angleName}.png`;
            await bucket.upload(localFile, {
                destination,
                metadata: {
                    contentType: 'image/png',
                    cacheControl: 'public, max-age=31536000',
                    metadata: {
                        buildId: buildKey,
                        carId: build.carId,
                        variantId: build.variantId,
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
            console.log(`   ✅ ${angleName}.png → ${destination}`);
        } catch (error) {
            console.error(`   ❌ ${angleName}: ${error.message}`);
            skippedCount++;
        }
    }

    // Update Firestore if any angles were uploaded
    if (uploadedCount > 0) {
        try {
            // Update builds collection
            const buildRef = db.collection('builds').doc(buildKey);
            await buildRef.set({
                buildId: buildKey,
                carId: build.carId,
                variantId: build.variantId,
                displayName: build.buildName,
                renderUrls: angleUrls,
                totalAngles: uploadedCount,
                ...build.metadata,
                renderSource: 'gemini_ai_generated',
                renderQuality: 'photorealistic_studio',
                backgroundStyle: 'dark_gradient_studio',
                isCustomBuild: true,
                isFeatured: true,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            console.log(`   📦 Firestore builds/${buildKey} updated (${uploadedCount}/10 angles)`);

            // Also update the baseModels collection for website compatibility
            const baseModelRef = db.collection('baseModels').doc(build.carId);
            const baseModelDoc = await baseModelRef.get();

            if (!baseModelDoc.exists) {
                // Create base model if it doesn't exist
                await baseModelRef.set({
                    carId: build.carId,
                    make: build.carId.split('_')[0],
                    model: build.carId.split('_').slice(1, -1).join(' '),
                    year: parseInt(build.carId.split('_').pop()),
                    variants: {
                        [build.variantId]: {
                            displayName: build.buildName,
                            renderUrls: angleUrls,
                            ...build.metadata
                        }
                    },
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
                console.log(`   📦 Firestore baseModels/${build.carId} created`);
            } else {
                // Update existing base model
                await baseModelRef.update({
                    [`variants.${build.variantId}`]: {
                        displayName: build.buildName,
                        renderUrls: angleUrls,
                        ...build.metadata
                    }
                });
                console.log(`   📦 Firestore baseModels/${build.carId} updated`);
            }
        } catch (error) {
            console.error(`   ❌ Firestore update failed: ${error.message}`);
        }
    }

    return { uploaded: uploadedCount, skipped: skippedCount };
}

async function main() {
    console.log('\n🚀 PRODUCTION RENDERS UPLOAD');
    console.log('='.repeat(70));
    console.log('Uploading from production_renders/ directory...\n');

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
            console.log(`      ⏭️  Skipped: ${result.skipped} angles (missing files)`);
        }
    }

    console.log(`\n📈 TOTALS:`);
    console.log(`   ✅ Total Uploaded: ${totalUploaded}/60`);
    console.log(`   ⏭️  Total Skipped: ${totalSkipped}`);

    if (totalSkipped > 0) {
        console.log(`\n⏳ ${totalSkipped} renders missing - generate and re-run to complete.`);
    } else {
        console.log(`\n🎉 All custom builds fully uploaded!`);
    }
    console.log('');
}

main().catch(console.error);
