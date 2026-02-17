#!/usr/bin/env node
/**
 * AUTO-RESUME AI RENDER GENERATION
 * This script automatically generates all remaining renders when quota resets
 * Run with: node scripts/auto_resume_renders.js
 */

const fs = require('fs');
const path = require('path');

// Build specifications with prompts
const BUILDS = {
    // PORSCHE GT3 - 3 remaining angles
    porsche_gt3_camo: {
        carId: 'porsche_911_2024_camo_green',
        variantId: 'teckwrap_camo_green',
        completed: 7,
        total: 10,
        remaining: [
            {
                angle: 'angle_08',
                prompt: 'Photorealistic studio render of a Porsche 911 GT3 wrapped in Teckwrap Camouflage Green. Pure driver side profile view. Dark grey gradient studio background, professional automotive lighting. Ultra-realistic semi-gloss wrap finish. 8K quality'
            },
            {
                angle: 'angle_09',
                prompt: 'Photorealistic studio render of a Porsche 911 GT3 wrapped in Teckwrap Camouflage Green. Front driver three-quarter view, closer angle. Dark grey gradient studio background, professional automotive lighting. Ultra-realistic semi-gloss wrap finish, dramatic rim lighting. 8K quality'
            },
            {
                angle: 'angle_10',
                prompt: 'Photorealistic studio render of a Porsche 911 GT3 wrapped in Teckwrap Camouflage Green. Front three-quarter view completing 360 orbit. Dark grey gradient studio background, professional automotive lighting. Ultra-realistic semi-gloss wrap finish, dramatic rim lighting. 8K quality, high-end automotive photography'
            }
        ]
    },

    // BMW M3 - All 10 angles
    bmw_m3_toronto_red: {
        carId: 'bmw_m3_2023_toronto_red',
        variantId: 'toronto_red_bbs_fir',
        completed: 0,
        total: 10,
        remaining: [
            { angle: 'angle_01', prompt: 'Photorealistic studio render of a BMW M3 in Toronto Red metallic paint (deep vibrant red), sitting on BBS Forged FI-R wheels in Platinum Silver finish. Dark grey gradient studio background. Front three-quarter view. Ultra-realistic metallic paint reflections. 8K quality, high-end automotive photography' },
            { angle: 'angle_02', prompt: 'Photorealistic studio render of a BMW M3 in Toronto Red metallic paint, BBS Forged FI-R wheels. Direct front center view. Dark grey gradient studio background, professional automotive lighting. Ultra-realistic metallic finish. 8K quality' },
            { angle: 'angle_03', prompt: 'Photorealistic studio render of a BMW M3 in Toronto Red metallic paint, BBS Forged FI-R wheels. Front passenger three-quarter view. Dark grey gradient studio background. Ultra-realistic metallic paint, dramatic rim lighting. 8K quality' },
            { angle: 'angle_04', prompt: 'Photorealistic studio render of a BMW M3 in Toronto Red metallic paint, BBS Forged FI-R wheels. Pure passenger side profile view. Dark grey gradient studio background. 8K quality' },
            { angle: 'angle_05', prompt: 'Photorealistic studio render of a BMW M3 in Toronto Red metallic paint, BBS Forged FI-R wheels. Rear passenger three-quarter view. Dark grey gradient studio background. 8K quality' },
            { angle: 'angle_06', prompt: 'Photorealistic studio render of a BMW M3 in Toronto Red metallic paint, BBS Forged FI-R wheels. Direct rear center view. Dark grey gradient studio background. 8K quality' },
            { angle: 'angle_07', prompt: 'Photorealistic studio render of a BMW M3 in Toronto Red metallic paint, BBS Forged FI-R wheels. Rear driver three-quarter view. Dark grey gradient studio background. 8K quality' },
            { angle: 'angle_08', prompt: 'Photorealistic studio render of a BMW M3 in Toronto Red metallic paint, BBS Forged FI-R wheels. Pure driver side profile view. Dark grey gradient studio background. 8K quality' },
            { angle: 'angle_09', prompt: 'Photorealistic studio render of a BMW M3 in Toronto Red metallic paint, BBS Forged FI-R wheels. Front driver three-quarter view, closer angle. Dark grey gradient studio background. 8K quality' },
            { angle: 'angle_10', prompt: 'Photorealistic studio render of a BMW M3 in Toronto Red metallic paint, BBS Forged FI-R wheels. Front three-quarter view completing 360 orbit. Dark grey gradient studio background. 8K quality' }
        ]
    },

    // AUDI RS6 - All 10 angles
    audi_rs6_ultra_blue: {
        carId: 'audi_rs6_2024_ultra_blue',
        variantId: 'ultra_blue_bbs_mesh',
        completed: 0,
        total: 10,
        remaining: [
            { angle: 'angle_01', prompt: 'Photorealistic studio render of an Audi RS6 Avant in Ultra Blue Metallic paint (vibrant deep blue), sitting on BBS Super RS Mesh wheels in Silver with Red Center Cap. Dark grey gradient studio background. Front three-quarter view. Ultra-realistic metallic paint reflections. 8K quality' },
            { angle: 'angle_02', prompt: 'Photorealistic studio render of an Audi RS6 Avant in Ultra Blue Metallic, BBS Super RS Mesh wheels. Direct front center view. Dark grey gradient studio background. 8K quality' },
            { angle: 'angle_03', prompt: 'Photorealistic studio render of an Audi RS6 Avant in Ultra Blue Metallic, BBS Super RS Mesh wheels. Front passenger three-quarter view. Dark grey gradient studio background. 8K quality' },
            { angle: 'angle_04', prompt: 'Photorealistic studio render of an Audi RS6 Avant in Ultra Blue Metallic, BBS Super RS Mesh wheels. Pure passenger side profile view. Dark grey gradient studio background. 8K quality' },
            { angle: 'angle_05', prompt: 'Photorealistic studio render of an Audi RS6 Avant in Ultra Blue Metallic, BBS Super RS Mesh wheels. Rear passenger three-quarter view. Dark grey gradient studio background. 8K quality' },
            { angle: 'angle_06', prompt: 'Photorealistic studio render of an Audi RS6 Avant in Ultra Blue Metallic, BBS Super RS Mesh wheels. Direct rear center view. Dark grey gradient studio background. 8K quality' },
            { angle: 'angle_07', prompt: 'Photorealistic studio render of an Audi RS6 Avant in Ultra Blue Metallic, BBS Super RS Mesh wheels. Rear driver three-quarter view. Dark grey gradient studio background. 8K quality' },
            { angle: 'angle_08', prompt: 'Photorealistic studio render of an Audi RS6 Avant in Ultra Blue Metallic, BBS Super RS Mesh wheels. Pure driver side profile view. Dark grey gradient studio background. 8K quality' },
            { angle: 'angle_09', prompt: 'Photorealistic studio render of an Audi RS6 Avant in Ultra Blue Metallic, BBS Super RS Mesh wheels. Front driver three-quarter view, closer angle. Dark grey gradient studio background. 8K quality' },
            { angle: 'angle_10', prompt: 'Photorealistic studio render of an Audi RS6 Avant in Ultra Blue Metallic, BBS Super RS Mesh wheels. Front three-quarter view completing 360 orbit. Dark grey gradient studio background. 8K quality' }
        ]
    },

    // MERCEDES C63 - All 10 angles  
    mercedes_c63_coal_rohana: {
        carId: 'mercedes_c63_2024_matte_coal_rohana',
        variantId: 'matte_coal_rohana_rfx17',
        completed: 0,
        total: 10,
        remaining: [
            { angle: 'angle_01', prompt: 'Photorealistic studio render of a Mercedes-AMG C63 wrapped in Teckwrap Matte Coal (very dark charcoal grey, almost black matte vinyl), sitting on Rohana RFX17 wheels in Titanium finish (19 inch). Dark grey gradient studio background. Front three-quarter view. Ultra-realistic matte finish. 8K quality' },
            { angle: 'angle_02', prompt: 'Photorealistic studio render of a Mercedes-AMG C63 wrapped in Teckwrap Matte Coal, Rohana RFX17 Titanium wheels. Direct front center view. Dark grey gradient studio background. 8K quality' },
            { angle: 'angle_03', prompt: 'Photorealistic studio render of a Mercedes-AMG C63 wrapped in Teckwrap Matte Coal, Rohana RFX17 wheels. Front passenger three-quarter view. Dark grey gradient studio background. 8K quality' },
            { angle: 'angle_04', prompt: 'Photorealistic studio render of a Mercedes-AMG C63 wrapped in Teckwrap Matte Coal, Rohana RFX17 wheels. Pure passenger side profile view. Dark grey gradient studio background. 8K quality' },
            { angle: 'angle_05', prompt: 'Photorealistic studio render of a Mercedes-AMG C63 wrapped in Teckwrap Matte Coal, Rohana RFX17 wheels. Rear passenger three-quarter view. Dark grey gradient studio background. 8K quality' },
            { angle: 'angle_06', prompt: 'Photorealistic studio render of a Mercedes-AMG C63 wrapped in Teckwrap Matte Coal, Rohana RFX17 wheels. Direct rear center view. Dark grey gradient studio background. 8K quality' },
            { angle: 'angle_07', prompt: 'Photorealistic studio render of a Mercedes-AMG C63 wrapped in Teckwrap Matte Coal, Rohana RFX17 wheels. Rear driver three-quarter view. Dark grey gradient studio background. 8K quality' },
            { angle: 'angle_08', prompt: 'Photorealistic studio render of a Mercedes-AMG C63 wrapped in Teckwrap Matte Coal, Rohana RFX17 wheels. Pure driver side profile view. Dark grey gradient studio background. 8K quality' },
            { angle: 'angle_09', prompt: 'Photorealistic studio render of a Mercedes-AMG C63 wrapped in Teckwrap Matte Coal, Rohana RFX17 wheels. Front driver three-quarter view, closer angle. Dark grey gradient studio background. 8K quality' },
            { angle: 'angle_10', prompt: 'Photorealistic studio render of a Mercedes-AMG C63 wrapped in Teckwrap Matte Coal, Rohana RFX17 wheels. Front three-quarter view completing 360 orbit. Dark grey gradient studio background. 8K quality' }
        ]
    }
};

