#!/usr/bin/env node

const admin = require('firebase-admin');

// Initialize Firebase
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

// CURATED BUILDS REGISTRY (SOURCE OF TRUTH)
const APPROVED_RENDERS = [
    {
        buildId: 'subaru_brz_custom',
        label: 'Subaru BRZ Custom',
        status: 'ready',
        angleCount: 10,
        storagePrefix: 'cars/subaru_brz_custom',
        spec: 'Matte Coal Wrap, Bronze TE37s'
    },
    {
        buildId: 'porsche_manthey',
        label: 'Porsche 911 GT3 MR',
        status: 'ready',
        angleCount: 10,
        storagePrefix: 'cars/porsche_manthey',
        spec: 'Green, Racing Kit'
    },
    {
        buildId: 'audi_rs6',
        label: 'Audi RS6 Avant Custom',
        status: 'ready',
        angleCount: 10,
        storagePrefix: 'cars/audi_rs6',
        spec: 'Ultra Blue, BBS Super RS'
    },
    {
        buildId: 'c63_2024_stock_obsidian_black',
        label: 'Mercedes-AMG C63 Stock',
        status: 'partial',
        angleCount: 6,
        storagePrefix: 'renders/builds/c63_2024_stock_obsidian_black',
        spec: 'Obsidian Black, Stock Wheels'
    }
];

async function populateApprovedRenders() {
    console.log('🔒 POPULATING APPROVED RENDERS REGISTRY');
    console.log('='.repeat(70));
    console.log('This registry enforces "approved renders only" - no stock photo fallback.\\n');

    for (const build of APPROVED_RENDERS) {
        console.log(`   📝 Registering: ${build.label} (${build.angleCount}/10)`);

        await db.collection('approvedRenders').doc(build.buildId).set({
            ...build,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    }

    console.log('\\n' + '='.repeat(70));
    console.log(`✅ COMPLETE: ${APPROVED_RENDERS.length} approved builds registered`);
    console.log('\\n📋 APPROVED BUILDS:');
    APPROVED_RENDERS.forEach(b => {
        const badge = b.status === 'ready' ? '✅' : '⚠️';
        console.log(`   ${badge} ${b.label} - ${b.angleCount}/10 angles`);
    });
}

populateApprovedRenders().catch(console.error);
