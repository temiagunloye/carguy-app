# Task Tree: Body Shop Integration

**Goal:** Enable "Body Shops" to import Base Models (Porsche, BMW, etc.) and simulate builds using the same pipeline as the App.

- [ ] **1. Standard Car Fetcher (Shop Access)**
    - [ ] Update `website/shop/simulator.html` JS to fetch `standardCars` collection.
    - [ ] Populate `<select id="vehicle-selector">` with the real cars (Porsche, BMW...).
- [ ] **2. Viewer Integration (Shop Simulator)**
    - [ ] Port the **360 Logic** from `website/js/viewer.js` into `website/js/visualizer.js`.
    - [ ] Replace static `<img>` canvas with the interactive 360 spinner.
    - [ ] Ensure "Configuration" -> "Vehicle" change re-loads the 360 spinner for the new car.
- [ ] **3. Part Simulation (Masking)**
    - [ ] Update logic to overlay "Part Images" (Wheels/Lowering) on top of the 360 canvas.
    - [ ] *Note: This requires the GPU Worker to have finished `SEGMENT_CAR` jobs and written `masks` to Firestore. We will implement the CLIENT logic to read/display them.*
- [ ] **4. Build Persistence**
    - [ ] Implement `saveBuild()` to write to `shopBuilds` (or `builds`) collection.
    - [ ] Ensure schema compatibility with the App (so a user can open a Shop Link in their App).
- [ ] **5. Verification**
    - [ ] Test the full loop: Select Car -> Spin -> Select Part -> Save -> Share.
