#!/usr/bin/env node

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

const db = admin.firestore();

async function updateBRZModelYear() {
    console.log('\n📝 UPDATING SUBARU BRZ MODEL YEAR\n');

    // Check if 2022 exists
    const brz2022 = await db.collection('standardCars').doc('subaru_brz_2022').get();

    if (!brz2022.exists) {
        console.log('❌ subaru_brz_2022 not found');
        return;
    }

    const data = brz2022.data();

    console.log('✅ Found subaru_brz_2022');
    console.log('📋 Copying data to subaru_brz_2024...\n');

    // Copy all data to 2024 version
    await db.collection('standardCars').doc('subaru_brz_2024').set({
        ...data,
        modelYear: 2024,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ Created subaru_brz_2024 with same images');
    console.log('📦 All 10 angles copied from 2022 version');
    console.log('\n💡 Note: subaru_brz_2022 still exists in database');
    console.log('   To remove it, run: node scripts/remove_brz_2022.js\n');
}

updateBRZModelYear().catch(console.error);
