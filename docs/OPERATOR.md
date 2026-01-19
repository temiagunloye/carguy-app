# Garage Manager - Dashboard Operator Manual

**URL**: [garagemanager.co/dashboard.html](https://garagemanager.co/dashboard.html)  
**Status**: 🟢 **LIVE DATA (Firebase)**

## 1. Overview
The dashboard provides a real-time view of website performance, user acquisition, and conversion metrics. Use this tool to monitor the health of your funnel and identify high-performing traffic sources.

---

## 2. Key Metrics Explained

### Top Cards (KPIs)
- **Total Signups**: All-time count of users who successfully submitted the waitlist form.
- **New Users (24h)**: Users who signed up in the last 24 rolling hours.
- **Conversion Est.**: The percentage of unique visitors who navigate to sign up.
  - Formula: `(Total Signups / Unique Visitors from last 7d) * 100`
- **TikTok Traffic**: Count of visitors arriving specifically from TikTok (via `utm_source=tiktok` or referrer).

### Charts
- **Conversion Funnel**: Visualizes the drop-off at each stage:
  1.  **Visitors**: Estimated unique visitors (deduplicated).
  2.  **CTA Clicks**: Users who clicked *any* Call-to-Action button.
  3.  **Signups**: Users who completed the form.
  - *Goal*: Keep the drop-off percentages as low as possible.
- **Device Breakdown**: Mobile vs. Desktop usage. Use this to prioritize mobile optimization if mobile traffic is high (currently expected ~50%+).
- **Top Channels**: Where your users are coming from (Direct, Instagram, TikTok, etc.).
- **Top Pages**: The most viewed pages on your site in the last 7 days.

---

## 3. Daily Usage

1.  **Check Health**: Ensure the status badge says "LIVE DATA". If it says "ERROR", follow the troubleshooting guide below.
2.  **Monitor Trends**: Look at "New Users (24h)". A sudden spike means a marketing campaign is working. A drop might indicate a tracking issue or lower traffic.
3.  **Export Data**: Click the "Export CSV" button (top right) to download a raw list of signups for email marketing tools.

---

## 4. Troubleshooting

### Status says "ERROR"
- **Cause**: The dashboard failed to fetch data from the API.
- **Action**: 
  1. Refresh the page.
  2. If persistent, check your internet connection.
  3. Contact the technical team (Vercel logs need checking).

### Status says "DEMO MODE"
- **Cause**: The backend cannot connect to Firebase (missing credentials).
- **Action**: The technical team needs to re-upload `FIREBASE_SERVICE_ACCOUNT_JSON` to Vercel environment variables.

### Analytics Numbers Seem Low
- **Cause**: Ad blockers often block tracking scripts.
- **Note**: Our tracking is privacy-friendly and less likely to be blocked than Google Analytics, but some data loss is normal (10-20%).
- **Action**: Focus on *trends* rather than exact absolute numbers.

---

## 5. Tracked Events Reference

The system automatically tracks the following user interactions:
- `page_view`: Every page load (includes URL, referrer, device).
- `cta_click`: Clicks on any button with class `.btn`.
- `nav_click`: Clicks on navigation links.
- `faq_open`: Expanding an FAQ question.
- `share_click`: Clicking the "Copy Link" button.
- `waitlist_submit`: Successful waitlist form submission.
- `bodyshop_lead_submit`: Successful body shop application.
