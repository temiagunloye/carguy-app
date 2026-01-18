# 📊 Tracking Map

**Goal:** Clean, consistent event tracking for GA4 and TikTok.

## 1. Global Setup
- **GTM Container ID**: `GTM-XXXXXX` (Placeholder)
- **GA4 Measurement ID**: Configured via GTM.
- **TikTok Pixel**: Configured via GTM.

## 2. Standard Events
| Event Name | Trigger | Parameters |
| :--- | :--- | :--- |
| `page_view` | Page Load | `page_path`, `page_title` |
| `cta_click` | Button Click | `cta_text`, `cta_location`, `destination_url` |
| `waitlist_submit` | Form Success | `form_id`, `role`, `email` (hashed/redacted) |
| `scroll_depth` | Scroll Vertical | `percent_scrolled` (25, 50, 75, 90) |
| `outbound_click` | External Link | `link_url`, `link_text` |

## 3. Custom Events
| Event Name | Trigger | Parameters |
| :--- | :--- | :--- |
| `feature_view` | Scroll to Feature | `feature_name` |
| `pricing_view` | View Pricing | `page_path` |
| `social_click` | Footer Icon Click | `platform` (Instagram, TikTok) |

## 4. User Properties
- `user_role` (Enthusiast, Shop, Dealer) - Set upon waitlist submission.
- `visitor_type` (New vs Returning).

## 5. Data Layer Push Structure
```javascript
window.dataLayer.push({
  event: 'event_name',
  ...parameters
});
```
