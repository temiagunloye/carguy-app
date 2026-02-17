#!/usr/bin/env node

/**
 * Batch Blender Renderer - Base Models
 * 
 * Renders all 4 base models using Blender with gold standard studio rig.
 * Matches PDF quality reference (dark gradient + consistent lighting).
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

// ============================================================================
// CONFIGURATION
// ============================================================================

const BLENDER_PATH = '/opt/homebrew/bin/blender';
const BLENDER_SCRIPT = path.join(__dirname, 'blender', 'render_base_models.py');

// Base model specifications
const BASE_MODELS = [
    {
        buildId: 'm3_2023_stock_alpine_white',
        glbPath: 'source_models/base_glb/bmw_m3.glb',
        color: 'alpine_white',
        year: '2023',
        make: 'BMW',
        model: 'M3',
        trim: 'Competition',
        wheels: 'Stock 19" M Double-Spoke',
    },
    {
        buildId: 'rs6_2024_stock_nardo_grey',
        glbPath: 'source_models/base_glb/audi_rs6_2020.glb',
        color: 'nardo_grey',
        year: '2024',
        make: 'Audi',
        model: 'RS6 Avant',
        trim: '',
        wheels: 'Stock 21" 5-V-Spoke',
    },
    {
        buildId: 'c63_2024_stock_obsidian_black',
        glbPath: 'source_models/base_glb/mercedes_c63_2019.glb',
        color: 'obsidian_black',
        year: '2024',
        make: 'Mercedes-AMG',
        model: 'C63',
        trim: 'S Coupe',
        wheels: 'Stock 19" AMG Multi-Spoke',
    },
    {
        buildId: 'gt3_stock_guards_red',
        glbPath: 'source_models/base_glb/porsche_gt3_2022.glb',
        color: 'guards_red',
        year: '2022',
        make: 'Porsche',
        model: '911 GT3',
        trim: 'Touring (992)',
        wheels: 'Stock 20"/21" GT3',
    },
];

// ============================================================================
// RENDER FUNCTIONS
// ============================================================================

async function checkPrerequisites() {
    console.log('Checking prerequisites...');

    // Check Blender
    try {
        const { stdout } = await execAsync(`${BLENDER_PATH} --version`);
        console.log(`✓ Blender found: ${stdout.split('\n')[0]}`);
    } catch (error) {
        throw new Error(`Blender not found at ${BLENDER_PATH}`);
    }

    // Check Blender script
    try {
        await fs.access(BLENDER_SCRIPT);
        console.log(`✓ Blender script found: ${BLENDER_SCRIPT}`);
    } catch (error) {
        throw new Error(`Blender script not found: ${BLENDER_SCRIPT}`);
    }

    // Check GLB files
    for (const model of BASE_MODELS) {
        try {
            await fs.access(model.glbPath);
            console.log(`✓ GLB found: ${model.glbPath}`);
        } catch (error) {
            console.warn(`⚠ GLB missing: ${model.glbPath} (will need to download from storage)`);
        }
    }
}

async function renderModel(model) {
    const outputDir = `base_model_renders/${model.buildId}`;

    console.log('\n' + '='.repeat(80));
    console.log(`RENDERING: ${model.make} ${model.model} (${model.buildId})`);
    console.log('='.repeat(80));

    // Check if GLB exists
    try {
        await fs.access(model.glbPath);
    } catch (error) {
        console.error(`✗ GLB not found: ${model.glbPath}`);
        console.error(`  Please ensure GLB files are in source_models/base_glb/`);
        console.error(`  Or download from Firebase Storage first`);
        throw error;
    }

    // Build Blender command
    const args = [
        '--background',
        '--python', BLENDER_SCRIPT,
        '--',
        '--glb', model.glbPath,
        '--build-id', model.buildId,
        '--color', model.color,
        '--output', outputDir,
        '--year', model.year,
        '--make', model.make,
        '--model', model.model,
        '--trim', model.trim,
        '--wheels', model.wheels,
    ];

    // Properly quote all arguments for shell execution
    const quotedBlenderPath = `'${BLENDER_PATH.replace(/'/g, "'\\''")}'`;
    const quotedArgs = args.map(arg => `'${arg.replace(/'/g, "'\\''")}'`);
    const command = `${quotedBlenderPath} ${quotedArgs.join(' ')}`;

    console.log(`\nCommand: ${command}\n`);

    const startTime = Date.now();

    try {
        const { stdout, stderr } = await execAsync(command, {
            maxBuffer: 1024 * 1024 * 10, // 10MB buffer for Blender output
        });

        if (stdout) console.log(stdout);
        if (stderr) console.error('Blender warnings:', stderr);

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`\n✓ Render complete (${duration}s): ${outputDir}`);

        return { success: true, buildId: model.buildId, outputDir, duration };
    } catch (error) {
        console.error(`\n✗ Render failed: ${error.message}`);
        return { success: false, buildId: model.buildId, error: error.message };
    }
}

async function qualityGate(buildId, outputDir) {
    console.log(`\n[Quality Gate] Checking ${buildId}...`);

    // Check that all 10 angles exist
    const requiredAngles = Array.from({ length: 10 }, (_, i) => `angle_${String(i + 1).padStart(2, '0')}.png`);

    for (const angleName of requiredAngles) {
        const anglePath = path.join(outputDir, angleName);
        try {
            await fs.access(anglePath);
        } catch (error) {
            console.error(`  ✗ Missing: ${angleName}`);
            return false;
        }
    }

    // Check manifest exists
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
    console.log('BLENDER BATCH RENDERER - BASE MODELS');
    console.log('Matches PDF quality reference\n');

    try {
        await checkPrerequisites();

        const results = [];

        for (const model of BASE_MODELS) {
            const result = await renderModel(model);
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

        const totalDuration = results
            .filter(r => r.success)
            .reduce((sum, r) => sum + parseFloat(r.duration), 0);

        console.log(`\nTotal render time: ${totalDuration.toFixed(1)}s`);
        console.log('\nNext steps:');
        console.log('1. Review renders in base_model_renders/');
        console.log('2. Compare angles 01/04/07 against PDF quality reference');
        console.log('3. Upload to Firebase Storage: node scripts/upload_base_renders.js');
        console.log('4. Update Firestore mappings');

    } catch (error) {
        console.error('\nFatal error:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { renderModel, qualityGate };
