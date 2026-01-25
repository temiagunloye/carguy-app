const admin = require('firebase-admin');

// Initialize Firebase (Reuse existing logic)
const projectId = process.env.FIREBASE_PROJECT_ID || "carguy-app-demo";
if (admin.apps.length === 0) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(require("../serviceAccountKey.json")),
            storageBucket: `${projectId}.firebasestorage.app`
        });
    } catch (e) {
        admin.initializeApp({ projectId, storageBucket: `${projectId}.appspot.com` });
    }
}

const bucket = admin.storage().bucket();

async function setCors() {
    console.log(`🔧 Configuring CORS for bucket: ${bucket.name}...`);

    await bucket.setCorsConfiguration([
        {
            maxAgeSeconds: 3600,
            method: ["GET", "HEAD", "PUT", "POST", "DELETE"],
            origin: ["*"],
            responseHeader: ["Content-Type", "Access-Control-Allow-Origin"]
        }
    ]);

    console.log("✅ CORS Configured Successfully.");
    console.log("   Allowed Origins: *");
    console.log("   Allowed Methods: GET, HEAD, PUT, POST, DELETE");
}

setCors().catch(console.error);
