const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: "carguy-app-v1.appspot.com" // Replacing with actual bucket name if known, using placeholder from assumption
    });
}

const db = admin.firestore();

const seedVehicles = [
    {
        make: 'Porsche',
        model: '911',
        variant: 'Carrera 4S',
        year: 2024,
        bodyType: 'Coupe',
        photoPackStatus: 'complete',
        angleCount: 10,
        basePrice: 138600
    },
    {
        make: 'BMW',
        model: 'M3',
        variant: 'Competition',
        year: 2024,
        bodyType: 'Sedan',
        photoPackStatus: 'complete',
        angleCount: 10,
        basePrice: 84300
    },
    {
        make: 'Subaru',
        model: 'BRZ',
        variant: 'tS',
        year: 2024,
        bodyType: 'Coupe',
        photoPackStatus: 'complete',
        angleCount: 10,
        basePrice: 35395
    }
];

// Placeholder image URLs since we are seeding structure without verified storage assets
const PLACEHOLDER_ANGLES = [
    'https://placehold.co/1920x1080/000000/FFF?text=Front',
    'https://placehold.co/1920x1080/000000/FFF?text=Front+Left',
    'https://placehold.co/1920x1080/000000/FFF?text=Left',
    'https://placehold.co/1920x1080/000000/FFF?text=Rear+Left',
    'https://placehold.co/1920x1080/000000/FFF?text=Rear',
    'https://placehold.co/1920x1080/000000/FFF?text=Rear+Right',
    'https://placehold.co/1920x1080/000000/FFF?text=Right',
    'https://placehold.co/1920x1080/000000/FFF?text=Front+Right',
    'https://placehold.co/1920x1080/000000/FFF?text=Top',
    'https://placehold.co/1920x1080/000000/FFF?text=Interior'
];

async function seed() {
    console.log('🌱 Starting vehicle seed...');

    const collectionRef = db.collection('vehicles');

    for (const vehicle of seedVehicles) {
        // Check if exists
        const snapshot = await collectionRef
            .where('make', '==', vehicle.make)
            .where('model', '==', vehicle.model)
            .where('variant', '==', vehicle.variant)
            .get();

        if (!snapshot.empty) {
            console.log(`Skipping ${vehicle.make} ${vehicle.model} - already exists.`);
            continue;
        }

        // Add vehicle
        const docRef = await collectionRef.add({
            ...vehicle,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`Created ${vehicle.make} ${vehicle.model} (ID: ${docRef.id})`);

        // Add Angles
        const anglesRef = docRef.collection('angles');
        const angleNames = ['front', 'front-left', 'left', 'rear-left', 'rear', 'rear-right', 'right', 'front-right', 'top', 'interior'];

        const batch = db.batch();
        angleNames.forEach((name, index) => {
            const angleDoc = anglesRef.doc(name);
            batch.set(angleDoc, {
                angleKey: name,
                storageUrl: PLACEHOLDER_ANGLES[index],
                uploadedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });

        await batch.commit();
        console.log(`   + Added ${angleNames.length} angles.`);
    }

    console.log('✅ Seeding complete.');
}

seed().catch(console.error);
