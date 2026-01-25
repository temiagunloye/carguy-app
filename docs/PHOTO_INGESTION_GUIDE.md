# Photo Ingestion Strategy & Guide

This document defines the strict pathways for getting 10-angle photo sets into Firebase so they work with the Segmentation & Rendering pipeline.

## 1. The Two Creation Pathways

We distinguish between **"Base Content"** (Free Tier demos like the 911/M3) and **"User Content"** (Pro/Premium scans).

### Pathway A: Base Model Injection (Admin/Dev)
*   **Use Case:** Populating the "Free Tier" cars that all users see immediately.
*   **Strategy:** Automated Script Injection.
*   **Why:** You likely have high-quality, professional photos for these base models (maybe even renders from Blender). You don't want to "scan" them manually with a phone.

### Pathway B: User Scan (App)
*   **Use Case:** Pro users adding their own vehicle.
*   **Strategy:** Mobile App Flow.
*   **Why:** Only the user has access to their physical car.

---

## 2. Implementation details (How to execute)

### A. Implementing Base Model Ingestion (Admin)

**Pre-requisite:**
You need a folder structure on your computer with the photos.
```
/assets/base-swaps/
  /porsche_911_2024/
    front.jpg
    front_driver_45.jpg
    ... (all 10 angles)
  /bmw_m3_2023/
    ...
```

**The Recommended Script Logic:**
Do not use `seed_demo_images.js` (it uses fake Unsplash URLs). Instead, create `scripts/upload-base-photos.js` that does the following:

1.  **Iterate** folders in `/assets/base-swaps/`.
2.  **Match** filenames to the canonical angle list:
    *   `front`, `front_driver_45`, `driver`, `rear_driver_45`, `rear`, `rear_passenger_45`, `passenger`, `front_passenger_45`, `top_front`, `top_rear`.
3.  **Upload** each file to Storage:
    *   Path: `public/standardCars/{car_id}/primary_angles/{angle_name}.jpg`
4.  **Register** in Firestore:
    *   Doc: `standardCars/{car_id}`
    *   Field: `photoAngles.{angle_name}` = `gs://bucket/...` (Storage Path)
    *   Field: `photoAnglesHttp.{angle_name}` = `https://...` (Download URL)

**Once run, these cars are "Live" and ready for the pipeline.**

---

### B. Implementing User Ingestion (App)

**Current Status:**
The app's `CarScanCaptureScreen.js` handles this.

**Flow:**
1.  **User Captures:** App guides user through 10 angles.
2.  **Upload:** App uploads raw photos to `users/{uid}/cars/{carId}/raw/{angle}.jpg`.
3.  **Trigger:** App writes to `photoAngles` in Firestore.
4.  **Pipeline:** The `gpu-worker` listens to this document update -> Downloads Raw -> Segments -> Updates Document.

**Requirement:**
Ensure the App uses the **exact same angle keys** as the Admin script (matches schema).

---

## 3. Storage Hierarchy Standard

To ensure the "Viewer" works for both Base and User cars, both pathways MUST end up putting data in the same structure in Firestore:

**Firestore Document Structure:**
```json
// standardCars/porsche_911 OR users/123/cars/my_porsche
{
  "angles": [
    {
      "angleIndex": 0,
      "name": "front_driver_45",
      "imageUrl": "gs://...",
      "httpUrl": "https://..."
    },
    ...
  ]
}
```

## 4. Verification

1.  **Admin:** Run your new upload script. Open App -> Initial Car -> Verify 10 angles load.
2.  **User:** Scan specific car. Verify "Processing" changes to "Ready".

This strategy ensures that the "Free" cars look professional (high-res uploads), while the "Pro" cars work seamlessly from the camera.
