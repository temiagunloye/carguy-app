const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Admin SDK using service account if available, or application default credentials
// For this environment, we'll try to use the service account key if it exists
const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');

try {
    if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: 'carguy-app-demo.firebasestorage.app'
        });
    } else {
        // Fallback or just log warning
        console.warn("Service account key not found. Skipping auto-upload.");
        process.exit(0);
    }

    const bucket = admin.storage().bucket();

    // Create a snapshot of current config state
    const snapshot = {
        timestamp: new Date().toISOString(),
        environment: 'production',
        dashboards: ['unified-admin-hub', 'thatappcompany-hub'],
        status: 'deployed',
        version: '1.0.2'
    };

    const fileName = `logs/config_snapshot_${Date.now()}.json`;
    const file = bucket.file(fileName);

    file.save(JSON.stringify(snapshot, null, 2), {
        metadata: { contentType: 'application/json' }
    }).then(() => {
        console.log(`✅ Config snapshot uploaded to ${fileName}`);
        process.exit(0);
    }).catch(err => {
        console.error("❌ Upload failed:", err);
        process.exit(1);
    });

} catch (error) {
    console.error("Script error:", error);
    process.exit(1);
}
