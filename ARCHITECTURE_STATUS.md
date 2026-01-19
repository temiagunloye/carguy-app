# Architecture Status & Pipeline Definition

**Status:** ACTIVE
**Date:** 2026-01-19
**Runtime:** Universe B (10-Angle 2D Spin)

---

## 🛑 Universe A: Realtime 3D (LEGACY)
**Status:** **DEPRECATED / OFFLINE**
*   **Description:** The old system that tried to render `.glb` files directly on mobile devices using Three.js and attach 3D parts to anchor points.
*   **Components:** `CarModelViewerScreen`, `Viewer360Component` (old version), 3D Anchor System.
*   **Usage Rule:** DO NOT USE IN PRODUCTION RUNTIME. Code is retained only as "Source Material" to optionally generate input frames for the new system.
*   **Routes:** Removed from active navigation.

---

## 🟢 Universe B: 10-Angle Spin (PRODUCTION)
**Status:** **PRIMARY RUNTIME**
*   **Description:** A 2D image-based compositing engine.
    *   **Input:** 10 photos of a car (User Upload or Demo Source).
    *   **Processing:** Docker/Python Worker uses AI (`rembg`) to segment car from background.
    *   **Rendering:** Worker composites part images onto the segmented car frames.
    *   **Output:** 10 new JPEGs ("RenderSet") displayed in a 360 swipe viewer.
*   **Components:**
    *   **Frontend:** `SpinViewer` (UI), `SpinCarDetailScreen`, `SpinBuildScreen`.
    *   **Backend:** `gpu-worker` (FastAPI + rembg), Firebase Functions (`queueSegmentCar`, `queueBuildFrames`).
    *   **Data:** `jobs` collection, `cars/{id}/angles` subcollection.

---

## 📂 Folder Map

| Path | Universe | Status |
| :--- | :--- | :--- |
| `src/components/SpinViewer.tsx` | **B** | **Active Core** |
| `src/screens/SpinCarDetailScreen.tsx` | **B** | **Active** (Upload/Segment) |
| `src/screens/SpinBuildScreen.tsx` | **B** | **Active** (Render/Apply) |
| `gpu-worker/` | **B** | **Active Backend** |
| `functions/src/renderJobs/` | B | Active (Job Triggers) |
| `src/screens/CarModelViewerScreen.js` | A | **Legacy** (Do Not Link) |
| `src/services/AnchorService.js` | A | **Legacy** |

## 🔄 Data Pipeline (Universe B)
1.  **Capture:** User uploads 10 images -> `storage/users/{uid}/cars/{carId}/uploads/angle_{i}.jpg`.
2.  **Job:** `queueSegmentCar` -> Firestore Job -> GPU Worker.
3.  **Worker:** Downloads 10 jpgs -> AI Removal -> Uploads `masks/angle_{i}.png`.
4.  **Render:** User adds part -> `queueBuildFrames` -> Worker Composites -> Uploads `renders/{set}/angle_{i}.jpg`.
5.  **View:** App downloads cached render set -> specific URLs.
