const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { runPipeline } = require('../jobs-orchestrator/runner');

const app = express();
app.use(cors());
app.use(express.json());

const JOBS_DIR = path.join(__dirname, '../../jobs');

// Ensure jobs directory exists
if (!fs.existsSync(JOBS_DIR)) {
    fs.mkdirSync(JOBS_DIR, { recursive: true });
}

// POST /captures/start
app.post('/captures/start', (req, res) => {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const jobFolder = path.join(JOBS_DIR, jobId);

    // Create strict folder layout
    const folders = [
        'input', 'frames/raw', 'frames/selected', 'masks/body', 'masks/glass', 'masks/wheels',
        'masks/lights', 'masks/chrome', 'normalized', 'colmap/sparse', 'proxy', 'reality/turntable', 'package/thumbs', 'logs', 'metrics'
    ];

    folders.forEach(f => fs.mkdirSync(path.join(jobFolder, f), { recursive: true }));

    const jobDoc = {
        jobId,
        status: 'UPLOADED',
        createdAt: new Date().toISOString()
    };
    fs.writeFileSync(path.join(jobFolder, 'JobDoc.json'), JSON.stringify(jobDoc, null, 2));

    res.json({
        jobId,
        jobDoc,
        uploadInstructions: `Please place the raw mp4 file at 'jobs/${jobId}/input/capture.mp4', then call /captures/complete.`
    });
});

// POST /captures/complete
app.post('/captures/complete', (req, res) => {
    const { jobId, inputPath } = req.body;
    if (!jobId) return res.status(400).json({ error: 'jobId required' });

    const jobFolder = path.join(JOBS_DIR, jobId);
    const docPath = path.join(jobFolder, 'JobDoc.json');

    if (!fs.existsSync(docPath)) return res.status(404).json({ error: 'Job not found' });

    let jobDoc = JSON.parse(fs.readFileSync(docPath, 'utf-8'));
    jobDoc.status = 'VALIDATING';
    jobDoc.inputVideoPath = inputPath || path.join(jobFolder, 'input/capture.mp4');
    jobDoc.updatedAt = new Date().toISOString();
    fs.writeFileSync(docPath, JSON.stringify(jobDoc, null, 2));

    // Start orchestrator async (do not await)
    runPipeline(jobId).catch(err => console.error(`Pipeline error for ${jobId}:`, err));

    res.json({ message: 'Job enqueued', jobDoc });
});

// GET /jobs/{jobId}
app.get('/jobs/:jobId', (req, res) => {
    const docPath = path.join(JOBS_DIR, req.params.jobId, 'JobDoc.json');
    if (!fs.existsSync(docPath)) return res.status(404).json({ error: 'Job not found' });
    const jobDoc = JSON.parse(fs.readFileSync(docPath, 'utf-8'));
    res.json(jobDoc);
});

// GET /models/{jobId}
app.get('/models/:jobId', (req, res) => {
    const manifestPath = path.join(JOBS_DIR, req.params.jobId, 'package/model_manifest.json');
    if (!fs.existsSync(manifestPath)) return res.status(404).json({ error: 'Manifest not found. Job is likely not READY.' });
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    res.json(manifest);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API Gateway listening on http://localhost:${PORT}`);
});
