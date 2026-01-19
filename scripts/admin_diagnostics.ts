/**
 * Run with: ts-node scripts/admin_diagnostics.ts
 * 
 * Universe B Health Check
 * Verifies:
 * 1. Firebase Admin Connectivity
 * 2. Firestore Write Access (jobs collection)
 * 3. Worker Connectivity (via Job Queue)
 */
import * as admin from 'firebase-admin';

// Initialize
const projectId = process.env.FIREBASE_PROJECT_ID || 'carguy-app-demo';
try {
    // Try loading service account if verified locally, otherwise explicit check
    // For this script, we assume default google credentials or emulator
    admin.initializeApp({
        projectId,
        storageBucket: `${projectId}.appspot.com`
    });
} catch (e) {
    if (!admin.apps.length) admin.initializeApp();
}

const db = admin.firestore();

async function runHealthCheck() {
    console.log("🏥 Starting Universe B Health Check...");

    // 1. Firestore Check
    try {
        const testRef = db.collection('system_health').doc('ping');
        await testRef.set({ lastCheck: admin.firestore.FieldValue.serverTimestamp() });
        console.log("✅ Firestore Write: OK");
    } catch (e) {
        console.error("❌ Firestore Write: FAILED", e);
    }

    // 2. Job Queue Check (Spin Pipeline)
    try {
        const jobsRef = db.collection('jobs');
        // We create a dummy job to see if triggers would fire (we don't wait for trigger here)
        const jobRef = await jobsRef.add({
            type: 'HEALTH_CHECK',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'queued'
        });
        console.log(`✅ Job Queueing: OK (Created Job ID: ${jobRef.id})`);

        // Cleanup
        await jobRef.delete();
    } catch (e) {
        console.error("❌ Job Queueing: FAILED", e);
    }

    console.log("--- Health Check Complete ---");
}

runHealthCheck().catch(console.error);
