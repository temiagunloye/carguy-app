# Agent Task List: End-to-End Build Simulation

This document outlines the tasks for our agent team to implement the full "Build Simulation" pipeline, moving from Static Viewing to Dynamic Customization.

## 1. Vision-Agent (Backend AI)
**Goal:** Generate "Masks" for every car to enable part swapping.
- [ ] **Implement Worker Consumer:** Write the Python/Node worker for `SEGMENT_CAR` jobs.
- [ ] **Model Integration:** Use SAM (Segment Anything Model) or fine-tuned UNet to detect:
    - `car_body` (for lowering/wrapping)
    - `wheels_front`, `wheels_rear` (for swapping)
    - `windows` (for tinting)
- [ ] **Output Storage:** Save masks to `standardCars/{id}/running/masks/{angle}_{maskType}.png`.
- [ ] **Firestore Update:** Update `standardCars/{id}` with `masksAvailable: true`.

## 2. Shop-Agent (Web Portal)
**Goal:** Enable "Tailoring" on the Body Shop Simulator.
- [ ] **Layered Rendering:** Update `visualizer.js` to render a `<canvas>` instead of `<img>`.
- [ ] **Compositor:** Implement `composeFrame(baseImage, masks, parts)` function.
    - Draw Base Car.
    - If "Lowered": Shift Body Mask Y+20px.
    - If "New Wheels": Draw Wheel PNGs at `wheel_center` metadata coordinates.
- [ ] **Part Fetcher:** Connect "Installed Parts" checkboxes to the `parts` collection in Firestore.

## 3. App-Agent (Mobile)
**Goal:** Parity for Custom Builds.
- [ ] **Sync Logic:** Ensure `SpinCarDetailScreen` uses the same `composeFrame` logic (using Expo Canvas or Skia).
- [ ] **Save Build:** Implement `saveBuild(configuration)` which writes to `users/{uid}/builds`.
- [ ] **Shared Link:** Generate deep link `carguy://build/{buildId}`.

## 4. Acq-Agent (Data Pipeline)
**Goal:** Scale the library.
- [ ] **Automated Crawler:** Expand `run_pipeline_simulation.js` to crawl top 50 enthusiast cars.
- [ ] **Proxy Integration:** Add rotation proxies to avoid 403s on larger scales.
- [ ] **Metadata Enrichment:** Auto-fetch Year/Make/Model specs (HP, Weight) and add to Firestore.

## 5. Deployment-Agent (Ops)
**Goal:** Continuous Delivery.
- [ ] **CI/CD:** Setup GitHub Actions to run `ingest:simulate` -> `ingest:upload` on a schedule (Weekly updates).
- [ ] **Monitoring:** Alert on failed jobs in `jobs` collection.
