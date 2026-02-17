/**
 * Run with: node scripts/seed_demo_data.js
 * Requires env:
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
 *   FIREBASE_PROJECT_ID=demo-carapp
 *
 * Seeds demo cars and placeholders for 10 angles each.
 * You still need to upload actual images and set angle.imageUrl (gs://) + angle.httpUrl (https) for the app viewer.
 */
const admin = require("firebase-admin");

const projectId = process.env.FIREBASE_PROJECT_ID || "carguy-app-demo";
// if (!projectId) throw new Error("FIREBASE_PROJECT_ID missing");

// Check if credentials file exists, if not, try default application credentials
try {
    admin.initializeApp({
        credential: admin.credential.cert(require("../serviceAccountKey.json")),
    });
} catch (e) {
    console.log("Service account key not found, trying default credentials...");
    admin.initializeApp();
}

const db = admin.firestore();

async function seedCar(carId, make, model) {
    await db.collection("cars").doc(carId).set({
        ownerId: "demo",
        make, model,
        anglesExpected: 10,
        status: "ready",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    const batch = db.batch();
    for (let i = 0; i < 10; i++) {
        const ref = db.collection("cars").doc(carId).collection("angles").doc(String(i));
        batch.set(ref, {
            ownerId: "demo",
            angleIndex: i,
            // Fill these after uploading:
            imageUrl: null,   // gs://bucket/users/demo/cars/{carId}/angles/{i}/raw.jpg
            httpUrl: null,    // https download URL for quick display in SpinViewer
            carMaskUrl: null,
            keypoints: {},
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
    }
    await batch.commit();
    console.log(`Seeded car: ${make} ${model}`);
}

async function seedParts() {
    const parts = [
        { id: "demo-spoiler-1", category: "spoiler", name: "Demo Spoiler", inputImageUrl: null, ownerId: "demo" },
        { id: "demo-splitter-1", category: "splitter", name: "Demo Splitter", inputImageUrl: null, ownerId: "demo" },
        { id: "demo-headlights-1", category: "headlights", name: "Demo Headlights", inputImageUrl: null, ownerId: "demo" },
        { id: "demo-bodykit-1", category: "bodykit", name: "Demo Body Kit", inputImageUrl: null, ownerId: "demo" },
        { id: "demo-wheels-1", category: "wheels", name: "Demo Wheels", inputImageUrl: null, ownerId: "demo" }
    ];
    for (const p of parts) {
        await db.collection("parts").doc(p.id).set({
            ...p,
            assets: {},
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        console.log(`Seeded part: ${p.name}`);
    }
}

(async () => {
    console.log(`Seeding data to project: ${projectId}`);
    await seedCar("demo-911", "Porsche", "911");
    await seedCar("demo-brz", "Subaru", "BRZ");
    await seedCar("demo-m3", "BMW", "M3");
    await seedCar("demo-4th", "Demo", "Car4"); // replace if you already have a 4th
    await seedParts();
    console.log("Seeded demo data successfully.");
    process.exit(0);
})().catch(e => {
    console.error("Error seeding data:", e);
    process.exit(1);
});
