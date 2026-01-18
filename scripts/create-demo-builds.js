
// Helper script to create demo builds
// Usage: node scripts/create-demo-builds.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');

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

// Seed data based on prompt requirements
const DEMO_PARTS = [
    {
        id: 'demo_wheel_01',
        partId: 'wheel_aftermarket_01',
        name: 'Aftermarket 5-Spoke',
        category: 'wheel',
        status: 'in_storage',
        placement: {
            anchorName: 'ANCHOR_WHEEL_*',
            scaleMode: 'relativeToWheelAnchors'
        }
    },
    {
        id: 'demo_lip_01',
        partId: 'front_lip_01',
        name: 'Carbon Splitter',
        category: 'front_lip',
        status: 'in_storage',
        placement: {
            anchorName: 'ANCHOR_FRONT_CENTER_LOW',
            scaleMode: 'relativeToCarWidth'
        }
    },
    {
        id: 'demo_skirt_01',
        partId: 'side_skirt_01',
        name: 'Aero Side Skirts',
        category: 'side_skirt',
        status: 'in_storage',
        placement: {
            anchorName: 'ANCHOR_SIDE_*_LOW', // pattern
            anchorPattern: 'ANCHOR_SIDE_*_LOW',
            scaleMode: 'relativeToWheelbase'
        }
    },
    {
        id: 'demo_diffuser_01',
        partId: 'rear_diffuser_01',
        name: 'Race Diffuser',
        category: 'rear_diffuser',
        status: 'in_storage',
        placement: {
            anchorName: 'ANCHOR_REAR_CENTER_LOW',
            scaleMode: 'relativeToCarWidth'
        }
    }
];

// We will update the Demo Cars in 'cars' collection?
// Or created specific builds?
// User prompt: "Demo Build records".

async function seedDemoBuilds() {
    console.log('🌱 Seeding Demo Builds...');

    // We assume there are 3 demo cars with known IDs or we create them.
    // Let's create standard demo builds for the App to use.

    const DEMO_BUILD_IDS = [
        'demo_build_porsche_911',
        'demo_build_bmw_m3',
        'demo_build_subaru_brz'
    ];

    const CAR_IDS = [
        'porsche_911_2024',
        'bmw_m3_2023',
        'subaru_brz_2022'
    ];

    // Create Builds
    for (let i = 0; i < CAR_IDS.length; i++) {
        const carId = CAR_IDS[i];
        const buildId = DEMO_BUILD_IDS[i];

        console.log(`Creating build ${buildId} for car ${carId}...`);

        // Installed parts: Start empty or with wheels?
        // Let's start with nothing installed to let user "Install" them.
        const installedParts = [];

        await setDoc(doc(db, 'builds', buildId), {
            carId: carId, // Base Model ID acting as Car ID in demo
            userId: 'demo_user',
            name: 'Demo Build',
            activeParts: [], // Legacy
            installedParts: installedParts,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            isDemo: true
        });

        // Also need to ensure the Car Document exists and has the 'parts' inventory
        // so CarDetailScreen can list them (toggle from 'in_storage' to 'installed')

        // NOTE: In Demo Mode, app might use local state or read from doc.
        // CarDetailScreen reads "latestCar.parts".
        // Let's update the car doc too.

        // Assuming carId is the ID in 'cars' collection or 'baseModels'?
        // The app uses baseModels for 3D but 'cars' for user instances.
        // We'll create/update 'cars/{carId}' for the demo flow.

        // For simple demo, we put the inventory in the car doc.
        const carRef = doc(db, 'cars', carId);
        // Ensure parts array has our demo parts
        await setDoc(carRef, {
            parts: DEMO_PARTS.map(p => ({
                ...p,
                status: 'in_storage', // Reset to storage
                createdAt: new Date().toISOString()
            })),
            activeBuildId: buildId,
            renderStatus: 'ready', // ready for 3D
            baseModelId: carId // Self-reference if using base id
        }, { merge: true });

    }

    console.log('✅ Demo Builds Seeded!');
    process.exit(0);
}

seedDemoBuilds().catch(console.error);
