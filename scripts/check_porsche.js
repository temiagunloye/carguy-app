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

async function checkPorsche() {
    console.log('🔍 PORSCHE 911 DETAILED AUDIT\n');

    const doc = await db.collection('standardCars').doc('porsche_911_2024').get();

    if (!doc.exists) {
        console.log('❌ Porsche 911 not found in database');
        return;
    }

    const data = doc.data();
    const angles = data.photoAnglesHttp || {};

    console.log('📸 Current Porsche 911 Image URLs:\n');

    const ANGLES = [
        'driver_front', 'passenger_front',
        'full_driver_side', 'full_passenger_side',
        'driver_rear', 'passenger_rear',
        'front_center', 'rear_center',
        'front_low', 'rear_low'
    ];

    ANGLES.forEach(angle => {
        if (angles[angle]) {
            console.log(`${angle.padEnd(20)} ✅ ${angles[angle]}`);
        } else {
            console.log(`${angle.padEnd(20)} ❌ MISSING`);
        }
    });

    console.log(`\n📊 Status: ${Object.keys(angles).length}/10 angles`);
    console.log(`🎨 Background: ${data.backgroundStyle || 'not set'}`);
    console.log(`🎨 Render Source: ${data.renderSource || 'not set'}`);
}

checkPorsche().catch(console.error);
