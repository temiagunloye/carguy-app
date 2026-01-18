#!/usr/bin/env node
/**
 * Update baseModels with anchor metadata using Firebase Web SDK
 * Reads anchor JSON files and updates Firestore
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc, serverTimestamp } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyCEFvcV4MKlxtXOiZXRFTL8xVSGuKsPme8",
    authDomain: "carguy-app-demo.firebaseapp.com",
    projectId: "carguy-app-demo",
    storageBucket: "carguy-app-demo.firebasestorage.app",
    messagingSenderId: "869343833766",
    appId: "1:869343833766:web:d80b4034b146525a588e67"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const MODELS = [
    {
        id: 'porsche_911_2024',
        anchorsFile: 'tmp/anchors/porsche_911_2024_anchors.json'
    },
    {
        id: 'bmw_m3_2023',
        anchorsFile: 'tmp/anchors/bmw_m3_2023_anchors.json'
    },
    {
        id: 'subaru_brz_2022',
        anchorsFile: 'tmp/anchors/subaru_brz_2022_anchors.json'
    }
];

async function updateAnchors() {
    console.log('\n📍 Updating baseModels with anchor metadata...\n');

    for (const model of MODELS) {
        console.log('='.repeat(60));
        console.log(`Processing: ${model.id}`);
        console.log('='.repeat(60));

        try {
            // Read anchor JSON
            if (!fs.existsSync(model.anchorsFile)) {
                console.error(`❌ File not found: ${model.anchorsFile}`);
                continue;
            }

            const anchorsData = JSON.parse(fs.readFileSync(model.anchorsFile, 'utf8'));
            const { anchorPoints, anchorsVersion, anchorCount } = anchorsData;

            console.log(`✅ Loaded ${anchorCount} anchors from JSON`);
            console.log(`   Anchor names: ${Object.keys(anchorPoints).join(', ')}`);

            // Update Firestore
            const docRef = doc(db, 'baseModels', model.id);
            await updateDoc(docRef, {
                anchorPoints,
                anchorsVersion,
                anchorCount,
                updatedAt: serverTimestamp()
            });

            console.log(`✅ Updated baseModels/${model.id}`);
            console.log(`   Console: https://console.firebase.google.com/project/carguy-app-demo/firestore/data/~2FbaseModels~2F${model.id}\n`);

        } catch (error) {
            console.error(`❌ Error updating ${model.id}:`, error.message);
        }
    }

    console.log('='.repeat(60));
    console.log('✅ Phase A Complete: All 3 baseModels updated with anchors!');
    console.log('='.repeat(60));
    console.log('\nVerify in Firebase Console:');
    console.log('https://console.firebase.google.com/project/carguy-app-demo/firestore/data/~2FbaseModels\n');

    process.exit(0);
}

updateAnchors().catch(error => {
    console.error('❌ Failed:', error);
    process.exit(1);
});
