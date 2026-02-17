#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');
const OUTPUT_DIR = path.join(REPO_ROOT, 'output/pipeline');
const CANONICAL = path.join(REPO_ROOT, 'assets/cars');
const EXPECTED_BUILDS = path.join(CANONICAL, 'expected_builds.json');

const ANGLE_DESCRIPTORS = [
    'front three-quarter driver side view',
    'front three-quarter passenger side view',
    'full driver side profile view',
    'full passenger side profile view',
    'rear three-quarter driver side view',
    'rear three-quarter passenger side view',
    'front center view',
    'rear center view',
    'high angle front three-quarter view',
    'high angle rear three-quarter view'
];

const BASE_PROMPT = `Professional automotive studio photography in a dark dramatic studio. 
Dark matte black floor with subtle reflections. 
Deep charcoal gradient background (dark grey to black). 
Subtle rim lighting highlighting car curves and edges. 
High-end commercial aesthetic, ultra-realistic, 8K resolution.`;

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

if (!fs.existsSync(EXPECTED_BUILDS)) {
    console.error('❌ expected_builds.json not found');
    process.exit(1);
}

const indexAllPath = path.join(CANONICAL, 'index_all.json');
if (!fs.existsSync(indexAllPath)) {
    console.error('❌ Run master_pipeline.sh validate and index first');
    process.exit(1);
}

const expected = JSON.parse(fs.readFileSync(EXPECTED_BUILDS, 'utf8'));
const indexAll = JSON.parse(fs.readFileSync(indexAllPath, 'utf8'));
const queue = [];

expected.forEach(buildId => {
    const buildData = indexAll[buildId];
    if (!buildData) return;
    if (buildData.complete) return;

    buildData.missingAngles.forEach(angle => {
        const angleNum = parseInt(angle.split('_')[1]);
        const descriptor = ANGLE_DESCRIPTORS[angleNum - 1];

        queue.push({
            buildId,
            angle,
            filename: `${angle}.png`,
            prompt: `${buildId.replace(/_/g, ' ')}. ${descriptor}. ${BASE_PROMPT}`
        });
    });
});

fs.writeFileSync(
    path.join(OUTPUT_DIR, 'render_queue.json'),
    JSON.stringify(queue, null, 2)
);

const runbook = `# Render Generation Runbook

**Generated:** ${new Date().toISOString()}
**Total Tasks:** ${queue.length} missing angles across ${expected.length} builds

## Rules

1. Generate ONE image at a time
2. Wait 25-40 seconds between requests
3. After each build completes:
   \`\`\`bash
   bash scripts/import_to_canonical.sh <buildId> <artifacts-dir>
   \`\`\`
4. Never regenerate existing angles

## Queue

${expected.map(id => {
    const data = indexAll[id];
    if (!data) return `- **${id}**: Not validated`;
    if (data.complete) return `- **${id}**: ✅ Complete`;
    return `- **${id}**: ${data.availableAngles}/10 (missing: ${data.missingAngles.join(', ')})`;
}).join('\n')}
`;

fs.writeFileSync(path.join(OUTPUT_DIR, 'render_runbook.md'), runbook);

console.log(`✅ Queue built: ${queue.length} tasks`);
console.log(`📄 Runbook: output/pipeline/render_runbook.md`);
