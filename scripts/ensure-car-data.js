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

const CAR_IDS = ['porsche_911_2024', 'bmw_m3_2024', 'audi_rs6_2024', 'subaru_brz_2022'];

const ANGLE_NAMES = [
    'driver_front',
    'passenger_front',
    'full_driver_side',
    'full_passenger_side',
    'driver_rear',
    'passenger_rear',
    'front_center',
    'rear_center',
    'front_low',
    'rear_low'
];

async function ensureCarData() {
    console.log('🔍 Checking Standard Car Data...\n');

    for (const carId of CAR_IDS) {
        console.log(`📋 Checking ${carId}...`);
        const carRef = db.collection('standardCars').doc(carId);
        const carDoc = await carRef.get();

        if (!carDoc.exists) {
            console.log(`  ❌ Car doesn't exist`);
            continue;
        }

        const data = carDoc.data();
        const updates = {};

        // Ensure angleNames
        if (!data.angleNames || data.angleNames.length === 0) {
            updates.angleNames = ANGLE_NAMES;
            console.log(`  📝 Adding angleNames`);
        }

        // Ensure angleCount
        if (!data.angleCount) {
            updates.angleCount = ANGLE_NAMES.length;
            console.log(`  📝 Adding angleCount`);
        }

        // Ensure displayName
        if (!data.displayName) {
            const names = {
                'porsche_911_2024': '2024 Porsche 911',
                'bmw_m3_2024': '2024 BMW M3',
                'audi_rs6_2024': '2024 Audi RS6',
                'subaru_brz_2022': '2022 Subaru BRZ'
            };
            updates.displayName = names[carId];
            console.log(`  📝 Adding displayName: ${updates.displayName}`);
        }

        // Ensure make/model/year
        if (!data.make || !data.model || !data.year) {
            const parts = carId.split('_');
            updates.make = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
            updates.model = parts.slice(1, -1).map(p => p.toUpperCase()).join(' ');
            updates.year = parseInt(parts[parts.length - 1]);
            console.log(`  📝 Adding make/model/year`);
        }

        // Ensure defaultVariantId
        if (!data.defaultVariantId) {
            updates.defaultVariantId = `${carId}_default`;
            console.log(`  📝 Adding defaultVariantId: ${updates.defaultVariantId}`);
        }

        // Ensure sourceType
        if (!data.sourceType) {
            updates.sourceType = 'dealer';
        }

        // Ensure createdAt
        if (!data.createdAt) {
            updates.createdAt = admin.firestore.FieldValue.serverTimestamp();
        }

        if (Object.keys(updates).length > 0) {
            await carRef.set(updates, { merge: true });
            console.log(`  ✅ Updated ${Object.keys(updates).length} fields`);
        } else {
            console.log(`  ✅ All required fields present`);
        }

        // Check for variant
        const variantRef = db.collection('standardCarVariants').doc(`${carId}_default`);
        const variantDoc = await variantRef.get();

        if (!variantDoc.exists && data.photoAnglesHttp) {
            console.log(`  🎨 Creating default variant...`);
            const angleAssets = {};
            ANGLE_NAMES.forEach(angle => {
                if (data.photoAnglesHttp[angle]) {
                    angleAssets[angle] = `standardCars/${carId}/renders/${angle}.png`;
                }
            });

            await variantRef.set({
                standardCarId: carId,
                variantType: 'dealer_paint',
                colorName: 'Default',
                colorKey: 'default',
                status: 'approved',
                angleAssets,
                thumbPath: `standardCars/${carId}/renders/driver_front.png`,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`  ✅ Variant created with ${Object.keys(angleAssets).length} angles`);
        } else if (variantDoc.exists) {
            console.log(`  ✅ Variant exists`);
        }

        console.log('');
    }

    console.log('✨ All cars checked!\n');
}

ensureCarData().catch(console.error);
