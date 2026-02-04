
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc, getDoc, setDoc } = require('firebase/firestore');

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

const MISSING_MODELS = [
    'audi_rs6_2024',
    'mercedes_c63_2024'
];

async function restoreModels() {
    console.log("🚑 Restoring Missing Models...");

    for (const id of MISSING_MODELS) {
        const ref = doc(db, 'baseModels', id);
        const snap = await getDoc(ref);

        if (snap.exists()) {
            console.log(`✅ Found ${id}. Activating...`);
            await updateDoc(ref, { active: true });
        } else {
            console.warn(`❌ ${id} does not exist in baseModels! Creating placeholder...`);
            // Optional: Create if missing? Better to warn for now.
            await setDoc(ref, {
                id: id,
                active: true,
                name: id.replace(/_/g, ' ').toUpperCase(),
                brand: id.split('_')[0],
                model: id.split('_')[1],
                year: 2024
            });
        }
    }

    console.log("✨ Restore Complete");
    process.exit(0);
}

restoreModels().catch(console.error);
