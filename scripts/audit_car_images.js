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

const STANDARD_ANGLES = [
    'driver_front', 'passenger_front',
    'full_driver_side', 'full_passenger_side',
    'driver_rear', 'passenger_rear',
    'front_center', 'rear_center',
    'front_low', 'rear_low'
];

async function auditCar(carId) {
    const doc = await db.collection('standardCars').doc(carId).get();

    if (!doc.exists) {
        console.log(`\n❌ ${carId}: NOT FOUND IN DATABASE`);
        return;
    }

    const data = doc.data();
    const angles = data.photoAnglesHttp || {};

    console.log(`\n${'='.repeat(70)}`);
    console.log(`🚗 ${carId.toUpperCase()}`);
    console.log(`${'='.repeat(70)}`);

    // Check completeness
    const existingAngles = STANDARD_ANGLES.filter(a => angles[a]);
    const missingAngles = STANDARD_ANGLES.filter(a => !angles[a]);

    console.log(`\n📊 Status: ${existingAngles.length}/10 angles`);

    if (missingAngles.length > 0) {
        console.log(`\n⚠️  MISSING ANGLES (${missingAngles.length}):`);
        missingAngles.forEach(a => console.log(`   - ${a}`));
    }

    // Check for duplicates
    const urlMap = {};
    const duplicates = [];

    for (const [angle, url] of Object.entries(angles)) {
        if (!urlMap[url]) {
            urlMap[url] = [];
        }
        urlMap[url].push(angle);
    }

    for (const [url, anglesList] of Object.entries(urlMap)) {
        if (anglesList.length > 1) {
            duplicates.push({ url, angles: anglesList });
        }
    }

    if (duplicates.length > 0) {
        console.log(`\n🔄 DUPLICATE IMAGES FOUND (${duplicates.length} sets):`);
        duplicates.forEach(({ url, angles }) => {
            console.log(`\n   Same image used for: ${angles.join(', ')}`);
            console.log(`   URL: ...${url.slice(-50)}`);
        });
    } else {
        console.log(`\n✅ No duplicates - all angles use unique images`);
    }

    // Display all URLs for manual inspection
    console.log(`\n📸 IMAGE URLS:`);
    STANDARD_ANGLES.forEach(angle => {
        if (angles[angle]) {
            const url = angles[angle];
            const filename = url.split('/').pop().split('?')[0];
            console.log(`   ${angle.padEnd(20)} → ${filename}`);
        } else {
            console.log(`   ${angle.padEnd(20)} → MISSING`);
        }
    });

    // Background info
    const bgStyle = data.backgroundStyle || 'unknown';
    console.log(`\n🎨 Expected Background: ${bgStyle}`);
}

async function main() {
    console.log('🔍 CAR IMAGE QUALITY AUDIT');
    console.log('='.repeat(70));
    console.log('\nChecking for:');
    console.log('  • Duplicate images across different angles');
    console.log('  • Missing angles');
    console.log('  • Background consistency\n');

    await auditCar('bmw_m3_2023');
    await auditCar('subaru_brz_2022');
    await auditCar('audi_rs6_2024');
    await auditCar('mercedes_c63_2024');

    console.log('\n' + '='.repeat(70));
    console.log('✅ AUDIT COMPLETE');
    console.log('='.repeat(70));
    console.log('\n📝 Next Steps:');
    console.log('   1. Manually test rotation on live site');
    console.log('   2. Check if any angles show the same image');
    console.log('   3. Verify background consistency within each car');
    console.log('   4. Report any issues found\n');
}

main().catch(console.error);
