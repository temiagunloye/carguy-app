#!/usr/bin/env node
/**
 * ADD BRZ BASE MODEL TO FIRESTORE
 * This ensures the BRZ appears in the vehicle selector dropdown
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

const db = admin.firestore();

async function addBRZBaseModel() {
    console.log('\n🚗 Adding BRZ Base Model to Firestore...\n');

    const brzBaseModel = {
        modelId: 'subaru_brz_2022',
        displayName: '2022 Subaru BRZ tS',
        year: 2022,
        make: 'Subaru',
        model: 'BRZ',
        variant: 'tS',
        bodyStyle: 'coupe',
        active: true,
        tags: ['subaru', 'brz', 'sports', 'coupe', '2022'],
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    try {
        await db.collection('baseModels').doc('subaru_brz_2022').set(brzBaseModel, { merge: true });
        console.log('✅ BRZ Base Model added to baseModels collection');
        console.log('   Document ID: subaru_brz_2022');
        console.log('   Display Name: 2022 Subaru BRZ tS');
        console.log('\n📍 The BRZ should now appear in the vehicle selector dropdown!');
        console.log('🔗 Test at: https://garagemanager.co/shop/simulator.html\n');
    } catch (error) {
        console.error('❌ Error adding BRZ base model:', error.message);
    }
}

addBRZBaseModel().catch(console.error);
