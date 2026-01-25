# QA Checklist

## 1. Ingestion Verification
- [x] **Storage Estimate:** Printed before upload in `run_pipeline_simulation.js`.
- [x] **License Gate:** Verified "Tier 1" sources result in `approved`.
- [x] **Completeness:** Use `node scripts/upload_base_simulation.js` confirm 5 cars uploaded.
- [ ] **Visual Check:** Open App/Web Viewer. Confirm cars load (even if they are placeholders).

## 2. Viewer Contract
- [ ] **Angle Order:** Verify rotation is smooth (Front -> Quarter -> Side).
- [ ] **Mismatch Handling:** Ensure Viewer doesn't crash if an angle is missing (should verify 10/10 in ingest).

## 3. Policy Compliance
- [ ] **Non-Commercial:** Manually verify no 'NC' licenses in `standardCars`.
- [ ] **Rate Limits:** Ensure scripts respect 1s delay (baked into `run_pipeline_simulation` logic if loop was slower, otherwise standard Fetch behavior).

## 4. Reset Procedure
To reset:
1. Delete `output/simulation` folder.
2. Delete `standardCars` docs in Firestore.
3. Re-run Runbook.
