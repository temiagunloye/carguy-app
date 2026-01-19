
import * as cheerio from "cheerio";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import * as puppeteer from "puppeteer";

// Initialize admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

interface ScrapeResult {
    title: string;
    price: number | null;
    currency: string;
    imageUrl: string | null;
    description: string;
}

async function scrapeUrl(url: string): Promise<ScrapeResult> {
    const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    // Set a realistic User-Agent to avoid detection
    await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

    try {
        await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
        const content = await page.content();
        const $ = cheerio.load(content);

        // Basic Metadata Extraction using OpenGraph tags (most reliable)
        const title = $('meta[property="og:title"]').attr("content") || $("title").text() || "Unknown Part";
        const imageUrl = $('meta[property="og:image"]').attr("content") || null;
        const description = $('meta[property="og:description"]').attr("content") || "";

        // Simple Price Heuristic (can be improved with specific selectors)
        let price: number | null = null;
        let currency = "USD";

        // Try structured data first (JSON-LD)
        $('script[type="application/ld+json"]').each((_, el) => {
            try {
                const data = JSON.parse($(el).html() || "{}");
                if (data["@type"] === "Product" || data["@type"] === "Offer") {
                    const offer = data.offers || data;
                    if (offer.price) price = parseFloat(offer.price);
                    if (offer.priceCurrency) currency = offer.priceCurrency;
                }
            } catch (e) {
                // ignore
            }
        });

        await browser.close();

        return { title, price, currency, imageUrl, description };

    } catch (error) {
        await browser.close();
        throw new Error(`Scraping failed: ${(error as Error).message}`);
    }
}

export const submitPartCandidate = functions.https.onCall(async (data, context) => {
    // 1. Validation
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    }
    const { url, carId } = data;
    if (!url) {
        throw new functions.https.HttpsError("invalid-argument", "URL is required.");
    }

    try {
        // 2. Scrape Data
        const scrapeData = await scrapeUrl(url);

        // 3. Create Candidate Document
        const candidateId = db.collection("partCandidates").doc().id;
        const candidateRef = db.collection("partCandidates").doc(candidateId);

        // Placeholder Logic: In the real system, we'd call the AI Service here.
        // For now, we'll create a "pending analysis" record or a simulated result.

        await candidateRef.set({
            id: candidateId,
            userId: context.auth.uid,
            carId: carId || null,
            sourceUrl: url,
            status: "analyzed", // Simulating instant analysis for now
            createdAt: admin.firestore.FieldValue.serverTimestamp(),

            metadata: {
                title: scrapeData.title,
                price: scrapeData.price,
                currency: scrapeData.currency,
                imageUrl: scrapeData.imageUrl,
                description: scrapeData.description
            },

            // SIMULATED AI RESULT (To be replaced by real AI call)
            analysis: {
                partType: "wheel", // Default assumption for demo
                style: "5_spoke",
                confidence: 0.85,
                visualCues: ["alloy", "silver", "5 lug"]
            },

            renderConfig: {
                placeholderAssetId: "wheel_aftermarket_01", // Maps to our local GLB
                scaleMode: "absolute",
                tempDimensions: { x: 500, y: 500, z: 200 }
            }
        });

        return { candidateId, success: true };

    } catch (error) {
        console.error("Submission failed:", error);
        throw new functions.https.HttpsError("internal", (error as Error).message);
    }
});
