const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
if (!admin.apps.length) {
    const serviceAccount = require('../serviceAccountKey.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: "carguy-app-demo.firebasestorage.app"
    });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

const BUILDS = [
    {
        carId: 'porsche_911_2024',
        wrapId: 'camo-green-cg51',
        wheelId: 'porsche-911-manthey',
        angles: {
            driver_front: 'porsche_911_manthey_camo_front_left_1769538445797.png',
            full_driver_side: 'porsche_911_manthey_camo_side_driver_1769538652970.png',
            driver_rear: 'porsche_911_manthey_camo_rear_left_34_1769538626556.png',
            front_center: 'porsche_911_manthey_camo_front_center_1769538673022.png',
            rear_center: 'porsche_911_manthey_camo_rear_center_1769538695309.png'
        }
    },
    {
        carId: 'subaru_brz_2022',
        wrapId: 'matte-coal-mt01',
        wheelId: 'brz-volk-te37',
        angles: {
            driver_front: 'subaru_brz_te37_matte_coal_front_left_1769538471340.png',
            full_driver_side: 'subaru_brz_te37_matte_coal_side_driver_1769538734095.png',
            driver_rear: 'subaru_brz_te37_matte_coal_rear_left_34_1769538714090.png',
            front_center: 'subaru_brz_te37_matte_coal_front_center_1769538752352.png',
            rear_center: 'subaru_brz_te37_matte_coal_rear_center_1769538772199.png'
        }
    },
    {
        carId: 'mercedes_c63_2024',
        wrapId: 'matte-coal-mt01',
        wheelId: 'mercedes-rohana-rfx17',
        angles: {
            driver_front: 'mercedes_c63_rohana_matte_coal_front_left_1769538498531.png',
            full_driver_side: 'mercedes_c63_rohana_matte_coal_side_driver_1769538813848.png',
            driver_rear: 'mercedes_c63_rohana_matte_coal_rear_left_34_1769538792742.png',
            front_center: 'mercedes_c63_rohana_matte_coal_front_center_1769538833255.png'
        }
    }
];

async function uploadBuildImage(localName, carId, buildHash) {
    const localPath = path.join('/Users/temiagunloye/.gemini/antigravity/brain/23c8213d-1fa0-485f-950e-b5e69947ec56', localName);
    if (!fs.existsSync(localPath)) return null;

    const remotePath = `renders/builds/${carId}/${buildHash}/${localName}`;
    await bucket.upload(localPath, {
        destination: remotePath,
        public: true,
        metadata: { cacheControl: 'public, max-age=31536000' }
    });

    return `https://storage.googleapis.com/${bucket.name}/${remotePath}`;
}

async function seedBuilds() {
    console.log('🚀 Seeding Build Renders...');
    for (const build of BUILDS) {
        const buildHash = `${build.wrapId}_${build.wheelId}`;
        const photoAnglesHttp = {};

        for (const [angle, fileName] of Object.entries(build.angles)) {
            const url = await uploadBuildImage(fileName, build.carId, buildHash);
            if (url) photoAnglesHttp[angle] = url;
        }

        await db.collection('builds').doc(`${build.carId}_${buildHash}`).set({
            ...build,
            photoAnglesHttp,
            renderStatus: 'partial',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✅ Seeded Build: ${build.carId} (${buildHash}) - ${Object.keys(photoAnglesHttp).length}/10 angles`);
    }
}

seedBuilds().catch(console.error);
