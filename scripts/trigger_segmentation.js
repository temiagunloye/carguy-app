const admin = require('firebase-admin');

// Initialize Firebase
const projectId = process.env.FIREBASE_PROJECT_ID || "carguy-app-demo";
if (admin.apps.length === 0) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(require("../serviceAccountKey.json")),
        });
    } catch (e) {
        admin.initializeApp({ projectId });
    }
}
const db = admin.firestore();

const DEMO_CARS = [
    'porsche_911_2024',
    'bmw_m3_2024',
    'subaru_brz_2024',
    'mercedes_c63_2024',
    'audi_rs6_2024'
];

async function queueJobs() {
    console.log("🚀 Queueing Segmentation Jobs for Standard Cars...");

    const batch = db.batch();

    for (const carId of DEMO_CARS) {
        const ref = db.collection('jobs').doc();
        const jobData = {
            type: 'SEGMENT_CAR',
            status: 'queued',
            ownerId: 'SYSTEM_ADMIN', // Internal system job
            input: {
                carId: carId,
                collection: 'standardCars' // Tell worker to look in standardCars, not users
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            progress: 0
        };

        batch.set(ref, jobData);
        console.log(`   + Queued job ${ref.id} for ${carId}`);
    }

    await batch.commit();
    console.log("✅ All jobs queued. The GPU Worker will pick these up to generate masking data.");
}

queueJobs().catch(console.error);
