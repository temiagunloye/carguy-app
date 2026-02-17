const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Usage: node scripts/scrape_carvana_stub.js "Porsche 911"

const OUTPUT_DIR = 'output/scraped';

async function scrapeCar(searchTerm) {
    console.log(`Searching Carvana for: ${searchTerm}`);
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    // 1. Search
    const searchUrl = `https://www.carvana.com/cars/${searchTerm.replace(' ', '-').toLowerCase()}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle2' });

    // 2. Click First Result
    const firstCarSelector = 'div[data-qa="result-tile"] a';
    await page.waitForSelector(firstCarSelector, { timeout: 10000 }).catch(() => console.log("No results found."));
    const carUrl = await page.$eval(firstCarSelector, el => el.href);
    console.log(`Found Car URL: ${carUrl}`);

    await page.goto(carUrl, { waitUntil: 'domcontentloaded' });

    // 3. Find 360 Image Pattern
    // Carvana usually has a 'spin-button' or loads 360 automatically.
    // We listen for request patterns.
    const vehicleId = carUrl.split('/')[4]; // e.g. /vehicle/12345
    console.log(`Vehicle ID: ${vehicleId}`);

    // Pattern: https://img.carvana.io/crate/{vehicleId}/{angle}.jpg?v=...
    // We can just construct it!

    const carDir = path.join(OUTPUT_DIR, searchTerm.replace(' ', '_'));
    if (!fs.existsSync(carDir)) fs.mkdirSync(carDir, { recursive: true });

    // 0 to 36
    for (let i = 0; i <= 36; i += 4) { // Get every 4th frame for ~10 frames
        let frameNum = i.toString().padStart(2, '0');
        const imageUrl = `https://img.carvana.io/crate/${vehicleId}/${frameNum}.jpg`; // Hypothesis
        const fileName = `${mapFrameToKey(i)}.jpg`;

        console.log(`Downloading ${fileName} from ${imageUrl}...`);
        // Download logic...
    }

    await browser.close();
}

function mapFrameToKey(i) {
    // 0 = Front?
    // 9 = Left?
    // Simple mapping:
    const keys = [
        'front', 'front_left', 'left', 'rear_left', 'rear',
        'rear_right', 'right', 'front_right', 'front_low', 'rear_low'
    ];
    return keys[Math.floor(i / 4)] || `angle_${i}`;
}

// ... Download Function ...
