const admin = require('firebase-admin');
const path = require('path');

// Initialize with Service Account
try {
    const serviceAccount = require(path.join(process.cwd(), 'serviceAccountKey.json'));
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: 'carguy-app-demo.firebasestorage.app'
    });
} catch (e) {
    console.error("Failed to init Firebase:", e.message);
    process.exit(1);
}

const db = admin.firestore();
const BUCKET_NAME = 'carguy-app-demo.firebasestorage.app';

// Mapping: Website Keys -> My Angle Files
// Website rotation has 8 steps. We have 10. We map the 8 horizontal ones.
const ANGLE_MAP = {
    'driver_front': 'angle_01.png',
    'front_center': 'angle_02.png',
    'passenger_front': 'angle_03.png',
    'full_passenger_side': 'angle_04.png',
    'passenger_rear': 'angle_05.png',
    'rear_center': 'angle_06.png',
    'driver_rear': 'angle_07.png',
    'full_driver_side': 'angle_08.png',
    'front_low': 'angle_09.png',
    'rear_low': 'angle_10.png'
};

const CARS = [
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
    },
    {
        id: 'c63_2024_stock_obsidian_black',
        displayName: 'Mercedes-AMG C63 Stock',
        make: 'Mercedes-AMG',
        model: 'C63',
        year: 2024,
        status: 'Live',
        folder: 'c63_2024_stock_obsidian_black'
    }
];

async function registerCars() {
    console.log('🚀 Registering Cars in Firestore (standardCars)...\n');

    for (const car of CARS) {
        console.log(`📝 Registering ${car.displayName}...`);

        const photoAnglesHttp = {};

        // Construct Public URLs
        for (const [key, filename] of Object.entries(ANGLE_MAP)) {
            // Format: https://storage.googleapis.com/BUCKET/renders/builds/FOLDER/FILE
            photoAnglesHttp[key] = `https://storage.googleapis.com/${BUCKET_NAME}/renders/builds/${car.folder}/${filename}`;
        }

        const docData = {
            id: car.id,
            displayName: car.displayName,
            make: car.make,
            model: car.model,
            year: car.year,
            status: car.status,
            angleCount: 10,
            photoAnglesHttp: photoAnglesHttp,
            thumbnail: photoAnglesHttp['driver_front'], // Use Angle 01 as thumb
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        try {
            await db.collection('baseModels').doc(car.id).set(docData, { merge: true });
            console.log(`   ✅ Success! View at: https://garagemanager.co/shop/simulator.html?carId=${car.id}`); // Assuming this URL structure based on viewer.html usage
        } catch (err) {
            console.error(`   ❌ Error writing doc:`, err.message);
        }
    }
    console.log('\n✨ Database Update Complete.');
}

registerCars();
