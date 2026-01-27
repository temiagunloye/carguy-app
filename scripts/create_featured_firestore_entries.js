const admin = require('firebase-admin');
// Use the root service account
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

// Build Configurations requested by the user
const HERO_BUILDS = [
    {
        vehicleId: 'porsche_911_2024',
        name: 'Camo Green + Manthey',
        specDescription: 'Camo Green Wrap + Manthey Racing Aero Discs',
        wrapId: 'camo-green-cg51',
        wheelId: 'porsche-911-manthey',
        hash: 'camo-green-cg51_porsche-911-manthey',
        heroOrder: 1,
        // Mapping generic angle keys to potential filenames from seed-builds.js
        angleMapping: {
            'front-left': 'porsche_911_manthey_camo_front_left_1769538445797.png',
            'left': 'porsche_911_manthey_camo_side_driver_1769538652970.png',
            'rear-left': 'porsche_911_manthey_camo_rear_left_34_1769538626556.png',
            'front': 'porsche_911_manthey_camo_front_center_1769538673022.png',
            'rear': 'porsche_911_manthey_camo_rear_center_1769538695309.png'
        }
    },
    {
        vehicleId: 'subaru_brz_2022',
        name: 'Matte Coal + TE37',
        specDescription: 'Matte Coal Wrap + Volk Racing TE37',
        wrapId: 'matte-coal-mt01',
        wheelId: 'brz-volk-te37',
        hash: 'matte-coal-mt01_brz-volk-te37',
        heroOrder: 1,
        angleMapping: {
            'front-left': 'subaru_brz_te37_matte_coal_front_left_1769538471340.png',
            'left': 'subaru_brz_te37_matte_coal_side_driver_1769538734095.png',
            'rear-left': 'subaru_brz_te37_matte_coal_rear_left_34_1769538714090.png',
            'front': 'subaru_brz_te37_matte_coal_front_center_1769538752352.png',
            'rear': 'subaru_brz_te37_matte_coal_rear_center_1769538772199.png'
        }
    },
    {
        vehicleId: 'mercedes_c63_2024',
        name: 'Matte Coal + RFX17',
        specDescription: 'Matte Coal Wrap + Rohana RFX17',
        wrapId: 'matte-coal-mt01',
        wheelId: 'mercedes-rohana-rfx17',
        hash: 'matte-coal-mt01_mercedes-rohana-rfx17',
        heroOrder: 1,
        angleMapping: {
            'front-left': 'mercedes_c63_rohana_matte_coal_front_left_1769538498531.png',
            'left': 'mercedes_c63_rohana_matte_coal_side_driver_1769538813848.png',
            'rear-left': 'mercedes_c63_rohana_matte_coal_rear_left_34_1769538792742.png',
            'front': 'mercedes_c63_rohana_matte_coal_front_center_1769538833255.png'
        }
    }
];

async function seed() {
    console.log('🌱 Seeding Hero Builds...');

    const bucketName = 'carguy-app-demo.firebasestorage.app'; // Assuming logic from seed-builds.js

    for (const build of HERO_BUILDS) {
        // Construct the document ID
        const docId = `${build.vehicleId}_${build.hash}`;

        // Construct renderSet
        const angles = [];
        let thumbUrl = null;

        for (const [angleName, filename] of Object.entries(build.angleMapping)) {
            const storagePath = `renders/builds/${build.vehicleId}/${build.hash}/${filename}`;
            // Construct a public URL guess (StandardCarLibraryService resolves storagePath too)
            const url = `https://storage.googleapis.com/${bucketName}/${storagePath}`;

            // Determine index based on name pattern or simple increment
            // Mapping: front-left (0), left (1), rear-left (2), etc?
            // User wants to rotate.
            // Let's assume the Object.entries comes in definition order or use specific mapping
            // Definition order in HERO_BUILDS seems to be: front-left, left, rear-left, front(, rear)

            // StandardCarLibrary typically has 8-10 angles.
            // Let's just assign index based on push order for now
            const index = angles.length;

            angles.push({
                index: index,
                name: angleName,
                storagePath: storagePath,
                url: url
            });

            // Use front-left as thumb if possible, or front
            if (angleName === 'front-left' || (!thumbUrl && angleName === 'front')) {
                thumbUrl = url;
            }
        }

        const buildData = {
            id: docId,
            vehicleId: build.vehicleId,
            name: build.name,
            specDescription: build.specDescription,
            isHero: true,
            heroOrder: build.heroOrder,
            isActive: false, // It's a template/hero
            wrapId: build.wrapId,
            wheelId: build.wheelId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            renderSet: {
                status: 'complete',
                angles: angles
            },
            thumbUrl: thumbUrl,
            // Add legacy fields just in case
            activeWrapId: build.wrapId,
            activeWheelId: build.wheelId
        };

        await db.collection('builds').doc(docId).set(buildData, { merge: true });
        console.log(`✅ Seeded: ${build.name} for ${build.vehicleId} (ID: ${docId})`);
    }
    console.log('🎉 Validation Complete.');
}

seed().catch(console.error);
