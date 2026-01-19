# Testing Instructions: 10-Angle Rendering V1

This guide walks you through testing the new "Spin Viewer" and AI rendering pipeline locally.

## Prerequisites
- **Docker Desktop** installed and running.
- **Expo Go** app on your phone (or Simulator).

## Step 1: Start the Backend Services
We need to run the **Firebase Emulators** (database/functions) and the **GPU Worker** (Python service).

1.  Open your terminal in `carguy-app`.
2.  Run the following command:
    ```bash
    docker-compose up --build
    ```
3.  Wait until you see logs indicating services are ready:
    -   `gpu-worker_1  | Uvicorn running on http://0.0.0.0:8088`
    -   `firebase-emulator_1 | All emulators ready!`

## Step 2: Seed Demo Data
(If you haven't already)
1.  Open a new terminal tab (keep the first one running).
2.  Run:
    ```bash
    node scripts/seed_demo_data.js
    ```
    *Output should confirm: `Seeded car: Porsche 911`, etc.*

## Step 3: Run the App
1.  In the new terminal tab:
    ```bash
    npx expo start
    ```
2.  Scan the QR code with your phone.

## Step 4: Test the "Spin" Workflow
The new features are hidden behind navigation routes, as we haven't replaced the main UI yet. You might need to use a deep link or modify `App.js` temporarily to set `initialRouteName="SpinCarDetail"` if you can't reach them, **BUT** for now, try this flow if you have a way to navigate (or I can add a button for you):

**Scenario: Porsche 911 Job**
1.  **Navigate** to the 10-Angle Studio.
    *(If no button exists, ask me to add a temporary "Dev Menu" button to the Home Screen).*
2.  **Tap "Run Segmentation"**:
    -   This triggers `queueSegmentCar`.
    -   Watch your Docker logs! You should see the python worker processing images.
3.  **Tap "Create Build"**:
    -   Enters the Build Studio.
4.  **Tap "Add Paint"** (e.g., Blue):
    -   Updates the build doc.
5.  **Tap "Render Frames"**:
    -   Triggers `queueBuildFrames`.
    -   The worker composites the paint onto the car mask.
6.  **Verify**:
    -   The car in the viewer should turn **Blue** and you can swipe to rotate it 360°.

## Troubleshooting
-   **"Network Error"**: Ensure your phone is on the same Wi-Fi as your laptop.
-   **"Worker Error"**:Check the `docker-compose` logs.
-   **Git Push Error**: You don't have a remote repo set up (`origin`). You need to create a repo on GitHub/GitLab first and run `git remote add origin <url>`.
