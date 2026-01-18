# Phase 2: Part Swapping System Design

## Overview
Design a scalable anchor-based part swapping system that allows runtime attachment/detachment of aftermarket parts (wheels, spoilers, bumpers, exhausts, etc.) to the 3 demo base models without requiring full model reload.

---

## Core Architecture: Anchor-Based System

### Why Anchors?
- **Scalability**: Add new parts without modifying base models
- **Flexibility**: Parts can fit multiple car models with same anchor types
- **Performance**: Attach/detach parts without reloading entire GLB
- **Maintainability**: Anchors live with models (single source of truth)

### Anchor Strategy

**Anchors are Empty Objects embedded in GLB files**, not Firestore JSON.

**Rationale**:
- Anchors travel with the model (no sync drift)
- Runtime discovery via GLB scene graph traversal
- Blender empties export cleanly to glTF
- Position/rotation transforms preserved
- Zero additional network requests

---

## Anchor Naming Convention

### Standard Nomenclature
```
ANCHOR_<CATEGORY>_<POSITION>_<SIDE>

Examples:
ANCHOR_WHEEL_FL          (Front-Left Wheel)
ANCHOR_WHEEL_FR          (Front-Right Wheel)
ANCHOR_WHEEL_RL          (Rear-Left Wheel)
ANCHOR_WHEEL_RR          (Rear-Right Wheel)
ANCHOR_SPOILER_REAR      (Rear Spoiler Mount)
ANCHOR_EXHAUST_TIP_L     (Left Exhaust Tip)
ANCHOR_EXHAUST_TIP_R     (Right Exhaust Tip)
ANCHOR_HEADLIGHT_L       (Left Headlight)
ANCHOR_HEADLIGHT_R       (Right Headlight)
ANCHOR_TAILLIGHT_L       (Left Taillight)
ANCHOR_TAILLIGHT_R       (Right Taillight)
ANCHOR_BUMPER_FRONT      (Front Bumper Mount)
ANCHOR_BUMPER_REAR       (Rear Bumper Mount)
ANCHOR_DIFFUSER_REAR     (Rear Diffuser Mount)
ANCHOR_SKIRT_L           (Left Side Skirt)
ANCHOR_SKIRT_R           (Right Side Skirt)
ANCHOR_MIRROR_L          (Left Mirror)
ANCHOR_MIRROR_R          (Right Mirror)
ANCHOR_HOOD_CENTER       (Hood Center)
ANCHOR_ENGINE_BAY        (Engine Bay Visual - optional)
```

### Suspension (Special Case)
Suspension affects ride height, not direct mesh replacement.

**Approach**: 
- Store `rideHeightOffset` as metadata (e.g., `-2.5cm` for lowering springs)
- At runtime, apply vertical offset to body group OR wheels group
- No anchor needed, just transform adjustment

---

## Anchor Placement Per Base Model

### Porsche 911 (81k tris)
- **Wheels**: 4 anchors (FL/FR/RL/RR) - positioned at wheel centers
- **Spoiler**: 1 anchor (REAR) - rear deck lid center
- **Exhaust**: 2 anchors (L/R) - dual tips at bumper cutouts
- **Bumpers**: 2 anchors (FRONT/REAR) - centerline at mounting points
- **Skirts**: 2 anchors (L/R) - midpoint along rocker panels
- **Lights**: 4 anchors (HEADLIGHT_L/R, TAILLIGHT_L/R)
- **Diffuser**: 1 anchor (REAR) - lower rear center
- **Hood**: 1 anchor (CENTER) - hood latch point
- **Mirrors**: 2 anchors (L/R) - door mirror mounts

**Total**: ~19 anchors

### BMW M3 (69k tris)
- Same anchor set as Porsche 911
- Adjust positions for G80 body proportions

### Subaru BRZ (56k tris)
- Same anchor set
- Adjust positions for compact coupe dimensions

---

## Part GLB Structure

### Part Assets Storage
```
gs://carguy-app-demo.firebasestorage.app/models/parts/
  ├── wheels/
  │   ├── hre_p101_v1.glb           (Single wheel, cloned 4x)
  │   ├── bbs_lm_v1.glb
  │   └── enkei_rpf1_v1.glb
  ├── aero/
  │   ├── gt_wing_universal_v1.glb  (Rear wing/spoiler)
 │   ├── front_splitter_v1.glb
  │   └── duck_tail_spoiler_v1.glb
  ├── exhaust/
  │   ├── akrapovic_tips_v1.glb     (Pair of tips, or single cloned 2x)
  │   └── titanium_quad_tips_v1.glb
  ├── bumpers/
  │   ├── m_sport_front_v1.glb
  │   └── aggressive_rear_v1.glb
  ├── lights/
  │   ├── led_headlight_v1.glb
  │   └── smoked_taillight_v1.glb
  └── paint/
      └── <no GLB, just material JSON>
```

