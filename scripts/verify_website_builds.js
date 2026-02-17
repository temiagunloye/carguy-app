#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');
const OUTPUT_DIR = path.join(REPO_ROOT, 'output/pipeline');
const VISUALIZER_PATH = path.join(REPO_ROOT, 'website/js/visualizer-v3.js');
const BASE_TO_BUILDS = path.join(REPO_ROOT, 'assets/cars/base_to_builds_map.json');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

let md = '# Website Build Configuration Audit\n\n';
md += `Generated: ${new Date().toISOString()}\n\n`;

let errors = [];
let checks = [];

// Check visualizer exists
if (!fs.existsSync(VISUALIZER_PATH)) {
    errors.push('visualizer-v3.js not found');
} else {
    const code = fs.readFileSync(VISUALIZER_PATH, 'utf8');

    // Check for /assets/cars/ references
    if (code.includes('/assets/cars/')) {
        checks.push('✅ Uses /assets/cars/ paths');
    } else {
        errors.push('visualizer-v3.js does not reference /assets/cars/');
    }

    // Check for DEFAULT_STOCK_BUILDS
    if (code.includes('DEFAULT_STOCK_BUILDS')) {
        checks.push('✅ DEFAULT_STOCK_BUILDS defined');
    } else {
        errors.push('DEFAULT_STOCK_BUILDS not found');
    }

    // Check for base_to_builds_map.json fetch
    if (code.includes('base_to_builds_map.json')) {
        checks.push('✅ Loads base_to_builds_map.json');
    } else {
        errors.push('Does not load base_to_builds_map.json');
    }
}

// Check base_to_builds_map.json
md += '## Base to Builds Mapping\n\n';

if (!fs.existsSync(BASE_TO_BUILDS)) {
    errors.push('base_to_builds_map.json not found');
    md += '❌ base_to_builds_map.json not found\n\n';
} else {
    const mapping = JSON.parse(fs.readFileSync(BASE_TO_BUILDS, 'utf8'));

    // Check porsche_911
    if (mapping['porsche_911'] && mapping['porsche_911'].includes('porsche_911_manthey_carbon_disc')) {
        checks.push('✅ porsche_911 includes porsche_911_manthey_carbon_disc');
        md += '✅ **porsche_911** → includes `porsche_911_manthey_carbon_disc`\n\n';
    } else {
        errors.push('porsche_911 missing porsche_911_manthey_carbon_disc');
        md += '❌ **porsche_911** → missing `porsche_911_manthey_carbon_disc`\n\n';
    }

    // Check audi_rs6
    if (mapping['audi_rs6'] && mapping['audi_rs6'].includes('audi_rs6_custom_blue')) {
        checks.push('✅ audi_rs6 includes audi_rs6_custom_blue');
        md += '✅ **audi_rs6** → includes `audi_rs6_custom_blue`\n\n';
    } else {
        errors.push('audi_rs6 missing audi_rs6_custom_blue');
        md += '❌ **audi_rs6** → missing `audi_rs6_custom_blue`\n\n';
    }
}

md += '## Stock Build Defaults\n\n';
md += '- audi_rs6 → audi_rs6_stock_grey\n';
md += '- bmw_m3 → bmw_m3_stock_white\n';
md += '- mercedes_c63 → c63_stock_black\n';
md += '- subaru_brz → brz_stock_blue\n';
md += '- porsche_911 → porsche_911_stock\n';
md += '- porsche_gt3 → porsche_gt3_stock_red\n\n';

md += '## Checks\n\n';
checks.forEach(c => md += `${c}\n`);
md += '\n';

if (errors.length > 0) {
    md += '## Errors\n\n';
    errors.forEach(e => md += `❌ ${e}\n`);
    md += '\n';
} else {
    md += '✅ All checks passed\n\n';
}

fs.writeFileSync(path.join(OUTPUT_DIR, 'website_audit.md'), md);

console.log(md);

if (errors.length > 0) {
    process.exit(1);
}
