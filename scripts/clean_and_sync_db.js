const admin = require('firebase-admin');
const path = require('path');

try {
    const serviceAccount = require(path.join(process.cwd(), 'serviceAccountKey.json'));
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: 'carguy-app-demo.firebasestorage.app'
    });
} catch (e) {
    console.error("Init Error:", e.message);
    process.exit(1);
}

const db = admin.firestore();
const BUCKET_NAME = 'carguy-app-demo.firebasestorage.app';

const ALLOWLIST = ['audi_rs6', 'subaru_brz_custom', 'porsche_manthey'];

// Angle Map for 8-point rotation
const ANGLE_MAP = {
    'driver_front': 'angle_01.png',
    'front_center': 'angle_02.png',
    'passenger_front': 'angle_03.png',
    'full_passenger_side': 'angle_04.png',
    'passenger_rear': 'angle_05.png',
    'rear_center': 'angle_06.png',
    'driver_rear': 'angle_07.png',
    'full_driver_side': 'angle_08.png'
};

const CAR_DATA = [
    {
        id: 'audi_rs6',
        displayName: 'Audi RS6 Avant (Custom)',
        make: 'Audi',
        model: 'RS6',
        year: 2024,
        status: 'Live',
        folder: 'audi_rs6'
    },
    {
        id: 'subaru_brz_custom',
        displayName: 'Subaru BRZ (Custom)',
        make: 'Subaru',
        model: 'BRZ',
        year: 2022,
        status: 'Live',
        folder: 'subaru_brz_custom'
    },
    {
        id: 'porsche_manthey',
        displayName: 'Porsche 911 GT3 MR',
        make: 'Porsche',
        model: '911 GT3',
        year: 2024,
        status: 'Live',
        folder: 'porsche_manthey'
    }
];

async function cleanCollection(collectionName) {
    console.log(`🧹 Cleaning collection: ${collectionName}...`);
    const snapshot = await db.collection(collectionName).get();

    if (snapshot.empty) {
        console.log("   (Empty)");
        return;
    }

    const batch = db.batch();
    let count = 0;

    snapshot.docs.forEach(doc => {
        if (!ALLOWLIST.includes(doc.id)) {
            console.log(`   Deleting old entry: ${doc.id}`);
            batch.delete(doc.ref);
            count++;
        } else {
            console.log(`   Keeping verified entry: ${doc.id}`);
        }
    });

    if (count > 0) {
        await batch.commit();
        console.log(`   ✅ Deleted ${count} entries.`);
    } else {
        console.log("   Identical match, no deletions needed.");
    }
}

async function registerCars() {
    console.log(`\n🚀 Registering Verified Cars...`);

    // We register to BOTH collections to be safe, ensuring the list populates correctly.
    const collections = ['standardCars', 'baseModels'];

    for (const car of CAR_DATA) {
        console.log(`   upserting ${car.id}...`);

        const photoAnglesHttp = {};
        for (const [key, filename] of Object.entries(ANGLE_MAP)) {
            photoAnglesHttp[key] = `https://storage.googleapis.com/${BUCKET_NAME}/cars/${car.folder}/${filename}`;
        }

        const docData = {
            id: car.id,
            modelId: car.id, // For baseModels compatibility
            displayName: car.displayName,
            make: car.make,
            model: car.model,
            year: car.year,
            status: car.status,
            angleCount: 8,
            photoAnglesHttp: photoAnglesHttp,
            thumbnail: photoAnglesHttp['driver_front'],
            // Flags to ensure it's treated as a valid demo car
            active: true,
            demo: true,
            version: 'v2',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        for (const col of collections) {
            await db.collection(col).doc(car.id).set(docData, { merge: true });
        }
    }
    console.log("   ✅ Registration Complete.");
}

async function run() {
    await cleanCollection('standardCars');
    await cleanCollection('baseModels'); // Legacy collection likely populating the list
    await registerCars();
    console.log("\n✨ Website Database Synced.");
}

run();
