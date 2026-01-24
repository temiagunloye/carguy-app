# 2D Pipeline & Docker Workflow Guide

This document outlines the workflow for running the 2D rendering pipeline, testing features, and troubleshooting connectivity issues between the physical device (iOS) and the Docker backend.

## 1. Environment Setup (Critical Fixes)

We executed several critical fixes to establish connectivity. If you reset the project, ensure these matching configurations exist:

### A. Docker Configuration (`docker-compose.yml`)
*   **Project ID Mismatch:** Ensure `FIREBASE_PROJECT_ID` matches your client config (`carguy-app-demo`).
*   **Command Syntax:** The `firebase emulators:start` command must be single-line or properly escaped to prevent "command not found" errors (Exit 127).

### B. Physical Device Connectivity (`src/services/firebaseConfig.js`)
*   **Local IP:** Physical phones cannot connect to `localhost`.
*   **Fix:** We hardcoded the host IP (e.g., `192.168.5.55`) in the `__DEV__` configuration block.
*   **Verification:** Run `ifconfig` to find your current computer IP and update `firebaseConfig.js` if you move networks.

### C. iOS Security (`app.json`)
*   **ATS:** Added `NSAppTransportSecurity` / `NSAllowsArbitraryLoads: true` to allow HTTP traffic to the local emulator.

---

## 2. Boot Sequence

Always follow this order to ensure a stable environment:

1.  **Clean Start Docker:**
    ```bash
    docker compose down
    docker compose up --build
    ```
    *Wait until logs show "All emulators ready".*

2.  **Start Expo:**
    ```bash
    npx expo start --clear
    ```

3.  **Launch on Device:**
    *   Ensure Phone is on same Wi-Fi.
    *   Scan QR code or reload via development build.

---

## 3. Testing the 2D Pipeline

### Step 1: Ingest Parts (Scripts)
Upload raw GLB parts to Firebase Storage/Firestore.
```bash
node scripts/ingest-parts-web.js
```

### Step 2: Trigger Segmentation (App or Console)
*   **In User App:** Navigate to **Home -> Start Building -> [Select Demo Car]**.
*   **Action:** Tap "Run Segmentation" (if visible in debug UI) or use the Firebase Console to create a job manually.
*   **Manual Trigger:**
    *   Create doc in `jobs` collection.
    *   Fields: `{ type: "SEGMENT_CAR", ownerId: "test", input: { carId: "porsche_911_2024" } }`

### Step 3: Create Build / Swap Parts
*   **Action:** Tap "Create Build" in the app or manually create a job.
*   **Manual Trigger:**
    *   Create doc in `jobs` collection.
    *   Fields: `{ type: "BUILD_FRAMES", ownerId: "test", input: { buildId: "demo_build_id" } }`

---

## 4. Troubleshooting

**Error:** `Network request failed`
*   **Check:** Is phone on same Wi-Fi?
*   **Check:** Did your laptop IP change? Update `firebaseConfig.js`.
*   **Check:** Is Docker running? (Run `docker ps`).

**Error:** `Container exited with code 127`
*   **Cause:** Syntax error in `docker-compose.yml` command.
*   **Fix:** Flatten the command to a single line.
