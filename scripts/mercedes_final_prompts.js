#!/usr/bin/env node

/**
 * FINAL 6 MERCEDES C63 IMAGES
 * Quota resets at: 1:45 PM (4h 51m from now)
 * 
 * Run this script to see the 6 remaining prompts, then generate and upload.
 */

const REMAINING_MERCEDES_PROMPTS = [
    {
        angle: 'driver_rear',
        prompt: '2024 Mercedes-AMG C63 in Obsidian Black Metallic, professional automotive photography, driver rear three-quarter view (225 degree angle), dark gradient gray studio background, dramatic cinematic lighting, ultra-sharp details, photorealistic, studio quality, subtle floor shadows, premium car photography, quad exhaust'
    },
    {
        angle: 'passenger_rear',
        prompt: '2024 Mercedes-AMG C63 in Obsidian Black Metallic, professional automotive photography, passenger rear three-quarter view (135 degree angle), dark gradient gray studio background, dramatic cinematic lighting, ultra-sharp details, photorealistic, studio quality, subtle floor shadows, premium car photography, quad exhaust'
    },
    {
        angle: 'front_center',
        prompt: '2024 Mercedes-AMG C63 in Obsidian Black Metallic, professional automotive photography, straight front center view (0 degree angle), dark gradient gray studio background, dramatic cinematic lighting, ultra-sharp details, photorealistic, studio quality, subtle floor shadows, premium car photography, showing AMG Panamericana grille'
    },
    {
        angle: 'rear_center',
        prompt: '2024 Mercedes-AMG C63 in Obsidian Black Metallic, professional automotive photography, straight rear center view (180 degree angle), dark gradient gray studio background, dramatic cinematic lighting, ultra-sharp details, photorealistic, studio quality, subtle floor shadows, premium car photography, showing quad exhaust pipes'
    },
    {
        angle: 'front_low',
        prompt: '2024 Mercedes-AMG C63 in Obsidian Black Metallic, professional automotive photography, dramatic low angle front view, dark gradient gray studio background, epic cinematic lighting with strong rim lights, ultra-sharp details, photorealistic, studio quality, ground-level perspective, subtle floor shadows, premium car photography, heroic perspective, AMG grille'
    },
    {
        angle: 'rear_low',
        prompt: '2024 Mercedes-AMG C63 in Obsidian Black Metallic, professional automotive photography, dramatic low angle rear view, dark gradient gray studio background, epic cinematic lighting with strong rim lights, ultra-sharp details, photorealistic, studio quality, ground-level perspective, subtle floor shadows, premium car photography, showing quad exhaust, heroic perspective'
    }
];

console.log('🚗 MERCEDES-AMG C63 - FINAL 6 IMAGES');
console.log('='.repeat(70));
console.log('\n⏰ Quota resets at: 1:45 PM');
console.log('📊 Current progress: 4/10 images uploaded');
console.log('🎯 Need: 6 more images to complete\n');
console.log('='.repeat(70));
console.log('\n📝 PROMPTS FOR GEMINI:\n');

REMAINING_MERCEDES_PROMPTS.forEach((item, i) => {
    console.log(`[${i + 1}/6] ${item.angle}:`);
    console.log(`"${item.prompt}"`);
    console.log('');
});

console.log('='.repeat(70));
console.log('\n📋 AFTER GENERATION:\n');
console.log('1. Note the timestamped filenames');
console.log('2. Update the file mapping below');
console.log('3. Run: node scripts/upload_final_mercedes.js\n');

console.log('Example file mapping:');
console.log(`
const MERCEDES_FILES = {
    'mercedes_c63_driver_rear_<TIMESTAMP>.png': 'driver_rear',
    'mercedes_c63_passenger_rear_<TIMESTAMP>.png': 'passenger_rear',
    'mercedes_c63_front_center_<TIMESTAMP>.png': 'front_center',
    'mercedes_c63_rear_center_<TIMESTAMP>.png': 'rear_center',
    'mercedes_c63_front_low_<TIMESTAMP>.png': 'front_low',
    'mercedes_c63_rear_low_<TIMESTAMP>.png': 'rear_low'
};
`);
