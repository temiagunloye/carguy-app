const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = '/Users/temiagunloye/.gemini/antigravity/brain/23c8213d-1fa0-485f-950e-b5e69947ec56';
const DEST_DIR = 'website/public/assets/cars/subaru_brz_custom';

if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
}

// Map logical angles to the artifact timestamps found earlier
const map = {
    'angle_01.png': 'brz_custom_angle_01_1770414098264.png',
    'angle_02.png': 'brz_custom_angle_02_1770414111760.png',
    'angle_03.png': 'brz_custom_angle_03_1770414124753.png',
    'angle_04.png': 'brz_custom_angle_04_1770414138147.png',
    'angle_05.png': 'brz_custom_angle_05_1770414151413.png',
    'angle_06.png': 'brz_custom_angle_06_1770414189690.png',
    'angle_07.png': 'brz_custom_angle_07_1770414202586.png',
    'angle_08.png': 'brz_custom_angle_08_1770414216222.png',
    'angle_09.png': 'brz_custom_angle_09_1770414233229.png',
    'angle_10.png': 'brz_custom_angle_10_1770414247840.png'
};

Object.entries(map).forEach(([destName, srcName]) => {
    const srcPath = path.join(ARTIFACT_DIR, srcName);
    const destPath = path.join(DEST_DIR, destName);

    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`Restored ${destName} from artifact.`);
    } else {
        console.error(`Missing artifact source: ${srcName}`);
    }
});
