# Acquisition Pipeline: Real Dealer Photos

**Goal:** Scrape 10 uniform angles from a specific dealer listing, remove the background, and upload to the simulator.

## Prerequisites
- Node.js (for Puppeteer)
- Python (for `rembg`)
- `pip install rembg[cli]` (User must run this)

## Workflow

1.  **Scrape:** `npm run ingest:scrape <URL>`
    -   Script: `scripts/acquire_dealer.js`
    -   Action: Opens the URL, detects a 360-spin viewer (CarMax/Carvana style), intercepts the image frames, selects 10 equidistant frames, downloads them.

2.  **Process:** `npm run ingest:clean`
    -   Script: `scripts/remove_background.py`
    -   Action: Iterates the scraped JPGs, runs `rembg` to make background transparent/white, converts to PNG.
    -   Output: `output/renders/{car_id}/`

3.  **Upload:** `npm run ingest:upload-render`
    -   Action: Pushes to Firebase.

## Mapping Angles
If the spin has 32 frames:
- Front: Frame 0
- Front-Left: Frame 4
- Left: Frame 8
- ...etc.

## Delivery
I will provide the scripts. You will simply find a car URL you like (e.g. a specific CarMax listing) and run the command.
