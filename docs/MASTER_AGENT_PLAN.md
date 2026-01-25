# The Avengers: Master Agent Strategy

**Objective:** Create a scalable, "Forza-Style" vehicle database with uniform 360 reference photos.

## 🦸‍♂️ The Agent Team (Roles & Status)

### 1. Vision-Agent (The Renderer)
*   **Role:** Create perfectly uniform images from 3D models.
*   **Tool:** `scripts/blender/render_studio.py`
*   **Status:** **ACTIVE**. Can render 10 standard angles with controlled lighting.
*   **Output:** `output/renders/` (Transparent/White Background).

### 2. Acquisition-Agent (The Scraper)
*   **Role:** Find raw assets (Models or Clean Renders).
*   **Tool:** `scripts/acquire_images.js` (Puppeteer Scraper) & `scripts/download_models.js` (GLB Fetcher).
*   **Status:** **READY**. Can target known URLs or download sample models.
*   **Research:** Confirmed Carvana/CarMax use dynamic viewers; Insurance data is closed. **Strategy Pivot:** Focus on "Clean Stock" sites or Raw GLB Repos.

### 3. Shop-Agent (The Interface)
*   **Role:** Present the assets to the user.
*   **Tool:** **Web Simulator** UI.
*   **Status:** **DEPLOYED**. Supports:
    *   360 Rotation (Nav Arrows).
    *   Background Switching (Dark/Light/Studio).
    *   Real-Time Part Layering (CSS Transforms).

### 4. Data-Agent (The Architect)
*   **Role:** Organize the library.
*   **Tool:** `scripts/fix_placeholders.js` & Firestore Schema.
*   **Status:** **COMPLETE**. Schema defined in `docs/DATABASE_SCHEMA.md`.

---

## 🔮 Future Development & Research

### Alternative Acquisition Strategies
1.  **NeRF / Gaussian Splatting:**
    *   *Idea:* Scrape a YouTube walkaround video.
    *   *Tech:* Use Luma AI or Nerfstudio to reconstruct the 3D model.
    *   *Pros:* Unlimited source material (car reviews).
    *   *Cons:* High compute cost.

2.  **Generative AI (Stable Diffusion):**
    *   *Idea:* Use ControlNet to "hallucinate" the missing angles based on one photo.
    *   *Tech:* SDXL + IP-Adapter.
    *   *Pros:* Instant "Forza" look.
    *   *Cons:* Hallucinations (might invent fake parts).

3.  **Manufacturer Configurator Hacking:**
    *   *Idea:* Reverse engineer the "Build Your Own" API.
    *   *Status:* Mercedes API is OAuth protected. Porsche is encrypted.
    *   *Verdict:* High risk of breaking changes.

## 🚀 Deployment Checklist (Option A Execution)
1.  **Acquire:** Run `node scripts/download_models.js` (Gets Sample Porsche GLB).
2.  **Render:** Run `npm run ingest:render` (Creates the "Red Subaru" look).
3.  **Upload:** Run `npm run ingest:upload-render`.
4.  **Verify:** Check Simulator "Light Mode".