### Part Metadata (Firestore `parts` Collection)
```typescript
{
  partId: "hre_p101_wheels",
  category: "wheels",
  subcategory: "rims",  // rims | tires | complete
  displayName: "HRE P101 Forged Wheels",
  glbUrl: "gs://.../models/parts/wheels/hre_p101_v1.glb",
  
  // Anchor compatibility
  anchorType: "WHEEL_4",  // Enum: defines which anchors this part uses
  compatibility: ["all"],  // Or specific modelIds: ["porsche_911_2024", ...]
  
  // Metadata
  brand: "HRE",
  price: 5000,  // Virtual currency or USD
  tags: ["forged", "lightweight", "premium"],
  
  // Assets
  thumbnailUrl: "...",
  metrics: {
    fileSizeBytes: 850000,
    polyCountApprox: 12000
  },
  
  // State
  active: true,
  featured: false,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Anchor Type Enum (Firestore/Code)
```typescript
enum AnchorType {
  WHEEL_4 = "WHEEL_4",              // 4 wheel anchors
  SPOILER_REAR_1 = "SPOILER_REAR_1",  // Single rear spoiler
  EXHAUST_DUAL = "EXHAUST_DUAL",    // 2 exhaust tip anchors
  EXHAUST_QUAD = "EXHAUST_QUAD",    // 4 exhaust tip anchors
  BUMPER_FRONT = "BUMPER_FRONT",
  BUMPER_REAR = "BUMPER_REAR",
  LIGHTS_FRONT_2 = "LIGHTS_FRONT_2",
  LIGHTS_REAR_2 = "LIGHTS_REAR_2",
  DIFFUSER_REAR_1 = "DIFFUSER_REAR_1",
  SKIRT_PAIR = "SKIRT_PAIR",
  MIRROR_PAIR = "MIRROR_PAIR",
  HOOD_1 = "HOOD_1"
}
```

**Mapping Logic**:
- `WHEEL_4` → clone part GLB 4 times, snap to FL/FR/RL/RR anchors
- `EXHAUST_DUAL` → clone 2 times (or part has L+R already), snap to _L/_R anchors
- `SPOILER_REAR_1` → single instance, snap to ANCHOR_SPOILER_REAR

---

## Runtime Attach/Detach Workflow

### On Model Load (CarModelViewerScreen.tsx)
```typescript
// 1. Load base model GLB
const gltf = await gltfLoader.loadAsync(baseModel.glbUrl);
scene.add(gltf.scene);

// 2. Auto-discover anchors
const anchors = new Map<string, THREE.Object3D>();
gltf.scene.traverse((node) => {
  if (node.name.startsWith('ANCHOR_')) {
    anchors.set(node.name, node);
    console.log(`[Anchors] Found: ${node.name} at`, node.position);
  }
});

console.log(`[Anchors] Discovered ${anchors.size} anchors`);
```

### On Part Selection (User taps part in catalog)
```typescript
const mountedParts = useRef<Map<string, THREE.Group>>(new Map());

async function applyPart(part: Part) {
  // Load part GLB
  const partGltf = await gltfLoader.loadAsync(part.glbUrl);
  
  // Remove previous part in same category (if exists)
  const existingGroup = mountedParts.current.get(part.category);
  if (existingGroup) {
    scene.remove(existingGroup);
    existingGroup.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  }
  
  // Create group for new part instances
  const group = new THREE.Group();
  group.name = `PART_${part.category}`;
  
  // Attach based on anchorType
  switch (part.anchorType) {
    case 'WHEEL_4':
      ['FL', 'FR', 'RL', 'RR'].forEach(pos => {
        const anchor = anchors.get(`ANCHOR_WHEEL_${pos}`);
        if (anchor) {
          const instance = partGltf.scene.clone();
          instance.position.copy(anchor.position);
          instance.rotation.copy(anchor.rotation);
          instance.scale.copy(anchor.scale);
          group.add(instance);
        }
      });
      break;
      
    case 'SPOILER_REAR_1':
      const spoilerAnchor = anchors.get('ANCHOR_SPOILER_REAR');
      if (spoilerAnchor) {
        partGltf.scene.position.copy(spoilerAnchor.position);
        partGltf.scene.rotation.copy(spoilerAnchor.rotation);
        group.add(partGltf.scene);
      }
      break;
      
    case 'EXHAUST_DUAL':
      ['L', 'R'].forEach(side => {
        const anchor = anchors.get(`ANCHOR_EXHAUST_TIP_${side}`);
        if (anchor) {
          const instance = partGltf.scene.clone();
          instance.position.copy(anchor.position);
          instance.rotation.copy(anchor.rotation);
          group.add(instance);
        }
      });
      break;
  }
  
  scene.add(group);
  mountedParts.current.set(part.category, group);
  
  console.log(`[Parts] Applied ${part.displayName} to ${part.anchorType}`);
}
```

### Performance Optimizations
- **Instancing**: For wheels (4 identical copies), use `THREE.InstancedMesh` instead of clones
- **Lazy Loading**: Only load part GLBs when selected, cache in memory
- **Dispose Properly**: Clean up geometries/materials on part swap to prevent memory leaks
- **Level of Detail**: Use simplified part models if base model uses LOD system

---

## Integration with Existing Inventory

### Mapping Inventory Categories → Anchor Types

From existing `src/types/part.ts`:
```typescript
// Existing inventory categories
type PartCategory = 
  | 'wheels' 
  | 'tires'
  | 'suspension'
  | 'brakes'
  | 'exterior'
  | 'lights'
  | 'exhaust'
  | 'engine'
  | 'interior'
  | 'paint';
