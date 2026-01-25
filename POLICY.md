# Balanced Mode Sourcing Policy

This project strictly adheres to "Balanced Mode" sourcing. We prioritize legality and safety over speed.

## 1. Source Tiers
*   **Tier 1 (OEM Press Kits):** The Golden Standard. Brands like Porsche, BMW, etc. provide "Newsrooms".
    *   *Action:* Allowed. Status = `APPROVED`.
*   **Tier 2 (Wikimedia Commons):** Open content.
    *   *Action:* Allowed if license is CC-BY, SA, or PD.
    *   *Gate:* Block "Non-Commercial" (NC) licenses.
*   **Tier 3 (Reputable Auto Sites):** Sites like NetCarShow or Wheelsage that re-host press photos.
    *   *Action:* Allowed but flagged as `NEEDS_REVIEW` to verify it's truly a press photo.
*   **Tier 4 (General Web):** Google Images, Forums, Pinterest.
    *   *Action:* **BLOCKED**. Do not use.

## 2. Publish Gate
All Firestore documents in `standardCars` have a `status` field.
*   `approved`: Visible to all users. (Requires Tier 1 or Verified Tier 2).
*   `needs_review`: Visible to Admins only. (Tier 3).
*   `draft_testing_only`: Placeholder or internal test.
*   `rejected`: Invalid source.

## 3. Rate Limiting (Robots)
*   User Agent: `CarGuyApp-Bot/1.0 (internal research)`
*   Rule: Respect `robots.txt`.
*   Rate: Max 1 request per second per domain. 
