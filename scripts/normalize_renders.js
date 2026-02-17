const fs = require('fs');
const path = require('path');

const MAPPING = {
    'driver_front.png': 'angle_01.png',        // Front 3/4 Driver
    'front_center.png': 'angle_02.png',        // Front
    'passenger_front.png': 'angle_03.png',     // Front 3/4 Passenger
    'full_passenger_side.png': 'angle_04.png', // Side Passenger
    'passenger_rear.png': 'angle_05.png',      // Rear 3/4 Passenger
    'rear_center.png': 'angle_06.png',         // Rear
    'driver_rear.png': 'angle_07.png',         // Rear 3/4 Driver
    'full_driver_side.png': 'angle_08.png',    // Side Driver
    'front_low.png': 'angle_09.png',           // High Front (Mapping Low to High slot for completeness, or keep separate?) 
    // Actually, let's map 'front_low' to angle_09 slot but we know it's different.
    'rear_low.png': 'angle_10.png'             // Low Rear
};

const JOBS = [
    { srcDir: 'tmp/final-renders/mercedes_c63_2024', destName: 'mercedes_c63_2024_matte_coal' },
    { srcDir: 'tmp/final-renders/audi_rs6_2024', destName: 'audi_rs6_2024_nardo_grey' },
    { srcDir: 'tmp/final-renders/bmw_m3_2024', destName: 'bmw_m3_2023_toronto_red' },
    { srcDir: 'tmp/final-renders/subaru_brz_2024', destName: 'subaru_brz_2022_matte_black' },
    { srcDir: 'output/renders/porsche_911_2024', destName: 'porsche_911_2024_army_green' }
];

const DEST_BASE = 'renders/batch_01';

function normalize() {
    JOBS.forEach(job => {
        const srcDir = job.srcDir; // Absolute or relative path usage
        const destDir = path.join(DEST_BASE, job.destName);

        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }

        console.log(`\nProcessing ${job.destName}...`);
        console.log(`   Source: ${srcDir}`);


        // Generate Manifest Data
        const manifestAngles = [];

        Object.entries(MAPPING).forEach(([srcFile, destFile]) => {
            let srcPath = path.join(srcDir, srcFile);
            let finalDestFile = destFile;

            // 1. Check strict PNG match
            if (!fs.existsSync(srcPath)) {
                // 2. Check JPG match
                const srcFileJpg = srcFile.replace('.png', '.jpg');
                const srcPathJpg = path.join(srcDir, srcFileJpg);

                if (fs.existsSync(srcPathJpg)) {
                    srcPath = srcPathJpg;
                    finalDestFile = destFile.replace('.png', '.jpg'); // Keep extension correct
                } else {
                    console.log(`   ❌ Missing: ${srcFile} (and .jpg variant)`);
                    return; // Skip this angle
                }
            }

            const destPath = path.join(destDir, finalDestFile);
            fs.copyFileSync(srcPath, destPath);
            console.log(`   ✅ Validated: ${finalDestFile}`);

            // Add to manifest data
            const angleId = finalDestFile.replace('angle_', '').replace('.png', '').replace('.jpg', '');
            manifestAngles.push({
                angleId: angleId,
                filename: finalDestFile,
                label: "Legacy Normalized",
                camera: { azimuth: 0, elevation: 0, distance: 0 } // Unknown for legacy
            });
        });

        // Write Manifest
        const manifest = {
            createdAt: new Date().toISOString(),
            sourceModel: "Legacy Import",
            angleCount: manifestAngles.length,
            specVersion: "2.0 (Normalized)",
            paintConfig: "legacy",
            angles: manifestAngles
        };

        fs.writeFileSync(path.join(destDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
        console.log(`   📝 Manifest created.`);
    });
}

normalize();
