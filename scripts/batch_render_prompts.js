/**
 * BATCH CAR RENDER GENERATOR
 * Run this after quota resets (8:45 AM / 14:45 UTC)
 * 
 * This script provides prompts for the HIGH PRIORITY Custom Builds.
 * 
 * BATCH A (Total 29 Images):
 * 1. BMW M3 Custom (10 angles)
 * 2. Mercedes C63 Custom (10 angles)
 * 3. Porsche GT3 Camo (9 angles - skipping angle_01)
 */

const PROMPTS = {
    // 1. BMW M3 Custom (Toronto Red + BBS FI-R)
    'BMW M3 Custom': [
        { angle: 'angle_01', prompt: '2023 BMW M3 Competition in Toronto Red Metallic, modified with BBS FI-R wheels in platinum silver, professional automotive photography, driver front three-quarter view, neutral gradient studio background, dramatic lighting, sharp focus, 8k resolution, photorealistic' },
        { angle: 'angle_02', prompt: '2023 BMW M3 Competition in Toronto Red Metallic, modified with BBS FI-R wheels in platinum silver, professional automotive photography, straight front view, neutral gradient studio background, dramatic lighting, sharp focus, 8k resolution, photorealistic' },
        { angle: 'angle_03', prompt: '2023 BMW M3 Competition in Toronto Red Metallic, modified with BBS FI-R wheels in platinum silver, professional automotive photography, passenger front three-quarter view, neutral gradient studio background, dramatic lighting, sharp focus, 8k resolution, photorealistic' },
        { angle: 'angle_04', prompt: '2023 BMW M3 Competition in Toronto Red Metallic, modified with BBS FI-R wheels in platinum silver, professional automotive photography, full passenger side profile view, neutral gradient studio background, dramatic lighting, sharp focus, 8k resolution, photorealistic' },
        { angle: 'angle_05', prompt: '2023 BMW M3 Competition in Toronto Red Metallic, modified with BBS FI-R wheels in platinum silver, professional automotive photography, passenger rear three-quarter view, neutral gradient studio background, dramatic lighting, sharp focus, 8k resolution, photorealistic' },
        { angle: 'angle_06', prompt: '2023 BMW M3 Competition in Toronto Red Metallic, modified with BBS FI-R wheels in platinum silver, professional automotive photography, straight rear view, neutral gradient studio background, dramatic lighting, sharp focus, 8k resolution, photorealistic' },
        { angle: 'angle_07', prompt: '2023 BMW M3 Competition in Toronto Red Metallic, modified with BBS FI-R wheels in platinum silver, professional automotive photography, driver rear three-quarter view, neutral gradient studio background, dramatic lighting, sharp focus, 8k resolution, photorealistic' },
        { angle: 'angle_08', prompt: '2023 BMW M3 Competition in Toronto Red Metallic, modified with BBS FI-R wheels in platinum silver, professional automotive photography, full driver side profile view, neutral gradient studio background, dramatic lighting, sharp focus, 8k resolution, photorealistic' },
        { angle: 'angle_09', prompt: '2023 BMW M3 Competition in Toronto Red Metallic, modified with BBS FI-R wheels in platinum silver, professional automotive photography, low angle front view, neutral gradient studio background, dramatic lighting, sharp focus, 8k resolution, photorealistic' },
        { angle: 'angle_10', prompt: '2023 BMW M3 Competition in Toronto Red Metallic, modified with BBS FI-R wheels in platinum silver, professional automotive photography, low angle rear view, neutral gradient studio background, dramatic lighting, sharp focus, 8k resolution, photorealistic' }
    ],

    // 2. Mercedes C63 Custom (Matte Coal + Rohana RFX17)
    'Mercedes C63 Custom': [
        { angle: 'angle_01', prompt: '2024 Mercedes-AMG C63 in Matte Coal Dark Grey wrap, modified with 19" Rohana RFX17 Titanium wheels, professional automotive photography, driver front three-quarter view, moody dark studio background, cinematic lighting, sharp focus, 8k resolution, photorealistic, aggressive stance' },
        { angle: 'angle_02', prompt: '2024 Mercedes-AMG C63 in Matte Coal Dark Grey wrap, modified with 19" Rohana RFX17 Titanium wheels, professional automotive photography, straight front view, moody dark studio background, cinematic lighting, sharp focus, 8k resolution, photorealistic, aggressive stance' },
        { angle: 'angle_03', prompt: '2024 Mercedes-AMG C63 in Matte Coal Dark Grey wrap, modified with 19" Rohana RFX17 Titanium wheels, professional automotive photography, passenger front three-quarter view, moody dark studio background, cinematic lighting, sharp focus, 8k resolution, photorealistic, aggressive stance' },
        { angle: 'angle_04', prompt: '2024 Mercedes-AMG C63 in Matte Coal Dark Grey wrap, modified with 19" Rohana RFX17 Titanium wheels, professional automotive photography, full passenger side profile view, moody dark studio background, cinematic lighting, sharp focus, 8k resolution, photorealistic, aggressive stance' },
        { angle: 'angle_05', prompt: '2024 Mercedes-AMG C63 in Matte Coal Dark Grey wrap, modified with 19" Rohana RFX17 Titanium wheels, professional automotive photography, passenger rear three-quarter view, moody dark studio background, cinematic lighting, sharp focus, 8k resolution, photorealistic, aggressive stance' },
        { angle: 'angle_06', prompt: '2024 Mercedes-AMG C63 in Matte Coal Dark Grey wrap, modified with 19" Rohana RFX17 Titanium wheels, professional automotive photography, straight rear view, moody dark studio background, cinematic lighting, sharp focus, 8k resolution, photorealistic, aggressive stance' },
        { angle: 'angle_07', prompt: '2024 Mercedes-AMG C63 in Matte Coal Dark Grey wrap, modified with 19" Rohana RFX17 Titanium wheels, professional automotive photography, driver rear three-quarter view, moody dark studio background, cinematic lighting, sharp focus, 8k resolution, photorealistic, aggressive stance' },
        { angle: 'angle_08', prompt: '2024 Mercedes-AMG C63 in Matte Coal Dark Grey wrap, modified with 19" Rohana RFX17 Titanium wheels, professional automotive photography, full driver side profile view, moody dark studio background, cinematic lighting, sharp focus, 8k resolution, photorealistic, aggressive stance' },
        { angle: 'angle_09', prompt: '2024 Mercedes-AMG C63 in Matte Coal Dark Grey wrap, modified with 19" Rohana RFX17 Titanium wheels, professional automotive photography, low angle front view, moody dark studio background, cinematic lighting, sharp focus, 8k resolution, photorealistic, aggressive stance' },
        { angle: 'angle_10', prompt: '2024 Mercedes-AMG C63 in Matte Coal Dark Grey wrap, modified with 19" Rohana RFX17 Titanium wheels, professional automotive photography, low angle rear view, moody dark studio background, cinematic lighting, sharp focus, 8k resolution, photorealistic, aggressive stance' }
    ],

    // 3. Porsche GT3 Camo (Camouflage Green Wrap) - 9 missing angles
    'Porsche GT3 Camo': [
        { angle: 'angle_02', prompt: '2024 Porsche 911 GT3 wrapped in Camouflage Green, professional automotive photography, straight front view, white studio background, bright lighting, sharp focus, 8k resolution, photorealistic, track car aesthetic' },
        { angle: 'angle_03', prompt: '2024 Porsche 911 GT3 wrapped in Camouflage Green, professional automotive photography, passenger front three-quarter view, white studio background, bright lighting, sharp focus, 8k resolution, photorealistic, track car aesthetic' },
        { angle: 'angle_04', prompt: '2024 Porsche 911 GT3 wrapped in Camouflage Green, professional automotive photography, full passenger side profile view, white studio background, bright lighting, sharp focus, 8k resolution, photorealistic, track car aesthetic' },
        { angle: 'angle_05', prompt: '2024 Porsche 911 GT3 wrapped in Camouflage Green, professional automotive photography, passenger rear three-quarter view, white studio background, bright lighting, sharp focus, 8k resolution, photorealistic, track car aesthetic' },
        { angle: 'angle_06', prompt: '2024 Porsche 911 GT3 wrapped in Camouflage Green, professional automotive photography, straight rear view, white studio background, bright lighting, sharp focus, 8k resolution, photorealistic, track car aesthetic' },
        { angle: 'angle_07', prompt: '2024 Porsche 911 GT3 wrapped in Camouflage Green, professional automotive photography, driver rear three-quarter view, white studio background, bright lighting, sharp focus, 8k resolution, photorealistic, track car aesthetic' },
        { angle: 'angle_08', prompt: '2024 Porsche 911 GT3 wrapped in Camouflage Green, professional automotive photography, full driver side profile view, white studio background, bright lighting, sharp focus, 8k resolution, photorealistic, track car aesthetic' },
        { angle: 'angle_09', prompt: '2024 Porsche 911 GT3 wrapped in Camouflage Green, professional automotive photography, low angle front view, white studio background, bright lighting, sharp focus, 8k resolution, photorealistic, track car aesthetic' },
        { angle: 'angle_10', prompt: '2024 Porsche 911 GT3 wrapped in Camouflage Green, professional automotive photography, low angle rear view, white studio background, bright lighting, sharp focus, 8k resolution, photorealistic, track car aesthetic' }
    ]
};

console.log('🎨 CUSTOM BUILD RENDER GUIDE');
console.log('='.repeat(70));
console.log('Total Images: 29 (May need split batch)');
console.log('1. BMW M3 Custom (10)');
console.log('2. Mercedes C63 Custom (10)');
console.log('3. Porsche GT3 Camo (9)');
console.log('='.repeat(70));

let count = 1;
for (const [carName, angles] of Object.entries(PROMPTS)) {
    console.log(`\n${carName.toUpperCase()}`);
    console.log('-'.repeat(70));

    for (const { angle, prompt } of angles) {
        console.log(`\n[${count}/29] ${angle}:`);
        console.log(`Filename: ${carName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${angle}.png`);
        console.log(`Prompt: "${prompt}"`);
        count++;
    }
}
