# 🔥 Enable Live Data Collection (Firebase)

The website is currently running in **Demo Mode**. To enable live data collection to Firestore:

## 1. Create Resources
1. Go to [Firebase Console](https://console.firebase.google.com).
2. Create a new project (e.g., `car-guy-app`).
3. **Build > Firestore Database**: Click "Create Database", choose **Production Mode**, select a region (e.g., `nam5`).
4. **Project Settings > Service Accounts**:
   - Click "Generate validation private key".
   - Download the JSON file.

## 2. Configure Vercel
Go to your Vercel Project Settings > Environment Variables and add **ONE** variable:

- **Key**: `FIREBASE_SERVICE_ACCOUNT_JSON`
- **Value**: Paste the *entire content* of the JSON file you downloaded.

*(Alternatively, you can add `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` separately).*

## 3. Redeploy
1. Run `vercel --prod` locally, or push to git to trigger a Vercel build.
2. Visit `/dashboard.html` — the badge should switch to **LIVE DATA (Firebase)**.
