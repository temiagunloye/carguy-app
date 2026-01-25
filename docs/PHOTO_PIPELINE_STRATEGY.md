# Photo Pipeline Strategy: "Capture to Showcase"

## Executive Summary
This strategy outlines the most efficient pathway to ingest car photos, process them into 3D-ready assets, and verify them across both the Mobile App and the Website. We will leverage existing components (CarScan, Firestore) and introduce a unified asset handling integration.

---

## 1. Data & Storage Structure (The Foundation)
We will strictly adhere to the schema defined in `FIREBASE_SCHEMA.md` to ensure consistency between App, Web, and Backend.

### Storage Hierarchy
```
/public
  /standardCars
    /{carId}
      /primary_angles/      <-- The 10 canonical shots
        front.webp
        front_driver_45.webp
        ...
      /variants/            <-- Future: Color variants
```

### Firestore Document (`standardCars/{carId}`)
```json
{
  "status": "draft",
  "photoAngles": {
    "front": "gs://...",
    "front_driver_45": "gs://..."
  },
  "rendering": {
    "status": "READY",
    "modelUrl": "gs://...result.glb"
  }
}
```

---

## 2. Ingestion Strategy (The "Input")
**Goal:** Easy, high-quality data entry.

### Primary Path: The Mobile App (Existing)
*   **Tool:** `CarScanCaptureScreen.js`
*   **Action:** This is already built. We will use this as the *exclusive* tool for capturing "Dealer Quality" scans.
*   **Enhancement:**
    *   Ensure the upload logic (lines 358-382 in `CarScanCaptureScreen.js`) correctly sets the `photoAngles` map in Firestore.
    *   **No Code Change Needed:** The current implementation appears correct for V1.

### Secondary Path: Admin Script (Bulk)
*   **Tool:** `scripts/ingest-parts-web.js` (adapted for cars)
*   **Use Case:** Uploading existing professional photo sets from disk.
*   **Strategy:** Create a new script `scripts/ingest-car-photos.js` that takes a folder of images, matches them to the 10-angle names, and bulk uploads to Storage + Firestore.

---

## 3. Processing Pipeline (The "Black Box")
**Goal:** Convert 2D Photos -> Segmentation Masks -> 3D/2.5D Model.

1.  **Trigger:** App calls `queueSegmentCar` (Cloud Function) or writes to `jobs` collection.
2.  **Engine:** `gpu-worker` (Docker Container).
3.  **Process:**
    *   Listens for `jobs` (Type: `SEGMENT_CAR`).
    *   Downloads photos from `photoAngles`.
    *   Runs Keypoint Detection + Segmentation (already in `gpu-worker` logic).
    *   Uploads Masks to `.../masks/` in Storage.
    *   Updates Firestore doc with `maskUrls`.

---

## 4. Visualization Strategy (The "Output")

### A. Mobile App (Reviewer)
*   **Component:** `SpinCarDetailScreen` (Fixed in previous task).
*   **Logic:**
    *   Read `photoAngles` from Firestore.
    *   Overlay `masks` (if available) to verify segmentation.
    *   **Action:** Continue using this screen as the "QA Dashboard" to verify uploads look good.

### B. Website (Showcase)
*   **Current State:** The website is a static landing page with NO viewer.
*   **Strategy:** Implement a "Build Showcase" page.
*   **Implementation:**
    1.  Create `viewer.html` in the website folder.
    2.  Use **Google's `<model-viewer>`** or a simple **Three.js** canvas for 3D GLB support.
    3.  **Critical Integration:** Use the Firebase Web SDK (lite) on the frontend to read the *same* Firestore documents as the app.
    4.  **Flow:** URL param `?carId=porsche_911` -> Fetch Doc -> Get `modelUrl` (or photos) -> Display.

---

## 5. Part Swapping Integration
**Goal:** "Add parts and see them show up."

1.  **Ingest Parts:** Use `scripts/ingest-parts-web.js` to upload GLB parts (Wheels, Lips).
2.  **Registration:** Ensure parts have `defaults` (anchors) set in Firestore (e.g., "relativeToWheelAnchors").
3.  **The "Build" Job:**
    *   User selects Part in App -> Writes to `activeBuild`.
    *   Backend (`gpu-worker`) detects change -> Runs `BUILD_FRAMES` job.
    *   **Logic:** Backend composites [Car Photo] + [Part Render] using the camera angles derived from the "Scan".
    *   **Result:** Updates `builds/{buildId}` with `frameUrls`.
4.  **View:** App/Web simply display the resulting images from `frameUrls`.

---

## Summary of Next Steps (Pathway)
1.  **Verify Uploads:** Use the App to scan 1 car fully. Check Firestore to see if `photoAngles` are correct.
2.  **Verify Pipeline:** Ensure `gpu-worker` picks up the job and generates masks.
3.  **Create Web Viewer:** Build a simple JS page to load a car by ID from Firestore.
