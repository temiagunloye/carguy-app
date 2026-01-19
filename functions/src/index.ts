// functions/src/index.ts
import * as admin from "firebase-admin";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";

admin.initializeApp();
const db = admin.firestore();

// Existing pipeline exports (keep for compatibility if needed, or comment out if full replacement)
// export { generateCarModel } from './renderJobs/generateCarModel';
// export { onRenderJobCreated } from './renderJobs/onRenderJobCreated';
// export { pollRenderJobs } from './renderJobs/pollRenderJobs';
export { processCandidate } from './parts/processCandidate';
export { submitPartCandidate } from './parts/submitPartCandidate';

// --- NEW 10-ANGLE PIPELINE ---

type JobType = "SEGMENT_CAR" | "MAKE_PART_ASSET" | "BUILD_FRAMES";
type JobStatus = "queued" | "running" | "done" | "error";

function requireAuth(req: any) {
    if (!req.auth?.uid) throw new HttpsError("unauthenticated", "Sign in required");
    return req.auth.uid as string;
}

function workerBaseUrl() {
    // In prod set via env var; fallback for emulator/dev.
    return process.env.GPU_WORKER_URL || "http://host.docker.internal:8088";
}

async function createJob(ownerId: string, type: JobType, input: any) {
    const ref = db.collection("jobs").doc();
    const now = admin.firestore.FieldValue.serverTimestamp();
    await ref.set({
        ownerId,
        type,
        status: "queued" as JobStatus,
        input,
        output: {},
        progress: 0,
        error: null,
        createdAt: now,
        updatedAt: now,
    });
    return ref.id;
}

/**
 * Client: call this to queue segmentation for a car
 */
export const queueSegmentCar = onCall(async (req) => {
    const ownerId = requireAuth(req);
    const { carId } = req.data || {};
    if (!carId) throw new HttpsError("invalid-argument", "carId required");
    const jobId = await createJob(ownerId, "SEGMENT_CAR", { carId });
    return { jobId };
});

/**
 * Client: call this to queue asset generation for a part
 */
export const queueMakePartAsset = onCall(async (req) => {
    const ownerId = requireAuth(req);
    const { partId } = req.data || {};
    if (!partId) throw new HttpsError("invalid-argument", "partId required");
    const jobId = await createJob(ownerId, "MAKE_PART_ASSET", { partId });
    return { jobId };
});

/**
 * Client: call this to queue composited build frames
 */
export const queueBuildFrames = onCall(async (req) => {
    const ownerId = requireAuth(req);
    const { buildId } = req.data || {};
    if (!buildId) throw new HttpsError("invalid-argument", "buildId required");
    const jobId = await createJob(ownerId, "BUILD_FRAMES", { buildId });
    await db.collection("builds").doc(buildId).set(
        { status: "processing", updatedAt: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true }
    );
    return { jobId };
});

/**
 * Firestore trigger: when job is created, call GPU worker.
 * This makes the system “hands-off” once the job doc exists.
 */
export const onJobCreated = onDocumentCreated("jobs/{jobId}", async (event) => {
    const jobId = event.params.jobId as string;
    const snap = event.data;
    if (!snap) return;

    const job = snap.data() as any;
    const { type, input } = job;

    const ref = db.collection("jobs").doc(jobId);
    await ref.update({
        status: "running" as JobStatus,
        progress: 5,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Use host.docker.internal for local emulator -> container comms, or localhost if running natively
    const url = `${workerBaseUrl()}/jobs/${type.toLowerCase()}`;
    try {
        // Note: 'fetch' is available in Node 18+ (functions runtime v2)
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jobId, ...input }),
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Worker error ${res.status}: ${text}`);
        }
        const out = await res.json();

        await ref.update({
            status: "done" as JobStatus,
            output: out,
            progress: 100,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // If build frames, mark build ready
        if (type === "BUILD_FRAMES" && input?.buildId) {
            await db.collection("builds").doc(input.buildId).set(
                {
                    status: "ready",
                    resultFrames: out.resultFrames || null,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                },
                { merge: true }
            );
        }
    } catch (err: any) {
        console.error("Job Processing Error:", err);
        await ref.update({
            status: "error" as JobStatus,
            progress: 100,
            error: { message: err?.message || String(err) },
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        if (type === "BUILD_FRAMES" && input?.buildId) {
            await db.collection("builds").doc(input.buildId).set(
                {
                    status: "error",
                    error: { message: err?.message || String(err) },
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                },
                { merge: true }
            );
        }
    }
});

