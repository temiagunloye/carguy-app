# Firebase Schema Documentation

## Overview

The Standard Dealer Car Library uses Firestore for metadata and Firebase Storage for assets. This document details all collections, fields, and relationships.

## Collections

### standardCars

Path: `standardCars/{standardCarId}`

The main collection for dealer cars available to all users.

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `displayName` | string | ✓ | Full display name (e.g., "2024 Porsche 911 Carrera S") |
| `make` | string | ✓ | Manufacturer (e.g., "Porsche") |
| `model` | string | ✓ | Model name (e.g., "911") |
| `year` | number | ✓ | Model year |
| `trim` | string | ✓ | Trim level (e.g., "Carrera S") |
| `dealerName` | string | | Optional dealer attribution |
| `sourceType` | string | ✓ | Fixed to "dealer" |
| `status` | string | ✓ | "draft" \| "review" \| "approved" \| "archived" |
| `angleCount` | number | ✓ | Always 10 for v1 |
| `angleNames` | string[] | ✓ | Array of 10 canonical angle names |
| `styleProfileId` | string | ✓ | Reference to styleProfiles collection |
| `defaultVariantId` | string | ✓ | Reference to standardCarVariants |
| `dealerColorVariantIds` | string[] | ✓ | Array of 1-2 dealer paint variant IDs |
| `wrapColorEnabled` | boolean | ✓ | Future feature flag |
| `allowedPartTypes` | string[] | ✓ | ["paint", "wheels", "cosmetic"] |
| `heroAssetPath` | string | ✓ | Storage path to hero image |
| `enrichedSpecs` | object | | See EnrichedSpecs schema below |
| `listingUrl` | string | | Optional dealer listing URL |
| `vin` | string | | Optional VIN |
| `stockNumber` | string | | Optional stock number |
| `createdAt` | timestamp | ✓ | Creation timestamp |
| `updatedAt` | timestamp | ✓ | Last update timestamp |

**EnrichedSpecs Object:**

```typescript
{
  trim: string;
  engine: string;
  drivetrain: string;
  mpg: string;
  exteriorColor: string;
  interiorColor: string;
  features: string[];
  confidence: number;      // 0-1 confidence score
  provenance: string;      // Source URL
  timestamp: FirebaseTimestamp;
}
```

**Security Rules:**
- Read: All authenticated users
- Write: Admin only (`request.auth.token.admin == true`)

---

### standardCarVariants

Path: `standardCarVariants/{variantId}`

Paint color variants for standard cars.

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `standardCarId` | string | ✓ | Parent car reference |
| `variantType` | string | ✓ | "dealer_paint" \| "wrap_color" |
| `colorName` | string | ✓ | Display name (e.g., "Glacier White Metallic") |
| `colorKey` | string | ✓ | Slug key (e.g., "glacier_white") |
| `status` | string | ✓ | "draft" \| "approved" |
| `angleAssets` | map | ✓ | `{ angleName: storagePath }` for all 10 angles |
| `thumbPath` | string | ✓ | Storage path to thumbnail |
| `createdAt` | timestamp | ✓ | Creation timestamp |
| `updatedAt` | timestamp | ✓ | Last update timestamp |

**AngleAssets Example:**

```json
{
  "front_driver_45": "public/standardCars/car123/variants/var456/angles/front_driver_45.webp",
  "front": "public/standardCars/car123/variants/var456/angles/front.webp",
  ...
}
```

**Security Rules:**
- Read: All authenticated users
- Write: Admin only

---

### styleProfiles

Path: `styleProfiles/{styleProfileId}`

UI styling and lighting profiles for the viewer.

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✓ | Profile name (e.g., "Garage Dark v1") |
| `uiTokens` | object | ✓ | See UITokens schema below |
| `lightingNotes` | string | | Documentation of lighting setup |
| `createdAt` | timestamp | ✓ | Creation timestamp |
| `updatedAt` | timestamp | ✓ | Last update timestamp |

**UITokens Object:**

```json
{
  "background": "#000000",
  "surface": "#1a1a1a",
  "text": "#ffffff",
  "accent": "#007AFF"
}
```

**Default Profile:**

ID: `garage_dark_v1`

**Security Rules:**
- Read: All authenticated users
- Write: Admin only

---

### partsCatalog

Path: `partsCatalog/{partId}`

