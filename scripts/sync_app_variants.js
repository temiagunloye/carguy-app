
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, writeBatch, query, where, updateDoc, serverTimestamp, getDoc } = require('firebase/firestore');

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

const TARGET_MODELS = [
    { baseId: 'audi_rs6_2024', name: 'RS6' },
    { baseId: 'bmw_m3_2023', name: 'M3' },
    { baseId: 'mercedes_c63_2024', name: 'C63' },
    { baseId: 'porsche_911_2024', name: '911' },
    { baseId: 'subaru_brz_2022', name: 'BRZ' }
];

const ANGLE_KEYS = [
    'driver_front', 'passenger_front', // Front Corners
    'full_driver_side', 'full_passenger_side', // Sides
    'driver_rear', 'passenger_rear', // Rear Corners
    'front_center', 'rear_center', // Centers
    'front_low', 'rear_low' // Lows
];

async function syncVariants() {
    console.log("🚀 Starting App Data Sync (Client SDK)...");

    for (const target of TARGET_MODELS) {
        console.log(`\n📦 Processing ${target.name} (${target.baseId})...`);

        // 1. Get New Images from Base Model
        const baseRef = doc(db, 'baseModels', target.baseId);
        const baseDoc = await getDoc(baseRef);

        if (!baseDoc.exists()) {
            console.warn(`   ⚠️ Base Model ${target.baseId} not found. Skipping.`);
            continue;
        }

        const baseData = baseDoc.data();
        const newImages = baseData.images || {}; // { angle_01: url, ... }

        if (!newImages['angle_01']) {
            console.warn("   ⚠️ No images found in base model. Skipping.");
            continue;
        }

        // 2. Find matching Standard Car(s)
        const carsRef = collection(db, 'standardCars');
        // Client SDK query requires index for some filters, but simple == usually works if fields exist
        // We will try to find by ID first
        let carId = null;

        // Exact ID check
        const idQuery = query(carsRef, where('id', '==', target.baseId));
        const idSnap = await getDocs(idQuery);

        if (!idSnap.empty) {
            carId = idSnap.docs[0].id;
        } else {
            // Fetch all and filter client side to avoid complex index issues in this script
            const allCarsSnap = await getDocs(carsRef);
            const match = allCarsSnap.docs.find(d => {
                const data = d.data();
                return (data.model && data.model.includes(target.name)) || d.id.includes(target.name.toLowerCase().replace(' ', '_'));
            });
            if (match) {
                carId = match.id;
                console.log(`   Found standard car via name match: ${carId}`);
            }
        }

        if (!carId) {
            console.warn(`   ⚠️ No matching standardCar found for ${target.name}. Skipping.`);
            continue;
        }

        // 3. Update Variants
        const variantsRef = collection(db, 'standardCarVariants');
        const vQ = query(variantsRef, where('standardCarId', '==', carId));
        const variantsSnap = await getDocs(vQ);

        if (variantsSnap.empty) {
            console.warn(`   ⚠️ No variants found for ${carId}.`);
            continue;
        }

        console.log(`   Found ${variantsSnap.size} variants. Updating images...`);

        const batch = writeBatch(db);

        variantsSnap.docs.forEach(variantDoc => {
            const variantData = variantDoc.data();

            // Construct new angleAssets map
            const newAngleAssets = {};

            ANGLE_KEYS.forEach((key, index) => {
                const angleNum = index + 1;
                const angleKey = `angle_${angleNum < 10 ? '0' + angleNum : angleNum}`;
                if (newImages[angleKey]) {
                    newAngleAssets[key] = newImages[angleKey];
                }
            });

            // Update Doc
            batch.update(variantDoc.ref, {
                angleAssets: newAngleAssets,
                thumbPath: newImages['angle_01'] || newImages['angle_05'],
                updatedAt: serverTimestamp()
            });
        });

        await batch.commit();
        console.log(`   ✅ Synced ${variantsSnap.size} variants for ${target.name}`);

        // Update StandardCar Thumb/Hero
        const carDocRef = doc(db, 'standardCars', carId);
        await updateDoc(carDocRef, {
            heroAssetPath: newImages['angle_01'],
            updatedAt: serverTimestamp()
        });
        console.log(`   ✅ Updated StandardCar hero image`);
    }

    console.log("\n🎉 Sync Complete!");
    // Force exit after a short delay to allow pending writes to flush
    setTimeout(() => process.exit(0), 1000);
}

syncVariants().catch(err => {
    console.error(err);
    process.exit(1);
});
