const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Angle definitions matching the app's camera sequence
const ANGLES = [
    { name: 'driver_front', degrees: 45, description: 'Driver Front 3/4' },
    { name: 'passenger_front', degrees: 315, description: 'Passenger Front 3/4' },
    { name: 'full_driver_side', degrees: 90, description: 'Full Driver Side' },
    { name: 'full_passenger_side', degrees: 270, description: 'Full Passenger Side' },
    { name: 'driver_rear', degrees: 135, description: 'Driver Rear 3/4' },
    { name: 'passenger_rear', degrees: 225, description: 'Passenger Rear 3/4' },
    { name: 'front_center', degrees: 0, description: 'Front Center' },
    { name: 'rear_center', degrees: 180, description: 'Rear Center' },
    { name: 'front_low', degrees: 30, description: 'Front Low Angle' },
    { name: 'rear_low', degrees: 150, description: 'Rear Low Angle' }
];

async function renderGLB(glbPath, outputDir, carId) {
    console.log(`\n🎨 Rendering ${carId}...`);
    console.log(`   GLB: ${glbPath}`);
    console.log(`   Output: ${outputDir}\n`);

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Launch headless browser
    const browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });

        // Load renderer HTML
        const rendererPath = path.join(__dirname, 'renderer.html');
        await page.goto(`file://${rendererPath}`, { waitUntil: 'networkidle0' });

        // Wait for renderer to be ready
        await page.waitForFunction(() => window.rendererReady === true, { timeout: 10000 });
        console.log('   ✓ Renderer initialized');

        // Serve the GLB file via data URI or file protocol
        const glbAbsolutePath = path.resolve(glbPath);

        // Load the model
        console.log('   ⬇️  Loading model...');
        await page.evaluate(async (modelPath) => {
            await window.loadModel(`file://${modelPath}`);
        }, glbAbsolutePath);

        console.log('   ✓ Model loaded\n');

        // Render each angle
        for (const angle of ANGLES) {
            console.log(`   📸 Rendering ${angle.description} (${angle.degrees}°)...`);

            // Set camera angle
            await page.evaluate((degrees) => {
                window.setCameraAngle(degrees);
                window.renderFrame();
            }, angle.degrees);

            // Wait a moment for the render to complete
            await page.waitForTimeout(500);

            // Get screenshot as base64
            const screenshot = await page.evaluate(() => {
                return window.getScreenshot();
            });

            // Convert base64 to buffer and save
            const base64Data = screenshot.replace(/^data:image\/png;base64,/, '');
            const imageBuffer = Buffer.from(base64Data, 'base64');
            const outputPath = path.join(outputDir, `${angle.name}.png`);

            fs.writeFileSync(outputPath, imageBuffer);
            console.log(`      ✓ Saved ${angle.name}.png`);
        }

        console.log(`\n✅ Rendered all ${ANGLES.length} angles for ${carId}`);

    } catch (error) {
        console.error(`❌ Error rendering ${carId}:`, error.message);
        throw error;
    } finally {
        await browser.close();
    }
}

async function renderAllCars() {
    const cars = [
        {
            id: 'bmw_m3_2024',
            glbPath: '2023_bmw_m3_touring.glb',
            displayName: 'BMW M3 2024'
        },
        {
            id: 'subaru_brz_2024',
            glbPath: '2024_subaru_brz_ts.glb',
            displayName: 'Subaru BRZ 2024'
        },
        {
            id: 'porsche_911_2024',
            glbPath: 'free_porsche_911_carrera_4s.glb',
            displayName: 'Porsche 911 2024'
        }
    ];

    console.log('🚀 Starting GLB Render Pipeline...\n');

    for (const car of cars) {
        const glbPath = path.join(__dirname, '../../', car.glbPath);

        // Check if GLB exists
        if (!fs.existsSync(glbPath)) {
            console.log(`⚠️  Skipping ${car.displayName}: GLB not found at ${glbPath}`);
            continue;
        }

        const outputDir = path.join(__dirname, '../../output/renders', car.id);

        try {
            await renderGLB(glbPath, outputDir, car.id);
        } catch (error) {
            console.error(`Failed to render ${car.id}:`, error);
            // Continue with next car
        }
    }

    console.log('\n🎉 Render pipeline complete!');
}

// Run if called directly
if (require.main === module) {
    renderAllCars().catch(err => {
        console.error('Fatal error:', err);
        process.exit(1);
    });
}

module.exports = { renderGLB, renderAllCars };
