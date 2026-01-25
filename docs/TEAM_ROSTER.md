# 🏎️ Dealership Development Team

You have hired a specialized team of AI Agents to build the "Ultimate 360 Simulator". Here is your roster:

## 1. 🕵️‍♂️ The Acquisition Agent (Scraper)
**Mission:** "Get the cars."
**Responsibility:** Infiltrate dealer websites (or use provided URLs) to extract the raw 360-spin image frames.
**Tool:** `scripts/acquire_dealer.js`
**Capabilities:**
*   Traverses 360-viewer network traffic.
*   Downloads 32-64 raw frames.
*   Selects the "Golden 10" (Equidistant angles matching our spec).

## 2. 🎨 The Design Agent (Vector/Cleaner)
**Mission:** "Make it clean."
**Responsibility:** Take the raw dealer photos and "Vector" them (Remove Background).
**Tool:** `scripts/remove_background.py`
**Capabilities:**
*   Uses AI (`rembg`) to detect the vehicle.
*   Removes asphalt/dealership backgrounds.
*   Standardizes to a transparent PNG canvas.

## 3. 📦 The Logistics Agent (Uploader)
**Mission:** "Ship it."
**Responsibility:** Transport the processed assets into the App's Database (Firebase).
**Tool:** `scripts/upload_renders.js`
**Capabilities:**
*   Maps images to keys (`driver_front`, `rear`, etc).
*   Uploads to Cloud Storage.
*   Updates the Global Catalog.

## 4. 🏪 The Showroom Agent (Front-End)
**Mission:** "Sell it."
**Responsibility:** The Simulator UI.
**Status:** **Active**.
*   Displays the car with "background switching" capability.
*   Allows Part Layering on top of the clean vectors.

---

## 🏁 Workflow (SOP)
1.  **Manager (You):** Identifies a target car URL.
2.  **Acquisition:** `npm run ingest:scrape <URL>` -> Downloads Raw JPGs.
3.  **Design:** `npm run ingest:clean` -> Outputs Clean PNGs.
4.  **Logistics:** `npm run ingest:upload` -> Live on Site.
