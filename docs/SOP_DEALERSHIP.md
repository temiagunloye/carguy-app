# 📘 Dealership SOP: The Acquisition Pipeline

**Objective:** Produce uniform, high-accuracy 360-degree vehicle assets for the specific dealership inventory.
**Philosophy:** Accuracy > Speed. Do not upload low-quality or mismatched angles.

---

## 🏗️ Phase 1: Acquisition (The Scraper)

**Goal:** Capture high-resolution raw frames from a dealer's 360-viewer.

1.  **Scout the Target:**
    -   Navigate to the dealer website (e.g., CarMax, Carvana, or a generic dealer site using SpinCar).
    -   Verify the listing has a functioning **360 Exterior Generic Spinner**.
    -   Copy the URL.

2.  **Run the Agent:**
    ```bash
    # Syntax: npm run ingest:scrape "<URL>" <UNIQUE_CAR_ID>
    npm run ingest:scrape "https://www.carmax.com/car/12345" my_test_car
    ```

3.  **Verify Quality:**
    -   Check `output/scraped/my_test_car/`.
    -   ensure there are **32-64 images**.
    -   Ensure they are **High Resolution** (not tiny thumbnails).
    -   If scraping failed, try a different dealer site or Inspect Element to find the direct image source.

---

## 🎨 Phase 2: Design (The Vectorizer)

**Goal:** Isolate the vehicle on a transparent background with perfect edge detection.

1.  **Prepare AI:**
    -   Ensure Python is installed.
    -   `pip install rembg[cli] pillow`

2.  **Run the Agent:**
    ```bash
    npm run ingest:clean my_test_car
    ```
    *Note: This script uses `rembg` with alpha-matting enable for accurate glass/tire edges.*

3.  **Verify Accuracy:**
    -   Check `output/renders/my_test_car/`.
    -   Open `front.png`, `side.png`.
    -   **Critical Check:** Are the wheels clean? Is the shadow natural? (The script attempts to keep soft shadows).

---

## 📦 Phase 3: Logistics (The Upload)

**Goal:** Map the files to the Simulator's expected keys.

1.  **Configure:**
    -   No configuration needed! The **Logistics Agent** automatically scans `output/renders/` for any new folders.

2.  **Run the Agent:**
    ```bash
    npm run ingest:upload-render
    ```
    *It will see `my_test_car` and upload it automatically.*

3.  **Final Verification:**
    -   Open the Simulator.
    -   Check the **Debug Overlay**.
    -   Confirm "Status: LOADED" and the angles match the rotation arrows.

---

## 🚨 Troubleshooting
-   **"No Spin Found":** The scraper relies on standard naming conventions. Some custom dealer sites obfuscate URLs.
-   **"Edges look jagged":** Increase the alpha-matting parameters in `remove_background.py`.

---

## 🎨 Phase 4: Creative (The AI Generator)

**Goal:** "Hallucinate" the perfect studio renders using OpenAI DALL-E 3 (No scraping required).

1.  **Prepare:**
    -   Get an OpenAI API Key.
    -   `export OPENAI_API_KEY=sk-...`

2.  **Run the Agent:**
    ```bash
    # Syntax: npm run ingest:generate "<Year Make Model>"
    npm run ingest:generate "2024 BMW M3 Competition"
    ```

3.  **Result:**
    -   The agent reads `assets/prompts/studio_angles.json`.
    -   Generates 10 uniform studio angles.
    -   Saves to `output/renders/bmw_m3_competition`.

4.  **Upload:**
    -   Run `npm run ingest:upload-render`.
    -   The new car appears in the Simulator immediately.
