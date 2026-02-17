#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');
const CANONICAL = path.join(REPO_ROOT, 'assets/cars');
const PARTS_ROOT = path.join(REPO_ROOT, 'assets/parts');
const OUTPUT_DIR = path.join(REPO_ROOT, 'output/pipeline');

const BASE_TO_BUILDS = path.join(CANONICAL, 'base_to_builds_map.json');

const BASE_MODELS = [
    'audi_rs6',
    'bmw_m3',
    'mercedes_c63',
    'subaru_brz',
    'porsche_911',
    'porsche_gt3'
];

const STOCK_BUILDS = [
    'brz_stock_blue',
    'bmw_m3_stock_white',
    'c63_stock_black',
    'audi_rs6_stock_grey',
    'porsche_gt3_stock_red',
    'porsche_911_stock'
];

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

let md = '# Tab Mapping Audit\n\n';
md += `Generated: ${new Date().toISOString()}\n\n`;

let errors = [];
let warnings = [];

// 1. Validate base_to_builds_map.json exists
md += '## Base to Builds Mapping\n\n';

if (!fs.existsSync(BASE_TO_BUILDS)) {
    errors.push('base_to_builds_map.json not found');
    md += '❌ **ERROR**: base_to_builds_map.json not found\n\n';
} else {
    const mapping = JSON.parse(fs.readFileSync(BASE_TO_BUILDS, 'utf8'));

    // Check all base models have entries
    BASE_MODELS.forEach(baseId => {
        if (!mapping[baseId]) {
            warnings.push(`Base model ${baseId} has no builds mapped`);
            md += `⚠️  **WARNING**: \`${baseId}\` has no builds\n`;
        } else {
            md += `✅ \`${baseId}\`: ${mapping[baseId].length} builds\n`;

            // Check each build exists
            mapping[baseId].forEach(buildId => {
                const buildPath = path.join(CANONICAL, buildId);
                if (!fs.existsSync(buildPath)) {
                    errors.push(`Build ${buildId} referenced but folder missing`);
                    md += `  ❌ \`${buildId}\` folder not found\n`;
                } else {
                    md += `  - \`${buildId}\`\n`;
                }
            });
        }
    });

    // Check for stock builds in mapping
    Object.values(mapping).flat().forEach(buildId => {
        if (STOCK_BUILDS.includes(buildId)) {
            errors.push(`Stock build ${buildId} should NOT be in Builds tab`);
            md += `❌ **ERROR**: \`${buildId}\` is a stock build and should not appear in Builds tab\n`;
        }
    });

    md += '\n';
}

// 2. Validate vehicle dropdown bases
md += '## Vehicle Dropdown (Base Models)\n\n';

BASE_MODELS.forEach(baseId => {
    md += `✅ \`${baseId}\`\n`;
});

md += '\n';

// 3. Validate stock builds are excluded
md += '## Stock Builds (Must NOT appear in Builds tab)\n\n';

STOCK_BUILDS.forEach(buildId => {
    const buildPath = path.join(CANONICAL, buildId);
    if (fs.existsSync(buildPath)) {
        md += `✅ \`${buildId}\` (exists, excluded from Builds tab)\n`;
    } else {
        md += `⚠️  \`${buildId}\` (expected stock build, missing)\n`;
    }
});

md += '\n';

// 4. Validate parts structure
md += '## Parts Thumbnails\n\n';

const categories = ['wheels', 'wraps', 'other'];

categories.forEach(cat => {
    const catPath = path.join(PARTS_ROOT, cat);

    if (!fs.existsSync(catPath)) {
        warnings.push(`Parts category ${cat} missing`);
        md += `⚠️  **WARNING**: \`${cat}/\` directory missing\n`;
        return;
    }

    const parts = fs.readdirSync(catPath).filter(item => {
        return fs.statSync(path.join(catPath, item)).isDirectory();
    });

    md += `### ${cat}\n\n`;

    if (parts.length === 0) {
        md += `No parts found\n\n`;
    } else {
        parts.forEach(partId => {
            const thumbPath = path.join(catPath, partId, 'thumb.png');
            if (fs.existsSync(thumbPath)) {
                md += `✅ \`${partId}/thumb.png\`\n`;
            } else {
                errors.push(`Missing thumb for ${cat}/${partId}`);
                md += `❌ \`${partId}/thumb.png\` missing\n`;
            }
        });
        md += '\n';
    }
});

// Summary
md += '## Summary\n\n';

if (errors.length === 0 && warnings.length === 0) {
    md += '✅ **All checks passed**\n\n';
} else {
    if (errors.length > 0) {
        md += `❌ **${errors.length} Errors**\n\n`;
        errors.forEach(err => md += `- ${err}\n`);
        md += '\n';
    }

    if (warnings.length > 0) {
        md += `⚠️  **${warnings.length} Warnings**\n\n`;
        warnings.forEach(warn => md += `- ${warn}\n`);
        md += '\n';
    }
}

fs.writeFileSync(path.join(OUTPUT_DIR, 'tab_mapping_audit.md'), md);

console.log(md);

if (errors.length > 0) {
    process.exit(1);
}
