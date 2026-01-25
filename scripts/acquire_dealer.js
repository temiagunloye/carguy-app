const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');

// Usage: node scripts/acquire_dealer.js <URL> <CAR_ID>
// Example: node scripts/acquire_dealer.js "https://www.carmax.com/car/..." porsche_911_custom

const targetUrl = process.argv[2];
const carId = process.argv[3] || 'scraped_car_' + Date.now();
const OUTPUT_DIR = path.join('output', 'scraped', carId);

if (!targetUrl) {
    console.error("❌ Usage: node scripts/acquire_dealer.js <URL> [CAR_ID]");
    process.exit(1);
}

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function run() {
    console.log(`🕵️‍♂️ Acquisition Agent starting...`);
    console.log(`🎯 Target: ${targetUrl}`);
    console.log(`qo Output: ${OUTPUT_DIR}`);

    const browser = await puppeteer.launch({
        headless: "new",
        defaultViewport: { width: 1920, height: 1080 }
    });
    const page = await browser.newPage();

    // Intercept Requests to find 360 logic
    const imageUrls = new Set();

    await page.setRequestInterception(true);
    page.on('response', async response => {
        const url = response.url();
        const request = response.request();
        if (request.resourceType() === 'image') {
            // Check size if possible
            const headers = response.headers();
            const size = parseInt(headers['content-length'] || '0');

            // Heuristic: Ignore tiny icons (< 5KB)
            if (size > 5000) {
                if (url.match(/(\d+)\.(jpg|png|webp)/) || url.includes('spin') || url.includes('360')) {
                    imageUrls.add(url);
                }
            }
        }
    });

    console.log("🌏 Navigating to page...");
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 });

    // Scroll to trigger lazy loading
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });

    // Wait a bit for spin interactions if needed
    console.log("⏳ Waiting for assets to load...");
    await new Promise(r => setTimeout(r, 5000));

    // Filter and Download
    const sortedUrls = Array.from(imageUrls).sort();
    console.log(`📸 Found ${sortedUrls.length} potential spin candidates.`);

    if (sortedUrls.length < 8) {
        console.warn("⚠️ Warning: Low image count. Might not have found the spin.");
    }

    let downloadCount = 0;
    // We want to capture enough to pick 10 angles later.
    // If we found a sequence, download it.

    for (let i = 0; i < sortedUrls.length; i++) {
        const url = sortedUrls[i];
        const ext = path.extname(new URL(url).pathname) || '.jpg';
        const filename = `${String(i).padStart(3, '0')}${ext}`;
        const dest = path.join(OUTPUT_DIR, filename);

        await downloadFile(url, dest);
        downloadCount++;
    }

    console.log(`✅ Acquisition Complete. Downloaded ${downloadCount} images.`);
    console.log(`👉 Next Step: Run 'npm run ingest:clean ${carId}' to remove backgrounds.`);

    await browser.close();
}

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, response => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', err => {
            fs.unlink(dest, () => { });
            reject(err.message);
        });
    });
}

run().catch(console.error);
