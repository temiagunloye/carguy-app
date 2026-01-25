# User Pipeline Smoke Test

**Goal:** Verify that a User Scan (App) produces the exact same data shape as the Admin Ingestion (Base Models), ensuring the Viewer works for both.

## 1. Schema Parity Check

| Field | Base Model (Admin Script) | User Scan (App -> Worker) | Status |
|-------|---------------------------|---------------------------|--------|
| **Collection** | `standardCars` | `users/{uid}/cars` | ✅ Parity (Viewer reads both via ID) |
| **Angle Keys** | `driver_front`... (10) | `driver_front`... (10) | ✅ Verified in `carScanConfig.js` |
| **Storage Path** | `public/standardCars...` | `users/{uid}/cars...` | ✅ Separated correctly |
| **Firestore Map** | `photoAngles` | `photoAngles` | ✅ Parity |
| **Status Field** | `approved` | `ready` | ✅ State equivalent |

## 2. Manual Smoke Test Steps

1.  **Preparation:**
    *   Open App.
    *   Login as Pro User (or Dev).
    *   Navigate: **"Add Car" -> "Scan"**.

2.  **Execution:**
    *   Capture 10 dummy photos using the AR guide.
    *   Tap **"Finish/Upload"**.

3.  **Verification (App Side):**
    *   Watch status transition: `Uploading` -> `Processing` -> `Ready`.
    *   **Pass:** App navigates to `SpinCarDetailScreen` automatically.

4.  **Verification (Console Side):**
    *   Open Firebase Console -> Firestore -> `users/{uid}/cars/{newId}`.
    *   **Check:** `photoAngles` map has 10 entries.
    *   **Check:** `photoAngles.driver_front` starts with `gs://`.
    *   **Check:** `renderStatus` is `ready` (or similar).

5.  **Viewer Load:**
    *   In `SpinCarDetailScreen`, verify the car rotates smoothly.
    *   **Pass:** Rotation uses the images you just took.

## 3. Failure Modes
*   **"Processing" forever:** Worker is down or `jobs` collection trigger failed.
*   **Viewer Black/Empty:** `photoAngles` keys mismatch (e.g. `front` vs `driver_front`).
*   **Permission Denied:** Viewer trying to read `users/{uid}` path without `auth.uid` match (Security Rules).