Catalog of available parts for try-on.

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✓ | Part name |
| `type` | string | ✓ | "paint" \| "wheels" \| "cosmetic" |
| `demoCompatible` | boolean | ✓ | Available in demo sandbox |
| `applyMode` | string | ✓ | "preset_swap" \| "overlay_mock" |
| `overlayRules` | object | | For overlay_mock mode |
| `swapRules` | object | | For preset_swap mode |
| `createdAt` | timestamp | ✓ | Creation timestamp |

**Security Rules:**
- Read: All authenticated users
- Write: Admin only

---

### users/{uid}/builds/{buildId}

Path: `users/{userId}/builds/{buildId}`

User's active build (free tier: only `activeBuild` exists).

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `mode` | string | ✓ | Fixed to "standardDealer" |
| `standardCarId` | string | ✓ | Reference to standardCars |
| `selectedPaintVariantId` | string | ✓ | Current paint variant |
| `selectedWheelsId` | string | | Optional wheels part ID |
| `selectedCosmeticId` | string | | Optional cosmetic part ID |
| `savedPartsCount` | number | ✓ | Count of saved parts (max 3 for free) |
| `updatedAt` | timestamp | ✓ | Last update timestamp |

**Security Rules:**
- Read: Owner only (`request.auth.uid == userId`)
- Create/Update: Owner only + `savedPartsCount <= 3` enforcement
- Delete: Owner only

---

## Firebase Storage Structure

```
public/
  standardCars/
    {standardCarId}/
      variants/
        {variantId}/
          angles/
            front_driver_45.webp
            front.webp
            front_passenger_45.webp
            passenger.webp
            rear_passenger_45.webp
            rear.webp
            rear_driver_45.webp
            driver.webp
            top_front.webp
            top_rear.webp
          thumb.webp
      hero.webp

archive/
  standardCars/
    {standardCarId}/
      videos/
        original_video.mov
```

**Storage Rules:**
- `public/standardCars`: Read for authenticated, write for admin only
- `archive/standardCars`: Read/write for admin only

**Lifecycle Policies:**
- Archive videos: Delete after 90 days

---

## Canonical 10-Angle Names

The app enforces this exact set of angle names:

1. `front_driver_45`
2. `front`
3. `front_passenger_45`
4. `passenger`
5. `rear_passenger_45`
6. `rear`
7. `rear_driver_45`
8. `driver`
9. `top_front`
10. `top_rear`

All variants must have all 10 angles. No exceptions.

---

## Indexes

**Required Firestore Indexes:**

```json
{
  "collectionGroup": "standardCars",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

```json
{
  "collectionGroup": "standardCarVariants",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "standardCarId", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" }
  ]
}
```

Deploy indexes:
```bash
firebase deploy --only firestore:indexes
```

---

## Data Relationships

```
standardCars (1)
  ├─→ styleProfiles (1) [styleProfileId]
  ├─→ standardCarVariants (1-N) [defaultVariantId, dealerColorVariantIds]
  └─→ users/{uid}/builds/activeBuild (0-N) [standardCarId]

standardCarVariants (1)
  └─→ standardCars (1) [standardCarId]

users/{uid}/builds/activeBuild (1)
  ├─→ standardCars (1) [standardCarId]
  ├─→ standardCarVariants (1) [selectedPaintVariantId]
  ├─→ partsCatalog (0-1) [selectedWheelsId]
  └─→ partsCatalog (0-1) [selectedCosmeticId]
```

---

## Common Queries

**Get all approved standard cars:**

```javascript
const carsRef = collection(db, 'standardCars');
const q = query(
  carsRef,
  where('status', '==', 'approved'),
  orderBy('createdAt', 'desc'),
  limit(20)
);
const snapshot = await getDocs(q);
```

**Get variants for a car:**

```javascript
const variantsRef = collection(db, 'standardCarVariants');
const q = query(
  variantsRef,
  where('standardCarId', '==', carId),
  where('status', '==', 'approved')
);
const snapshot = await getDocs(q);
```

**Get user's active build:**

```javascript
const buildRef = doc(db, `users/${userId}/builds/activeBuild`);
const buildSnap = await getDoc(buildRef);
```

---

## Migration Notes

When upgrading schema:
1. Create migration script in `scripts/migrations/`
2. Test on staging environment first
3. Run validation after migration
4. Update this document

---

## See Also

- [Admin Ingestion Guide](./ADMIN_INGESTION_GUIDE.md)
- [Monitoring & Alerts](./MONITORING_ALERTS.md)
