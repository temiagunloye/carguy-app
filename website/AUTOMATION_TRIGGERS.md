# ⚡ Automation Triggers

**Goal:** Standardize lifecycle communications.

## 1. Waitlist Confirmation
- **Trigger**: New document created in `signups` collection.
- **Action**: Send email template `waitlist_welcome`.
- **Content**: "You're on the list! Here's what to expect..."
- **Logic**: 
  - If `role` == 'Shop', send `shop_welcome` variant.
  - If `role` == 'Dealer', send `dealer_welcome` variant.

## 2. Beta Invite (Manual/Batch)
- **Trigger**: Admin updates `status` to `invited`.
- **Action**: Send email template `beta_invite_link`.
- **Content**: Unique access code + download link.

## 3. Re-engagement (Planned)
- **Trigger**: 30 days since signup && `status` == `new`.
- **Action**: Send `monthly_update`.

## 4. Notifications (Internal)
- **Trigger**: `role` == 'Dealer' OR `role` == 'Shop'.
- **Action**: Email/Slack alert to Admin ("High value lead: [Email]").
