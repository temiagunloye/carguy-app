#!/usr/bin/env node
/**
 * FIX CUSTOM BUILD STRUCTURE FOR SIMULATOR
 * Moves variants from standardCars/{carId}/variants/* to builds/*
 */

const admin = require('firebase-admin');
const path = require('path');

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

const db = admin.firestore();

// Build definitions matching the uploads
const BUILDS = [
    {
        id: 'brz_coal_bronze_te37',
        carId: 'subaru_brz_2022',
        displayName: 'BRZ Matte Coal + Bronze TE37',
        wrapId: 'teckwrap_matte_coal',
        wheelId: 'volk_te37_bronze',
        description: 'Matte Coal wrap with Bronze Volk Racing TE37 Saga S-Plus wheels',
        tags: ['custom', 'street', 'aggressive'],
        featured: true
    },
    {
        id: 'porsche_gt3_camo_green',
        carId: 'porsche_911_2024',
        displayName: 'GT3 Camouflage Green',
        wrapId: 'teckwrap_camo_green',
        wheelId: null,
        description: 'Teckwrap Camouflage Green wrap on GT3',
        tags: ['custom', 'gt3', 'camo'],
        featured: true
    },
    {
        id: 'bmw_m3_toronto_red_bbs',
        carId: 'bmw_m3_2023',
        displayName: 'M3 Toronto Red + BBS FI-R',
        wrapId: null, // paint
        wheelId: 'bbs_fir_platinum',
        description: 'Toronto Red paint with BBS Forged FI-R Platinum wheels',
        tags: ['custom', 'bmw', 'performance'],
        featured: true
    },
    {
        id: 'audi_rs6_ultra_blue_bbs',
        carId: 'audi_rs6_2024',
        displayName: 'RS6 Ultra Blue + BBS Mesh',
        wrapId: null, // paint
        wheelId: 'bbs_super_rs_mesh',
        description: 'Ultra Blue Metallic with BBS Super RS Mesh wheels',
        tags: ['custom', 'wagon', 'rs6'],
        featured: true
    },
    {
        id: 'mercedes_c63_coal_rohana',
        carId: 'mercedes_c63_2024',
        displayName: 'C63 Matte Coal + Rohana',
        wrapId: 'teckwrap_matte_coal',
        wheelId: 'rohana_rfx17_titanium',
        description: 'Matte Coal wrap with Rohana RFX17 Titanium wheels',
        tags: ['custom', 'mercedes', 'amg'],
        featured: true
    }
];

async function createBuildDocuments() {
    console.log('\n🔧 FIXING CUSTOM BUILD STRUCTURE FOR SIMULATOR');
    console.log('='.repeat(70));

    for (const build of BUILDS) {
        console.log(`\n📦 Processing: ${build.displayName}`);

        // Get angles from Storage path
        const storagePath = build.id === 'brz_coal_bronze_te37'
            ? 'builds/subaru_brz_2022/matte_coal_te37_bronze'
            : build.id === 'porsche_gt3_camo_green'
                ? 'builds/porsche_911_2024/camo_green_gt3'
                : build.id === 'bmw_m3_toronto_red_bbs'
                    ? 'builds/bmw_m3_2023/toronto_red_bbs'
                    : build.id === 'audi_rs6_ultra_blue_bbs'
                        ? 'builds/audi_rs6_2024/ultra_blue_bbs_mesh'
                        : 'builds/mercedes_c63_2024/matte_coal_rohana';

        const photoAnglesHttp = {};

        // Build angle URLs (angle_01 through angle_10)
        for (let i = 1; i <= 10; i++) {
            const angleNum = i.toString().padStart(2, '0');
            const angleName = `angle_${angleNum}`;
            const url = `https://storage.googleapis.com/carguy-app-demo.firebasestorage.app/${storagePath}/${angleName}.png`;
            photoAnglesHttp[angleName] = url;
        }

        // Create build document
        const buildData = {
            ...build,
            photoAnglesHttp,
            renderSource: 'gemini_ai_generated',
            renderQuality: 'photorealistic_studio',
            backgroundStyle: 'dark_gradient',
            status: 'active',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        try {
            await db.collection('builds').doc(build.id).set(buildData);
            console.log(`   ✅ Created builds/${build.id}`);
        } catch (error) {
            console.error(`   ❌ Error: ${error.message}`);
        }
    }

    console.log('\n' + '='.repeat(70));
    console.log('✨ FIRESTORE STRUCTURE FIXED');
    console.log('='.repeat(70));
    console.log('\n📋 Summary:');
    console.log(`   • Created ${BUILDS.length} build documents`);
    console.log(`   • Each with 10 angle URLs (angle_01 through angle_10)`);
    console.log(`   • Simulator should now load all custom builds properly`);
    console.log('\n🔄 Refresh simulator to see changes!\n');
}

createBuildDocuments().catch(console.error);
