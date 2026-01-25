# Current Repository State (Milestone 1)

## 1. Firebase Configuration
*   **Project ID:** `carguy-app-demo` (from `.firebaserc`)
*   **Functions:** Type `onDocumentCreated`, monitoring `jobs/{jobId}`.
*   **Emulators:** Auth (9099), Firestore (8080), Storage (9199).
*   **Storage Bucket:** `carguy-app-demo.firebasestorage.app`

## 2. Canonical Angle Keys
Source: `src/features/carScan/carScanConfig.js`

| Key | Description |
|-----|-------------|
| `driver_front` | Front - Driver Side (45°) |
| `passenger_front` | Front - Passenger Side (45°) |
| `driver_rear` | Rear - Driver Side (45°) |
| `passenger_rear` | Rear - Passenger Side (45°) |
| `full_driver_side` | Full Driver Side |
| `full_passenger_side` | Full Passenger Side |
| `front_center` | Front Center |
| `rear_center` | Rear Center |
| `front_low` | Front Low (Bumper) |
| `rear_low` | Rear Low (Bumper) |

**Total:** 10 Mandatory Angles.

## 3. Worker Triggers (Contract)
*   **Trigger:** Firestore Document Create in `jobs/` collection.
*   **Job Types:**
    *   `SEGMENT_CAR`: Input `{ carId: string }`
    *   `MAKE_PART_ASSET`: Input `{ partId: string }`
    *   `BUILD_FRAMES`: Input `{ buildId: string }`
*   **Worker URL:** `http://host.docker.internal:8088` (Docker networking).

## 4. Existing Seeds
*   `scripts/seed_demo_images.js` (Prototype, uses Unsplash).
*   `scripts/upload-demo-cars-web.js` (3D GLB Pipeline).

## 5. Storage Paths (Target vs Current)
*   **Target:** `public/standardCars/{carId}/primary_angles/{angle}.jpg`
*   **Current App:** `users/{uid}/cars/{carId}/raw/{angle}.jpg`
*   **Action:** Base models must use the `public/` path. User models use the `users/` path, but the Viewer must handle both.
