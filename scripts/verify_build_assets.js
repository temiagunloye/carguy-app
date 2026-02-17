#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');
const CANONICAL = path.join(REPO_ROOT, 'assets/cars');
const OUTPUT_DIR = path.join(REPO_ROOT, 'output/pipeline');
const EXPECTED_BUILDS = path.join(CANONICAL, 'expected_builds.json');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

if (!fs.existsSync(EXPECTED_BUILDS)) {
    console.error('❌ expected_builds.json not found');
    process.exit(1);
}

const expected = JSON.parse(fs.readFileSync(EXPECTED_BUILDS, 'utf8'));
const results = {};
const issues = [];

console.log('🔍 Verifying build assets...\n');

expected.forEach(buildId => {
    const buildPath = path.join(CANONICAL, buildId);

    if (!fs.existsSync(buildPath)) {
        results[buildId] = {
            exists: false,
            complete: false,
            angles: [],
            missing: Array.from({ length: 10 }, (_, i) => `angle_${(i + 1).toString().padStart(2, '0')}`)
        };
        issues.push(`Build folder missing: ${buildId}`);
        return;
    }

    const angles = [];
    const missing = [];

    for (let i = 1; i <= 10; i++) {
        const angle = `angle_${i.toString().padStart(2, '0')}`;
        const anglePath = path.join(buildPath, `${angle}.png`);

        if (fs.existsSync(anglePath)) {
            angles.push(angle);
        } else {
            missing.push(angle);
        }
    }

    results[buildId] = {
        exists: true,
        complete: angles.length === 10,
        angles,
        missing,
        count: angles.length
    };

    if (angles.length < 10) {
        issues.push(`Incomplete: ${buildId} (${angles.length}/10)`);
    }
});

// Write JSON audit
fs.writeFileSync(
    path.join(OUTPUT_DIR, 'assets_audit.json'),
    JSON.stringify(results, null, 2)
);

// Write Markdown audit
let md = '# Build Assets Audit\n\n';
md += `Generated: ${new Date().toISOString()}\n\n`;

md += '## Critical Builds\n\n';

// RS6 Blue
const rs6Blue = results['audi_rs6_custom_blue'];
if (rs6Blue) {
    md += '### audi_rs6_custom_blue\n\n';
    if (rs6Blue.complete) {
        md += '✅ **Complete** (10/10)\n\n';
    } else if (rs6Blue.exists) {
        md += `⚠️  **Partial** (${rs6Blue.count}/10)\n\n`;
        md += `Missing: ${rs6Blue.missing.join(', ')}\n\n`;
    } else {
        md += '❌ **Folder not found**\n\n';
    }
} else {
    md += '### audi_rs6_custom_blue\n\n❌ **Not in expected builds**\n\n';
}

// GT3 Stock
const gt3Stock = results['porsche_gt3_stock_red'];
if (gt3Stock) {
    md += '### porsche_gt3_stock_red\n\n';
    if (gt3Stock.complete) {
        md += '✅ **Complete** (10/10)\n\n';
    } else if (gt3Stock.exists) {
        md += `⚠️  **Partial** (${gt3Stock.count}/10)\n\n`;
        md += `Missing: ${gt3Stock.missing.join(', ')}\n\n`;
    } else {
        md += '❌ **Folder not found**\n\n';
    }
} else {
    md += '### porsche_gt3_stock_red\n\n❌ **Not in expected builds**\n\n';
}

md += '## All Builds Summary\n\n';

const complete = [];
const partial = [];
const missing = [];

Object.entries(results).forEach(([buildId, data]) => {
    if (data.complete) {
        complete.push(buildId);
    } else if (data.exists && data.count > 0) {
        partial.push({ buildId, count: data.count, missing: data.missing });
    } else {
        missing.push(buildId);
    }
});

md += `✅ Complete: ${complete.length}\n`;
md += `⚠️  Partial: ${partial.length}\n`;
md += `❌ Missing: ${missing.length}\n\n`;

md += '### Complete (10/10)\n\n';
complete.forEach(id => md += `- ${id}\n`);
md += '\n';

if (partial.length > 0) {
    md += '### Partial\n\n';
    partial.forEach(p => {
        md += `- **${p.buildId}** (${p.count}/10) - Missing: ${p.missing.join(', ')}\n`;
    });
    md += '\n';
}

if (missing.length > 0) {
    md += '### Missing\n\n';
    missing.forEach(id => md += `- ${id}\n`);
    md += '\n';
}

fs.writeFileSync(path.join(OUTPUT_DIR, 'assets_audit.md'), md);

console.log(md);

if (issues.length > 0) {
    console.log('\n⚠️  Issues found:');
    issues.forEach(issue => console.log(`  - ${issue}`));
}

console.log(`\n✅ Audit complete`);
console.log(`   JSON: output/pipeline/assets_audit.json`);
console.log(`   MD:   output/pipeline/assets_audit.md`);
