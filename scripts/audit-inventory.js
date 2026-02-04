const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: "carguy-app-demo.firebasestorage.app"
    });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

const TARGET_CARS = [
    'porsche_911_2024',
    'subaru_brz_2022',
    'mercedes_c63_2024',
    'bmw_m3_2024', // Consolidated ID
    'audi_rs6_2024'
];

async function runAudit() {
    console.log("🔍 -- STARTING INVENTORY AUDIT --");
    console.log("Timestamp:", new Date().toISOString());

    const report = {
        scanDate: new Date().toISOString(),
        cars: {}
    };

    for (const carId of TARGET_CARS) {
        console.log(`\nChecking Car: ${carId}`);
        const carData = { id: carId, firestore: "MISSING", builds: [], needsOverhaul: true };

        // 1. Check Firestore Car Record
        const carDoc = await db.collection('standardCars').doc(carId).get();
        if (carDoc.exists) {
            carData.firestore = "FOUND";
            console.log(`✅ Firestore Doc Found`);
        } else {
            console.log(`❌ Firestore Doc MISSING`);
        }

        // 2. Check Associated Builds in Firestore
        const buildsSnapshot = await db.collection('builds')
            .where('carId', '==', carId)
            .get();

        if (!buildsSnapshot.empty) {
            console.log(`Found ${buildsSnapshot.size} registered build(s).`);
            buildsSnapshot.forEach(doc => {
                const b = doc.data();
                const angleCount = b.photoAnglesHttp ? Object.keys(b.photoAnglesHttp).length : 0;
                carData.builds.push({
                    id: doc.id,
                    wrap: b.wrapId,
                    wheel: b.wheelId,
                    angleCount: angleCount,
                    is10AngleSpec: angleCount >= 10
                });
                console.log(`   - Build ${doc.id}: ${angleCount} angles linked.`);
            });
        } else {
            console.log(`   No registered builds found.`);
        }

        // 3. Storage Check (Check typical paths)
        // We know we attempted to put them in renders/builds/{carId}/{hash}
        const [files] = await bucket.getFiles({ prefix: `renders/builds/${carId}/` });
        const storageCount = files.length;
        console.log(`   Storage Assets: ${storageCount} files found under 'renders/builds/${carId}/'`);
        carData.storageFileCount = storageCount;

        report.cars[carId] = carData;
    }

    // Determine Status
    console.log("\n📊 -- STATUS SUMMARY --");
    for (const [id, data] of Object.entries(report.cars)) {
        const has10AngleBuild = data.builds.some(b => b.is10AngleSpec);
        const status = has10AngleBuild ? "PARTIAL COMPLIANCE" : "NEEDS OVERHAUL";
        console.log(`[${id}]: ${status} (Builds: ${data.builds.length}, Storage Files: ${data.storageFileCount})`);
    }
}

runAudit().catch(console.error);
