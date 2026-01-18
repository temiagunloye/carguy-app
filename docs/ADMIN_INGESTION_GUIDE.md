# Admin Ingestion Guide

## Overview

This guide explains how to upload standard dealer cars to the Firebase backend for the Car Guy App dealer library.

## Prerequisites

1. **Firebase Admin SDK Setup**
   - Firebase Admin credentials (`serviceAccountKey.json`)
   - Node.js 18+ installed
   - Access to Firebase project `carguy-app-demo`

2. **Required Tools**
   ```bash
   npm install -g firebase-tools
   npm install --save firebase-admin sharp inquirer chalk
   ```

3. **Admin Authentication**
   - Your Firebase user must have the `admin: true` custom claim
   - Contact a project owner to set this up

## Canonical 10-Angle Convention

Every car must have exactly **10 angles** with these standardized names:

1. `front_driver_45` - Front 3/4 driver side
2. `front` - Direct front view
3. `front_passenger_45` - Front 3/4 passenger side
4. `passenger` - Direct passenger side view
5. `rear_passenger_45` - Rear 3/4 passenger side
6. `rear` - Direct rear view
7. `rear_driver_45` - Rear 3/4 driver side
8. `driver` - Direct driver side view
9. `top_front` - Bird's eye view from front
10. `top_rear` - Bird's eye view from rear

**Photo Requirements:**
- High resolution (minimum 1920x1080)
- Good lighting (preferably natural daylight)
- Clean background (dealer lot or solid backdrop)
- Consistent camera height and distance

## Ingestion Workflow

### Step 1: Prepare Photo Sets

Organize your photos in folders:

```
/dealer-cars/
  porsche-911-2024/
    glacier-white/
      front_driver_45.jpg
      front.jpg
      front_passenger_45.jpg
      passenger.jpg
      rear_passenger_45.jpg
      rear.jpg
      rear_driver_45.jpg
      driver.jpg
      top_front.jpg
      top_rear.jpg
    black-metallic/
      front_driver_45.jpg
      ...
```

### Step 2: Run Ingestion Script

```bash
cd /Users/temiagunloye/Desktop/carguy-app
node scripts/admin-ingest-standard-car.ts
```

The script will prompt you for:
- Make (e.g., "Porsche")
- Model (e.g., "911")
- Year (e.g., 2024)
- Trim (e.g., "Carrera S")
- Dealer Name (optional)
- Listing URL (optional - for enrichment)
- VIN (optional)
- Stock Number (optional)

### Step 3: Upload Paint Variants

For each paint color:
1. Enter color name (e.g., "Glacier White Metallic")
2. Select folder containing 10-angle photos
3. Script will:
   - Convert to WebP (85% quality)
   - Generate thumbnail
   - Upload to Firebase Storage
   - Create variant document

### Step 4: Enrichment (Optional)

If you provided a listing URL, the script will automatically:
- Scrape vehicle specifications
- Extract trim, engine, features, colors
- Store with confidence score and provenance

### Step 5: Review & Publish

1. Car is created with `status: draft`
2. Review in Firebase Console → Firestore → `standardCars`
3. When ready, script prompts to publish
4. Publishing sets `status: approved` (makes it visible in app)

## Validation

After ingestion, run validation:

```bash
node scripts/validate-standard-car-assets.ts
```

This checks:
- All approved cars have exactly 10 angles per variant
- All storage paths are accessible
- No orphan files or missing assets

## Troubleshooting

### Missing Angle Error
**Problem:** Upload failed with "angle X missing"

**Solution:** Ensure all 10 angles are present and named exactly as specified

### WebP Conversion Failed
**Problem:** Sharp error during conversion

**Solution:** 
```bash
npm install --force sharp
```

### Permission Denied
**Problem:** Firestore permission denied during upload

**Solution:** Verify your user has `admin: true` custom claim:
```bash
firebase auth:users:get YOUR_EMAIL@example.com
```

### Enrichment Timeout
**Problem:** URL scraping times out

**Solution:** 
- Check URL is accessible
- Try manual enrichment later
- Rate limiting may be active (max 10 requests/minute)

## Firebase Console

Access Firestore collections:
- [standardCars](https://console.firebase.google.com/project/carguy-app-demo/firestore/data/standardCars)
- [standardCarVariants](https://console.firebase.google.com/project/carguy-app-demo/firestore/data/standardCarVariants)

Access Storage:
- [public/standardCars](https://console.firebase.google.com/project/carguy-app-demo/storage/carguy-app-demo.firebasestorage.app/files/public~2FstandardCars)

## Best Practices

1. **Always run validation** after uploading multiple cars
2. **Use descriptive names** (e.g., "2024 Porsche 911 Carrera S")
3. **Keep originals** - store raw photos in `archive/` folder
4. **Test in app** before marking as approved
5. **Document dealer attribution** if applicable

## Security Notes

- Admin ingestion script requires Firebase Admin SDK (server-side only)
- Never share `serviceAccountKey.json`
- Regular users cannot write to standardCars collection
- Firestore rules enforce admin-only writes

## Support

For issues or questions:
- Check [Firebase Schema Documentation](./FIREBASE_SCHEMA.md)
- Review [Monitoring & Alerts](./MONITORING_ALERTS.md)
- Contact: engineering@thatappcompany.co
