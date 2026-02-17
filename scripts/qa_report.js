const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const sizeOf = require('image-size'); // Need to install or simpler check?

// Since we might not have `image-size` installed and I can't interactively install,
// I'll rely on fs.stat for size and existence. 
// If possible, I'll use a simple heuristic or assumes png.
// Actually, `sips -g pixelWidth` on mac/linux is an option via exec.
// But pure node is better.
// Let's assume standard node fs checks for now.

const BATCH_DIR = path.join(__dirname, '../renders/batch_01');
const REQUIRED_ANGLES = 10;

async function runQA() {
    console.log("🔍 Starting QA Check on Batch 01...");

    if (!fs.existsSync(BATCH_DIR)) {
        console.error("❌ Batch directory not found.");
        process.exit(1);
    }

    const report = {
        timestamp: new Date().toISOString(),
        builds: [],
        summary: { total: 0, passed: 0, failed: 0 }
    };

    const dirs = fs.readdirSync(BATCH_DIR).filter(f => fs.statSync(path.join(BATCH_DIR, f)).isDirectory());

    for (const d of dirs) {
        const buildPath = path.join(BATCH_DIR, d);
        const buildResult = {
            id: d,
            passed: false,
            issues: []
        };

        // 1. Check Manifest
        const manifestPath = path.join(buildPath, 'manifest.json');
        if (!fs.existsSync(manifestPath)) {
            buildResult.issues.push("Missing manifest.json");
        } else {
            try {
                const m = JSON.parse(fs.readFileSync(manifestPath));
                if (m.angleCount !== REQUIRED_ANGLES) {
                    buildResult.issues.push(`Manifest angleCount mismatch: ${m.angleCount} vs ${REQUIRED_ANGLES}`);
                }
            } catch (e) {
                buildResult.issues.push("Invalid manifest.json");
            }
        }

        // 2. Check Images
        const files = fs.readdirSync(buildPath).filter(f => f.endsWith('.png'));
        if (files.length < REQUIRED_ANGLES) {
            buildResult.issues.push(`Missing images: Found ${files.length}, expected ${REQUIRED_ANGLES}`);
        }

        // 3. Size Check (Empty files?)
        for (const f of files) {
            const s = fs.statSync(path.join(buildPath, f));
            if (s.size < 1024) { // < 1KB is suspicious
                buildResult.issues.push(`Suspicious file size: ${f} (${s.size} bytes)`);
            }
        }

        if (buildResult.issues.length === 0) {
            buildResult.passed = true;
            report.summary.passed++;
        } else {
            report.summary.failed++;
        }

        report.builds.push(buildResult);
        console.log(`[${buildResult.passed ? 'PASS' : 'FAIL'}] ${d}`);
        if (!buildResult.passed) {
            buildResult.issues.forEach(i => console.log(`   - ${i}`));
        }
    }

    report.summary.total = report.builds.length;

    // Write Report
    fs.writeFileSync(path.join(BATCH_DIR, 'qa_report.json'), JSON.stringify(report, null, 2));
    console.log("\n📝 QA Report written to renders/batch_01/qa_report.json");
}

runQA();
