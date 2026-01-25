# EXECUTION PLAN — Legal Web Sourcing & Photo Pipeline

## Milestones & Owners

| Milestone | Description | Owner | Output |
|-----------|-------------|-------|--------|
| **M1** | **Repo Discovery & Alignment** | Repo-Agent | `CURRENT_STATE.md`, Alignment on angle keys & specific file paths. |
| **M2** | **Policy & Legal Gate** | Policy-Agent | `policy/` module (tiers, robots, licenses), `POLICY.md`. |
| **M3** | **Acquisition & Vision** | Acq-Agent, Vision-Agent | Candidate JSONs per car, Selected/Labeled 10-angle sets in `output/selected/`. |
| **M4** | **Normalization & Storage Prep** | Media-Agent, Firebase-Agent | Normalized local assets, **Storage Estimate Report**, ready for upload. |
| **M5** | **Upload & Firestore Write** | Firebase-Agent | Assets in `public/standardCars`, Firestore docs updated with `approved` status. |
| **M6** | **User Pipeline Verification** | UserFlow-Agent | `USER_PIPELINE_SMOKE.md`, verified raw-to-processed flow for user scans. |
| **M7** | **Viewer Integration & QA** | Viewer-Agent, QA-Agent | Working viewer (App/Web), `QA_CHECKLIST.md`, `RUNBOOK.md`. |

## Agent Task Board

### 1. Repo-Agent (Current)
- [ ] Map `firebase.json`, `.firebaserc`.
- [ ] Extract angle keys from `CarScanCaptureScreen.js`.
- [ ] Identify gpu-worker triggers.
- [ ] Produce `CURRENT_STATE.md`.

### 2. Policy-Agent
- [ ] Create `policy/source_tiers.ts`.
- [ ] Create `policy/robots_checker.ts`.
- [ ] Create `policy/license_gate.ts`.

### 3. Acq-Agent & Vision-Agent
- [ ] Script: `scripts/find_candidates.ts`.
- [ ] Script: `scripts/select_angles.ts`.
- [ ] Run for: 911, M3, BRZ, C63, RS6.

### 4. Media-Agent & Firebase-Agent
- [ ] Script: `scripts/normalize.ts`.
- [ ] Script: `scripts/estimate_storage.ts`.
- [ ] Script: `scripts/upload_base.ts`.
- [ ] **CRITICAL:** Print estimate before upload.

### 5. UserFlow-Agent
- [ ] Verify `CarScanCaptureScreen.js` compatibility.
- [ ] Smoke test user upload flow.

### 6. Viewer-Agent
- [ ] Update `Viewer360Component.tsx`.
- [ ] Create web viewer proof-of-concept.

---

## Global Constraints Checklist
- [ ] Storage Estimate printed?
- [ ] Robots.txt obeyed?
- [ ] Licenses verified?
- [ ] Angle keys match?
