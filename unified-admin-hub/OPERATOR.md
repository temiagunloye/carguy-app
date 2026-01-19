# Unified Admin Hub - Operator Manual

**Repo**: `unified-admin-hub`  
**Status**: Ready for Deployment 🚀

## 1. Project Overview
A private, centralized Admin Dashboard for managing ThatAppCompany and GarageManager assets.
- **Tech Stack**: Next.js 15, Tailwind v4 (Black/Red), Firebase (Auth + Firestore).
- **Access**: Strictly restricted to allowlisted emails (Alex + Temi).

## 2. Deployment Guide (Vercel)

### Step 1: Link Project
Run the following in the project directory:
```bash
vercel link
```

### Step 2: Configure Environment Variables
Go to Vercel Project Settings > Environment Variables and add the following:

**Public (Client-Side)**
- `NEXT_PUBLIC_FIREBASE_API_KEY`: [From Firebase Console]
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: [From Firebase Console]
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: [From Firebase Console]
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: [From Firebase Console]
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: [From Firebase Console]
- `NEXT_PUBLIC_FIREBASE_APP_ID`: [From Firebase Console]
- `NEXT_PUBLIC_ADMIN_EMAILS`: `alex@thatappcompany.com,temi@thatappcompany.com` (Comma separated whitelist)

**Private (Server-Side)**
- `FIREBASE_SERVICE_ACCOUNT_KEY`: The **contents** of your Service Account JSON file (download from Firebase Project Settings > Service Accounts). **Crucial**: Paste the entire JSON string.

### Step 3: Deploy
```bash
vercel --prod
```

## 3. How to Use

### Managing Links
- The "Quick Access" links on the dashboard are pulled from the `admin_links` Firestore collection.
- To add a link, use the "+ Add Link" button (currently UI sends request to admin_links collection).

### Posting Updates
- Navigate to the "Updates" tab.
- Click "New Update" to post a changelog entry for any app.

### Mailing List
- The API route `/api/subscribe` is open for your other apps to POST to.
- Payload: `{ "email": "user@example.com", "source": "waitlist", "platform": "garagemanager" }`
- Data is stored in `mailing_list` collection.

## 4. Troubleshooting
- **Login fails**: Ensure your email is in `NEXT_PUBLIC_ADMIN_EMAILS` or the hardcoded list in `AuthProvider.tsx`.
- **Database errors**: Check that `FIREBASE_SERVICE_ACCOUNT_KEY` is set correctly in Vercel.
