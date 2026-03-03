const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const JOBS_DIR = path.join(__dirname, '../../jobs');

async function updateJobStatus(jobId, status, errorReason = null) {
    const docPath = path.join(JOBS_DIR, jobId, 'JobDoc.json');
    if (!fs.existsSync(docPath)) return;
    const jobDoc = JSON.parse(fs.readFileSync(docPath, 'utf-8'));
    jobDoc.status = status;
    jobDoc.updatedAt = new Date().toISOString();
    if (errorReason) jobDoc.errorReason = errorReason;
    fs.writeFileSync(docPath, JSON.stringify(jobDoc, null, 2));
    logToJob(jobId, `STATUS CHANGED: ${status}`);
}

function logToJob(jobId, message) {
    const logPath = path.join(JOBS_DIR, jobId, 'logs/stages.log');
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(logPath, entry);
    console.log(`[Job ${jobId}] ${message}`);
}

async function runStageScript(jobId, stageName) {
    return new Promise((resolve, reject) => {
        // The workers will just be wrapped via runner for the local execution
        logToJob(jobId, `Starting stage: ${stageName}`);

        // We will execute a shell script that acts as the entrypoint for all workers
        const runnerScript = path.join(__dirname, '../../scripts/run_stage.sh');

        // We expect run_stage.sh to handle individual calling logic for workers
        const proc = spawn(runnerScript, [jobId, stageName], {
            cwd: path.join(__dirname, '../../'),
            stdio: 'pipe'
        });

        let output = '';
        proc.stdout.on('data', d => { output += d.toString(); });
        proc.stderr.on('data', d => { output += d.toString(); });

        proc.on('close', code => {
            const logPath = path.join(JOBS_DIR, jobId, 'logs', `${stageName}.log`);
            fs.writeFileSync(logPath, output);
            if (code === 0) {
                logToJob(jobId, `Completed stage: ${stageName}`);
                resolve();
            } else {
                logToJob(jobId, `FAILED stage: ${stageName} (Exit Code: ${code})`);
                reject(new Error(`Stage ${stageName} failed. Check ${stageName}.log`));
            }
        });
    });
}

async function runPipeline(jobId) {
    try {
        // Stage: EXTRACTING
        await updateJobStatus(jobId, 'EXTRACTING');
        await runStageScript(jobId, 'frame_worker');

        // Stage: SEGMENTING
        await updateJobStatus(jobId, 'SEGMENTING');
        await runStageScript(jobId, 'segmentation_worker');

        // Stage: COLMAP
        await updateJobStatus(jobId, 'COLMAP');
        await runStageScript(jobId, 'colmap_worker');

        // Stage: PROXY_ANCHORS
        await updateJobStatus(jobId, 'PROXY_ANCHORS');
        await runStageScript(jobId, 'proxy_anchor_worker');

        // Stage: REALITY_TWIN_STUB
        await updateJobStatus(jobId, 'REALITY_TWIN_STUB');
        await runStageScript(jobId, 'reality_twin_worker');

        // Stage: PACKAGING
        await updateJobStatus(jobId, 'PACKAGING');
        await runStageScript(jobId, 'package_builder');

        // Done
        await updateJobStatus(jobId, 'READY');
        logToJob(jobId, 'Pipeline execution fully completed.');

    } catch (err) {
        await updateJobStatus(jobId, 'FAILED', err.message);
    }
}

module.exports = { runPipeline, updateJobStatus };
