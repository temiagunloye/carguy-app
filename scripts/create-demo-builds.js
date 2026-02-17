
// Helper script to create demo builds
// Usage: node scripts/create-demo-builds.js

const admin = require('firebase-admin');
const path = require('path');
// Load service account key (git‑ignored)
const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');
admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath))
});
const db = admin.firestore();
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

        await db.collection('builds').doc(buildId).set({
            carId: carId,
            userId: 'demo_user',
            name: 'Demo Build',
            activeParts: [], // legacy
            installedParts: installedParts,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            isDemo: true
        });

        // Update car document with demo parts inventory
        const carRef = db.collection('cars').doc(carId);
        await carRef.set({
            parts: DEMO_PARTS.map(p => ({
                ...p,
                status: 'in_storage',
                createdAt: new Date().toISOString()
            })),
            activeBuildId: buildId,
            renderStatus: 'ready',
            baseModelId: carId
        }, { merge: true });


    }

    console.log('✅ Demo Builds Seeded!');
    process.exit(0);
}

seedDemoBuilds().catch(console.error);
