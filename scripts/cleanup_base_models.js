
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore');

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

const ALLOWED_IDS = [
    'audi_rs6_2024',
    'bmw_m3_2023',
    'mercedes_c63_2024',
    'porsche_911_2024',
    'subaru_brz_2022',
    // Custom builds
    'mercedes_c63_rohana_build',
    'porsche_911_manthey_build',
    'subaru_brz_te37_build',
    // Fallbacks
    'audi_rs6', 'bmw_m3', 'mercedes_c63', 'porsche_911', 'subaru_brz'
];

async function cleanupBaseModels() {
    console.log("🔍 Listing all Base Models (for cleanup)...");
    const snapshot = await getDocs(collection(db, 'baseModels'));

    console.log(`Found ${snapshot.size} base models.`);

    for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const id = docSnap.id;
        const name = data.name || data.displayName || data.model || 'Unknown';

        let shouldKeep = false;

        // Check if ID is in allowed list
        if (ALLOWED_IDS.includes(id)) shouldKeep = true;

        // Relaxed check: if the ID *contains* one of the base model names
        if (['audi', 'bmw', 'mercedes', 'porsche', 'subaru', 'rs6', 'm3', 'c63', '911', 'brz'].some(k => id.toLowerCase().includes(k))) shouldKeep = true;

        // EXPLICIT REMOVAL LIST (Just in case)
        if (['civic', 'camry', 'honda', 'toyota'].some(k => id.toLowerCase().includes(k) || name.toLowerCase().includes(k))) {
            shouldKeep = false;
        }

        console.log(`- [${id}] "${name}" (Active: ${data.active !== false}) -> ${shouldKeep ? 'KEEP' : 'DISABLE'}`);

        if (!shouldKeep) {
            if (data.active !== false) {
                console.log(`   🚫 Disabling ${id} in baseModels...`);
                await updateDoc(doc(db, 'baseModels', id), { active: false });
            } else {
                console.log(`   (Already disabled)`);
            }
        } else {
            // Ensure it is active if it's allowed
            if (data.active === false) {
                console.log(`   ✅ Re-enabling ${id} in baseModels...`);
                await updateDoc(doc(db, 'baseModels', id), { active: true });
            }
        }
    }
    console.log("✨ Base Model Cleanup Complete");
    setTimeout(() => process.exit(0), 1000);
}

cleanupBaseModels().catch(console.error);
