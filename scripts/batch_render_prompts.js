/**
 * BATCH CAR RENDER GENERATOR
 * Run this after quota resets (8:45 AM / 14:45 UTC)
 * 
 * This script provides all prompts for the remaining 22 car images.
 * Copy each prompt into Gemini's image generation, then update the 
 * GENERATED_FILES mapping below and run the upload function.
 */

// ========================================================================
// PROMPTS FOR REMAINING IMAGES (22 total)
// ========================================================================

const PROMPTS = {
    // Subaru BRZ - 2 remaining angles
    'Subaru BRZ': [
        {
            angle: 'front_low',
            prompt: '2024 Subaru BRZ in WR Blue Pearl, professional automotive photography, dramatic low angle front view, white seamless studio background, epic cinematic lighting, ultra-sharp details, photorealistic, studio quality, ground-level perspective, subtle floor shadows, premium car photography, sports coupe, heroic angle'
        },
        {
            angle: 'rear_low',
            prompt: '2024 Subaru BRZ in WR Blue Pearl, professional automotive photography, dramatic low angle rear view, white seamless studio background, epic cinematic lighting, ultra-sharp details, photorealistic, studio quality, ground-level perspective, subtle floor shadows, premium car photography, sports coupe, heroic angle'
        }
    ],

    // Audi RS6 - 10 new angles
    'Audi RS6 Avant': [
        {
            angle: 'driver_front',
            prompt: '2024 Audi RS6 Avant in Daytona Grey Pearl, professional automotive photography, driver front three-quarter view (315 degree angle), neutral gradient studio background, dramatic cinematic lighting with rim lights, ultra-sharp details, photorealistic, studio quality, subtle floor shadows, premium car photography, performance wagon'
        },
        {
            angle: 'passenger_front',
            prompt: '2024 Audi RS6 Avant in Daytona Grey Pearl, professional automotive photography, passenger front three-quarter view (45 degree angle), neutral gradient studio background, dramatic cinematic lighting with rim lights, ultra-sharp details, photorealistic, studio quality, subtle floor shadows, premium car photography, performance wagon'
        },
        {
            angle: 'full_driver_side',
            prompt: '2024 Audi RS6 Avant in Daytona Grey Pearl, professional automotive photography, full driver side profile view (270 degree angle), neutral gradient studio background, dramatic cinematic lighting with rim lights, ultra-sharp details, photorealistic, studio quality, subtle floor shadows, premium car photography, performance wagon'
        },
        {
            angle: 'full_passenger_side',
            prompt: '2024 Audi RS6 Avant in Daytona Grey Pearl, professional automotive photography, full passenger side profile view (90 degree angle), neutral gradient studio background, dramatic cinematic lighting with rim lights, ultra-sharp details, photorealistic, studio quality, subtle floor shadows, premium car photography, performance wagon'
        },
        {
            angle: 'driver_rear',
            prompt: '2024 Audi RS6 Avant in Daytona Grey Pearl, professional automotive photography, driver rear three-quarter view (225 degree angle), neutral gradient studio background, dramatic cinematic lighting with rim lights, ultra-sharp details, photorealistic, studio quality, subtle floor shadows, premium car photography, performance wagon'
        },
        {
            angle: 'passenger_rear',
            prompt: '2024 Audi RS6 Avant in Daytona Grey Pearl, professional automotive photography, passenger rear three-quarter view (135 degree angle), neutral gradient studio background, dramatic cinematic lighting with rim lights, ultra-sharp details, photorealistic, studio quality, subtle floor shadows, premium car photography, performance wagon'
        },
        {
            angle: 'front_center',
            prompt: '2024 Audi RS6 Avant in Daytona Grey Pearl, professional automotive photography, straight front center view (0 degree angle), neutral gradient studio background, dramatic cinematic lighting with rim lights, ultra-sharp details, photorealistic, studio quality, subtle floor shadows, premium car photography, performance wagon, showing Audi grille'
        },
        {
            angle: 'rear_center',
            prompt: '2024 Audi RS6 Avant in Daytona Grey Pearl, professional automotive photography, straight rear center view (180 degree angle), neutral gradient studio background, dramatic cinematic lighting with rim lights, ultra-sharp details, photorealistic, studio quality, subtle floor shadows, premium car photography, performance wagon'
        },
        {
            angle: 'front_low',
            prompt: '2024 Audi RS6 Avant in Daytona Grey Pearl, professional automotive photography, dramatic low angle front view, neutral gradient studio background, epic cinematic lighting with strong rim lights, ultra-sharp details, photorealistic, studio quality, ground-level perspective, subtle floor shadows, premium car photography, performance wagon, heroic angle'
        },
        {
            angle: 'rear_low',
            prompt: '2024 Audi RS6 Avant in Daytona Grey Pearl, professional automotive photography, dramatic low angle rear view, neutral gradient studio background, epic cinematic lighting with strong rim lights, ultra-sharp details, photorealistic, studio quality, ground-level perspective, subtle floor shadows, premium car photography, performance wagon, heroic angle'
        }
    ],

    // Mercedes-AMG C63 - 10 new angles
    'Mercedes-AMG C63': [
        {
            angle: 'driver_front',
            prompt: '2024 Mercedes-AMG C63 in Obsidian Black Metallic, professional automotive photography, driver front three-quarter view (315 degree angle), dark gradient gray studio background, dramatic cinematic lighting, ultra-sharp details, photorealistic, studio quality, subtle floor shadows, premium car photography, AMG Panamericana grille'
        },
        {
            angle: 'passenger_front',
            prompt: '2024 Mercedes-AMG C63 in Obsidian Black Metallic, professional automotive photography, passenger front three-quarter view (45 degree angle), dark gradient gray studio background, dramatic cinematic lighting, ultra-sharp details, photorealistic, studio quality, subtle floor shadows, premium car photography, AMG Panamericana grille'
        },
        {
            angle: 'full_driver_side',
            prompt: '2024 Mercedes-AMG C63 in Obsidian Black Metallic, professional automotive photography, full driver side profile view (270 degree angle), dark gradient gray studio background, dramatic cinematic lighting, ultra-sharp details, photorealistic, studio quality, subtle floor shadows, premium car photography'
        },
        {
            angle: 'full_passenger_side',
            prompt: '2024 Mercedes-AMG C63 in Obsidian Black Metallic, professional automotive photography, full passenger side profile view (90 degree angle), dark gradient gray studio background, dramatic cinematic lighting, ultra-sharp details, photorealistic, studio quality, subtle floor shadows, premium car photography'
        },
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
    ]
};

