#!/usr/bin/env node

/**
 * JSON-Spec Batch Blender Renderer
 * No shell quoting issues - all params in JSON files
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

const BLENDER_PATH = '/opt/homebrew/bin/blender';
const BLENDER_SCRIPT = path.join(__dirname, 'blender', 'render_from_json.py');
const SPECS_DIR = 'render_specs';

async function renderFromSpec(specPath) {
    const spec = JSON.parse(await fs.readFile(specPath, 'utf8'));
    const buildId = spec.buildId;
    const logFile = path.join('logs', `render_${buildId}.log`);

    console.log('\n' + '='.repeat(80));
    console.log(`RENDERING: ${buildId}`);
    console.log(`Log: ${logFile}`);
    console.log('='.repeat(80));

    // Cleanup specific output folder only
    if (spec.outputDir) {
        await fs.mkdir(spec.outputDir, { recursive: true });
        // Instead of rm -rf, we let Blender overwrite if files exist or clear specific known files
        // But for a clean run, we can clear the folder safely
        const files = await fs.readdir(spec.outputDir);
        for (const file of files) {
            await fs.unlink(path.join(spec.outputDir, file));
        }
    }

    // Redirect both stdout and stderr to the log file
    const command = `${BLENDER_PATH} --background --python ${BLENDER_SCRIPT} -- ${specPath} > ${logFile} 2>&1`;

    const startTime = Date.now();

    try {
        console.log(`  → Blender started... check ${logFile} for progress`);
        await execAsync(command, {
            maxBuffer: 1024 * 1024 * 50, // 50MB buffer for long logs
        });

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`✓ Render complete (${duration}s): ${spec.outputDir}`);

        return { success: true, buildId, outputDir: spec.outputDir, duration };
    } catch (error) {
        console.error(`\n✗ Render failed: ${error.message}`);
        console.error(`Check log: ${logFile}`);
        return { success: false, buildId, error: error.message };
    }
}

async function qualityGate(buildId, outputDir) {
    console.log(`\n[Quality Gate] Checking ${buildId}...`);

    const requiredAngles = Array.from({ length: 10 }, (_, i) =>
        `angle_${String(i + 1).padStart(2, '0')}.png`
    );

    for (const angleName of requiredAngles) {
        try {
            await fs.access(path.join(outputDir, angleName));
        } catch (error) {
            console.error(`  ✗ Missing: ${angleName}`);
            return false;
        }
    }

    try {
        await fs.access(path.join(outputDir, 'manifest.json'));
    } catch (error) {
        console.error(`  ✗ Missing: manifest.json`);
        return false;
    }

    console.log(`  ✓ All 10 angles present`);
    console.log(`  ✓ Manifest present`);
    console.log(`  → Manual review: Compare angles 01/04/07 against PDF`);

    return true;
}

async function main() {
    console.log('JSON-SPEC BLENDER BATCH RENDERER');
    console.log('Matches PDF quality reference\n');

    try {
        // Check Blender
        const { stdout } = await execAsync(`${BLENDER_PATH} --version`);
        console.log(`✓ Blender: ${stdout.split('\n')[0]}`);

        // Find all spec files
        const files = await fs.readdir(SPECS_DIR);
        const specFiles = files
            .filter(f => f.endsWith('.json'))
            .sort()
            .map(f => path.join(SPECS_DIR, f));

        console.log(`\nFound ${specFiles.length} spec files:\n`);
        specFiles.forEach(f => console.log(`  - ${f}`));

        const results = [];

        for (const specPath of specFiles) {
            const result = await renderFromSpec(specPath);
            results.push(result);

            if (result.success) {
                await qualityGate(result.buildId, result.outputDir);
            }
        }

        // Summary
        console.log('\n' + '='.repeat(80));
        console.log('BATCH RENDER SUMMARY');
        console.log('='.repeat(80));

        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);

        console.log(`\n✓ Successful: ${successful.length}/${results.length}`);
        successful.forEach(r => {
            console.log(`  - ${r.buildId} (${r.duration}s)`);
        });

        if (failed.length > 0) {
            console.log(`\n✗ Failed: ${failed.length}/${results.length}`);
            failed.forEach(r => {
                console.log(`  - ${r.buildId}: ${r.error}`);
            });
        }

        const totalDuration = successful.reduce((sum, r) => sum + parseFloat(r.duration), 0);

        console.log(`\nTotal render time: ${totalDuration.toFixed(1)}s`);
        console.log('\nNext steps:');
        console.log('1. Review renders in base_model_renders/');
        console.log('2. Compare angles 01/04/07 against PDF quality reference');
        console.log('3. Upload to Firebase Storage');
        console.log('4. Update Firestore mappings');

    } catch (error) {
        console.error('\nFatal error:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { renderFromSpec, qualityGate };
