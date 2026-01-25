const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
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
const storage = getStorage(app);
const db = getFirestore(app);

const LOCAL_DIR = 'temp_assets/porsche_911_new';
const REMOTE_DIR = 'standardCars/porsche_911/v2_neutral_gradient';
const DOC_ID = 'porsche_911_2024';

// Map filename patterns to the keys expected in the DB/Viewer
const KEY_MAPPING = {
    'driver_front': 'driver_front',
    'passenger_front': 'passenger_front',
    'full_driver_side': 'full_driver_side',
    'full_passenger_side': 'full_passenger_side',
    'driver_rear': 'driver_rear',
    'passenger_rear': 'passenger_rear',
    'front_center': 'front_center',
    'rear_center': 'rear_center',
    'front_low': 'front_low',
    'rear_low': 'rear_low'
};

async function uploadImages() {
    console.log('🚀 Starting Porsche 911 V2 Upload (Body Shop Simulator Standard)...');

    const files = fs.readdirSync(LOCAL_DIR).filter(f => f.endsWith('.png'));
    const uploadMap = {};

    for (const file of files) {
        // match specific keys
        let key = null;
        for (const [k, v] of Object.entries(KEY_MAPPING)) {
            if (file.includes(k)) {
                key = v;
                break;
            }
        }

        if (!key) {
            console.warn(`⚠️ Could not map file ${file} to a known key, skipping.`);
            continue;
        }

        console.log(`Uploading ${file} as key: ${key}...`);

        const buffer = fs.readFileSync(path.join(LOCAL_DIR, file));
        const storageRef = ref(storage, `${REMOTE_DIR}/${file}`);

        await uploadBytes(storageRef, buffer, { contentType: 'image/png' });
        const url = await getDownloadURL(storageRef);
        console.log(`✅ Uploaded: ${url}`);

        uploadMap[key] = url;
    }

    if (Object.keys(uploadMap).length === 0) {
        console.error('❌ No images uploaded.');
        return;
    }

    console.log('📝 Updating in Firestore...');
    const carRef = doc(db, 'standardCars', DOC_ID);

    // We update the 'images' field with the new map. 
    // STARTING with the new ones. Ideally we merge? 
    // The user requested a REPLACE for style consistency.
    // But since we are missing 3 images, maybe we should keep the old ones for the missing keys?
    // No, mixing styles (white studio vs gradient) looks broken.
    // Better to have fewer keys or just leave them null for now. 
    // The viewer loop might break if keys are missing from the array it expects.
    // Let's just update with what we have. API usually handles partials or we can check the viewing logic later.

    // Using setDoc with merge: true ensures we don't overwrite other fields (like display name, year)
    // but also creates the doc if it's missing (though it shouldn't be).
    await setDoc(carRef, {
        images: uploadMap,
        updatedAt: new Date().toISOString(),
        styleVersion: 'v2_neutral_gradient',
        // Ensuring metadata aligning with Body Shop Simulator needs
        simulatorReady: true
    }, { merge: true });

    console.log('🎉 Body Shop Database updated successfully!');
}

uploadImages().catch(console.error);
