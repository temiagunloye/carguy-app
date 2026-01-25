# Runbook: Base Model Ingestion

## 1. Setup
Ensure you have the repository checked out and `npm install` run.

## 2. Running the Pipeline (Simulation Mode)
This process acquires (simulated) Tier 1 assets, validates licenses, normalizes them, and uploads to Firebase.

```bash
# Step 1: Run the Acquisition and Policy check
# This generates output/simulation/*.jpg and storage_report.txt
node scripts/run_pipeline_simulation.js

# Step 2: Review Storage Estimate
cat output/simulation/storage_report.txt

# Step 3: Upload to Firebase
# This reads output/simulation/manifest.json and writes to Storage + Firestore
node scripts/upload_base_simulation.js
```

## 3. Verifying Results
1.  Check the Firebase Console -> Firestore -> `standardCars` collection.
2.  You should see documents for `porsche_911_2024`, `bmw_m3_2024`, etc.
3.  Each document should have `status: 'approved'` and a populated `photoAngles` map.
4.  Open the App/Web Viewer to see the cars.

## 4. Troubleshooting
*   **Error: "No manifest found":** You skipped Step 1.
*   **Error: "Permission denied":** Check `serviceAccountKey.json` or run `firebase login`.
*   **Error: "Policy Rejected":** Check `scripts/policy/source_tiers.js` to ensure the domain is allowed.