```

**Mapping**:
- `wheels` → `WHEEL_4` (rim + tire combo, or rim-only)
- `exterior` → Multiple: `BUMPER_FRONT`, `BUMPER_REAR`, `SPOILER_REAR_1`, `SKIRT_PAIR`, `DIFFUSER_REAR_1`, `HOOD_1`, `MIRROR_PAIR`
- `lights` → `LIGHTS_FRONT_2`, `LIGHTS_REAR_2`
- `exhaust` → `EXHAUST_DUAL` or `EXHAUST_QUAD`
- `suspension` → No anchor (metadata: `rideHeightOffset`)
- `brakes` → `WHEEL_4` (visible through wheels, or separate `BRAKE_CALIPER_4`)
- `engine` → `ANCHOR_ENGINE_BAY` (visual only, requires hood open state)
- `interior` → No anchors (metadata-only for MVP; later: interior camera mode)
- `paint` → No GLB (material swap on base model mesh)

**Implementation Note**: Add `anchorType` field to existing Part schema.

---

## Minimum Viable Part Swap Demo

### Goal
Prove the concept works on **ONE car** (Porsche 911) with **3 part types**.

### Required Assets (Total: 4 GLBs)

1. **Base Model**: Porsche 911 with 19 anchors embedded (already optimized)
   - File: `porsche_911_2024_v2.glb` (with anchors added in Blender)
   - Size: ~2.2MB (slight increase from anchor empties)

2. **Part 1: Wheel Set**
   - File: `hre_p101_wheel_v1.glb` (single wheel)
   - Cloned 4x at runtime → WHEEL_4
   - Size target: <500KB

3. **Part 2: GT Wing Spoiler**
   - File: `gt_wing_universal_v1.glb`
   - Single instance → SPOILER_REAR_1
   - Size target: <300KB

4. **Part 3: Dual Exhaust Tips**
   - File: `akrapovic_tips_v1.glb` (single tip or pair)
   - Cloned 2x (or pre-paired) → EXHAUST_DUAL
   - Size target: <200KB

### Sourcing Strategy (Same as Base Models)
- **Sketchfab**: Search "car wheel", "gt wing", "exhaust tips" with CC-BY filter
- **Optimization**: Same Blender pipeline (decimate, texture resize, Draco compress)
- **Licensing**: CC-BY or CC0 only

### Demo Flow
1. User opens Demo Cars Gallery
2. Selects "2024 Porsche 911"
3. Model loads in 3D viewer with anchors auto-discovered
4. User taps "Customize" button
5. Parts picker modal shows 3 parts:
   - "HRE P101 Wheels"
   - "Universal GT Wing"
   - "Akrapovic Exhaust Tips"
6. User selects "HRE P101 Wheels"
7. Runtime: Load wheel GLB, clone 4x, attach to ANCHOR_WHEEL_* → wheels swap instantly
8. User selects "Universal GT Wing"
9. Runtime: Load spoiler GLB, attach to ANCHOR_SPOILER_REAR → spoiler appears
10. User selects "Akrapovic Exhaust Tips"
11. Runtime: Load exhaust GLB, clone 2x, attach to ANCHOR_EXHAUST_TIP_* → tips appear

**Success Criteria**:
- Part swaps happen <1 second
- No visible popping/flickering
- FPS remains >30
- Parts visually align correctly with base model
- Can swap multiple times without memory leak

---

## Schema Updates Required

### 1. Add `anchorType` to Existing Part Interface
```typescript
// src/types/part.ts (modify existing)
export interface Part {
  // ... existing fields ...
  anchorType?: AnchorType;  // NEW: which anchor pattern this part uses
  glbUrl?: string;          // NEW: Firebase Storage URL for 3D asset
}
```

### 2. Create New `AnchorMetadata` Type
```typescript
// src/types/anchor.ts (new file)
export enum AnchorType {
  WHEEL_4 = "WHEEL_4",
  SPOILER_REAR_1 = "SPOILER_REAR_1",
  EXHAUST_DUAL = "EXHAUST_DUAL",
  EXHAUST_QUAD = "EXHAUST_QUAD",
  BUMPER_FRONT = "BUMPER_FRONT",
  BUMPER_REAR = "BUMPER_REAR",
  LIGHTS_FRONT_2 = "LIGHTS_FRONT_2",
  LIGHTS_REAR_2 = "LIGHTS_REAR_2",
  DIFFUSER_REAR_1 = "DIFFUSER_REAR_1",
  SKIRT_PAIR = "SKIRT_PAIR",
  MIRROR_PAIR = "MIRROR_PAIR",
  HOOD_1 = "HOOD_1",
  BRAKE_CALIPER_4 = "BRAKE_CALIPER_4"
}

