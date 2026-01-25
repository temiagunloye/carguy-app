# Admin Ingestion Guide (Standardized)

This guide explains how to add new Base Model cars to the CarGuy App.

## 1. Supported Workflows

We have standardized the ingestion process into three npm commands that handle policy, validation, upload, and AI processing.

| Command | Description |
|---------|-------------|
| `npm run ingest:simulate` | **(Step 1)** Downloads **Real Images** from Wikimedia (Tier 2 Legal) or placeholders if blocked. Checks Policy/Licenses. |
| `npm run ingest:upload` | **(Step 2)** Uploads assets to Firebase Storage and registers the car in Firestore. |
| `npm run ingest:process` | **(Step 3)** Queues AI Segmentation jobs. This generates the masks required for **Part Simulation** (swapping wheels, lowering, etc.). |

## 2. Adding a New Car

To add a new car (e.g. "Toyota Supra 2025"):

1.  **Edit Config:** Open `scripts/run_pipeline_simulation.js`.
2.  **Add Entry:** Add your car to the `DEMO_CARS` array:
    ```javascript
    { id: 'toyota_supra_2025', name: '2025 Toyota Supra', domain: 'pressroom.toyota.com' }
    ```
3.  **Run Simulation:**
    ```bash
    npm run ingest:simulate
    ```
4.  **Verify & Upload:**
    If the Storage Estimate looks good:
    ```bash
    npm run ingest:upload
    ```

## 3. Offline Support

The app is configured with **Offline Persistence**.
*   **Viewing:** Users can view previously loaded cars without internet.
*   **Customizing:** Part swaps work offline if the assets were cached.
*   **Scanning:** Users can capture photos offline. The upload will queue (retry on connection) or fail gracefully depending on the exact network state, but the session data is saved locally.

## 4. Troubleshooting

*   **Policy Rejection:** Ensure the domain in `DEMO_CARS` is listed in `scripts/policy/source_tiers.js`.
*   **Missing Assets:** If `ingest:simulate` fails to download, it falls back to a placeholder. For production, manually replace the images in `output/simulation/{carId}/` before running `ingest:upload`.