// ========================================================================
// INSTRUCTIONS
// ========================================================================

console.log('🎨 BATCH CAR RENDER GENERATION GUIDE');
console.log('='.repeat(70));
console.log('\n📋 TOTAL IMAGES TO GENERATE: 22');
console.log('   • Subaru BRZ: 2 images');
console.log('   • Audi RS6 Avant: 10 images');
console.log('   • Mercedes-AMG C63: 10 images\n');
console.log('='.repeat(70));
console.log('\n📝 STEP-BY-STEP PROCESS:\n');
console.log('1. Wait for quota to reset (8:45 AM / 14:45 UTC)');
console.log('2. Use the prompts below in Gemini image generation');
console.log('3. Save each generated image with the suggested name');
console.log('4. After all 22 images are generated, run:');
console.log('   node scripts/upload_all_remaining.js\n');
console.log('='.repeat(70));
console.log('\n🚗 PROMPTS BY CAR:\n');

let count = 1;
for (const [carName, angles] of Object.entries(PROMPTS)) {
    console.log(`\n${carName.toUpperCase()}`);
    console.log('-'.repeat(70));

    for (const { angle, prompt } of angles) {
        console.log(`\n[${count}/22] ${angle}:`);
        console.log(`Suggested filename: ${carName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${angle}.png`);
        console.log(`\nPrompt:`);
        console.log(`"${prompt}"`);
        console.log('');
        count++;
    }
}

console.log('\n' + '='.repeat(70));
console.log('💡 TIP: Copy prompts into Gemini one at a time for best results');
console.log('='.repeat(70));
console.log('\n✅ After generation, update GENERATED_FILES in upload_all_remaining.js\n');