export interface AnchorDiscoveryResult {
  anchorName: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
}
```

### 3. Update `BaseModel` Interface
```typescript
// src/types/BaseModel.ts (modify existing)
export interface BaseModel {
  // ... existing fields ...
  anchorsVersion?: string;  // NEW: "v1" - for future anchor schema changes
  anchorCount?: number;     // NEW: number of anchors in this model
}
```

---

## Versioning & Future Expansion

### Anchor Schema Versioning
- **v1** (MVP): 19 standard anchors per car
- **v2** (Future): Add engine bay, fender flares, grille, etc.
- **v3** (Future): Add interior anchors (seats, steering wheel, shift knob)

**Backward Compatibility**: Parts check `anchorType` exists in loaded model. If anchor missing, show warning or skip that part.

### Dynamic Anchor Discovery
- Runtime scans GLB for `ANCHOR_*` nodes
- No hardcoded anchor lists in code
- New anchors auto-available when added to GLB

### Part Bundles
- **Kit System**: Group multiple parts (e.g., "Track Day Kit" = spoiler + splitter + diffuser + wheels)
- Single transaction, apply all parts from bundle
- Save as "Build Configuration"

---

## Next Steps (Post-Design Approval)

### Phase 2A: Add Anchors to Porsche 911
1. Open `porsche_911_2024.glb` in Blender
2. Add 19 empty objects with anchor naming convention
3. Position empties at precise mount points (wheel centers, spoiler deck, etc.)
4. Re-export as `porsche_911_2024_v2.glb`
5. Upload to Firebase Storage
6. Update Firestore baseModels doc with `anchorsVersion: "v1"`, `anchorCount: 19`

### Phase 2B: Source & Prepare 3 MVP Parts
1. Find wheel GLB on Sketchfab (CC-BY)
2. Find GT wing GLB on Sketchfab (CC-BY)
3. Find exhaust tips GLB on Sketchfab (CC-BY)
4. Optimize each with Blender pipeline
5. Upload to Firebase Storage under `models/parts/`
6. Create 3 docs in Firestore `parts` collection

### Phase 2C: Implement Part Swapping in App
1. Update `CarModelViewerScreen.tsx` with auto-discovery logic
2. Create `<PartsPickerModal>` component
3. Implement `applyPart()` function with anchor-based attachment
4. Add "Customize" button to viewer UI
5. Wire up Firestore query for active parts
6. Test on Porsche 911 with 3 MVP parts

### Phase 2D: Expand to All 3 Cars
1. Add anchors to BMW M3 GLB → `bmw_m3_2023_v2.glb`
2. Add anchors to Subaru BRZ GLB → `subaru_brz_2022_v2.glb`
3. Test part compatibility across all 3 cars
4. Adjust anchor positions if needed for visual alignment

### Phase 2E: Part Library Expansion
1. Add 5-10 more wheel sets
2. Add 3-5 bumper options
3. Add 2-3 exhaust variants
4. Add headlight/taillight options
5. Implement paint system (material swapping, no GLB)

---

## Summary

**Core Innovation**: Anchor empties embedded in GLB files enable scalable, performant part swapping without database-driven transform coordinates.

**Key Benefits**:
- Self-contained models (anchors travel with GLB)
- Runtime flexibility (auto-discovery)
- Artist-friendly (place anchors in Blender visually)
- Network efficient (no separate anchor JSON fetches)
- Backward compatible (graceful degradation if anchors missing)

**Proof Required**: MVP with Porsche 911 + 3 parts demonstrates:
1. Anchors auto-discover correctly
2. Parts attach/detach smoothly
3. Performance remains acceptable (<1s swap, >30 FPS)
4. System scales to multiple part types and categories

**Awaiting Approval**: Ready to proceed to Phase 2A (add anchors to Porsche 911 in Blender) upon user confirmation.