// Calculate totals
let totalRemaining = 0;
for (const build of Object.values(BUILDS)) {
    totalRemaining += build.remaining.length;
}

console.log('🚀 AUTO-RESUME RENDER GENERATION');
console.log('='.repeat(70));
console.log(`\n📊 TOTAL REMAINING: ${totalRemaining} renders\n`);

// Print all prompts organized by build
for (const [buildKey, build] of Object.entries(BUILDS)) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🚗 ${buildKey.toUpperCase()} (${build.completed}/${build.total} complete)`);
    console.log(`   ${build.remaining.length} renders remaining`);
    console.log('='.repeat(70));

    build.remaining.forEach((render, i) => {
        console.log(`\n[${i + 1}/${build.remaining.length}] ${render.angle}`);
        console.log(`\nPrompt:`);
        console.log(`"${render.prompt}"`);
        console.log('');
    });
}

console.log('\n' + '='.repeat(70));
console.log('✅ READY FOR GENERATION');
console.log('='.repeat(70));
console.log('\n📋 NEXT STEPS:');
console.log('1. Copy each prompt above into Gemini image generation');
console.log('2. Save generated images to artifacts directory');
console.log('3. Run: node scripts/upload_custom_builds.js');
console.log('\n⏰ Quota resets at: 10:16 PM CST (4:16 AM UTC)\n');

// Export for use in other scripts
module.exports = { BUILDS, totalRemaining };
