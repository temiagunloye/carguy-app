# Firestore Schema - Body Shop Partnerships

## Collections

### `dealers`
Dealer/shop profiles in the network.

```javascript
{
  id: "northside-auto",
  name: "Northside Auto Group",
  location: "Austin, TX",
  specialty: "Wheels + Aero",
  contactEmail: "contact@northsideauto.com",
  contactPhone: "+1-512-555-0100",
  adminUid: "firebase-auth-uid", // Firebase Auth UID of admin user
  status: "active", // active | pending | suspended
  partsCount: 128, // Denormalized count
  createdAt: "2026-01-18T00:00:00Z",
  updatedAt: "2026-01-18T00:00:00Z"
}
```

**Indexes:**
- `status` (ascending)
- `location` (ascending)
- `specialty` (ascending)

---

### `parts`
Parts inventory for dealers.

```javascript
{
  id: "part-uuid",
  dealerId: "northside-auto",
  name: "Wheel Set — 18in (5x114.3)",
  category: "Wheels & Tires", // Wheels & Tires | Suspension | Aero | Wrap | Lighting | Body
  stockQty: 7,
  leadTimeDays: 5,
  price: 1299,
  sku: "WHL-18-5114",
  imageUrl: "", // Optional
  description: "",
  createdAt: "2026-01-18T00:00:00Z",
  updatedAt: "2026-01-18T00:00:00Z"
}
```

**Indexes:**
- `dealerId` (ascending) + `category` (ascending)
- `dealerId` (ascending) + `createdAt` (descending)

---

### `jobs`
Build/job records for shops.

```javascript
{
  id: "job-uuid",
  shopId: "northside-auto", // Reference to dealer
  clientName: "John Doe",
  clientEmail: "john@example.com",
  clientPhone: "+1-512-555-0200",
  vehicle: {
    vin: "1HGBH41JXMN109186",
    make: "BMW",
    model: "M3",
    year: 2022,
    color: "Brooklyn Grey"
  },
  parts: [
    {
      partId: "part-uuid",
      name: "Wheel Set — 18in",
      price: 1299,
      status: "in_stock" // in_stock | ordered | planned
    }
  ],
  totalValue: 1299,
  status: "in_progress", // new | in_progress | pending_approval | approved | completed | cancelled
  notes: "Customer wants matte black finish",
  mediaUrls: [],
  portalToken: "secure-token-uuid", // Reference to portal token
  createdAt: "2026-01-18T00:00:00Z",
  updatedAt: "2026-01-18T00:00:00Z"
}
```

**Indexes:**
- `shopId` (ascending) + `status` (ascending)
- `shopId` (ascending) + `createdAt` (descending)

---

### `portalTokens`
Secure tokens for client preview portal.

```javascript
{
  id: "token-uuid",
  jobId: "job-uuid",
  token: "random-secure-token-string", // 32-char random string
  expiresAt: "2026-02-18T00:00:00Z", // 30 days default
  revoked: false,
  viewCount: 0,
  lastViewedAt: null,
  createdAt: "2026-01-18T00:00:00Z"
}
```

**Indexes:**
- `token` (ascending) - for fast lookup
- `jobId` (ascending)
- `expiresAt` (ascending)

---

### `portalApprovals`
Client approvals and feedback from portal.

```javascript
{
  id: "approval-uuid",
  jobId: "job-uuid",
  token: "token-uuid",
  approved: true,
  clientNotes: "Looks great! Let's proceed.",
  ipHash: "sha256-hash",
  createdAt: "2026-01-18T00:00:00Z"
}
```

**Indexes:**
- `jobId` (ascending) + `createdAt` (descending)

---

### `bodyshopLeads`
Lead capture for bodyshop/dealer signups and quote requests.

```javascript
{
  id: "lead-uuid",
  email: "shop@example.com",
  type: "bodyshop", // bodyshop | dealer | client_quote
  businessName: "Elite Performance",
  contactName: "Mike Johnson",
  phone: "+1-512-555-0300",
  location: "Dallas, TX",
  specialty: "Performance Builds",
  message: "Interested in joining the network",
  source: "website", // website | referral | direct
  status: "new", // new | contacted | qualified | onboarding | active | lost
  ipHash: "sha256-hash",
  createdAt: "2026-01-18T00:00:00Z",
  updatedAt: "2026-01-18T00:00:00Z"
}
```

**Indexes:**
- `type` (ascending) + `status` (ascending)
- `email` (ascending)
- `createdAt` (descending)

---

## Security Rules

See `firestore.rules` for implementation.

**Key principles:**
1. Dealer directory is publicly readable
2. Parts inventory is publicly readable
3. Only authenticated dealer admins can write to their own dealer/parts
4. Jobs are only readable by the owning shop
5. Portal tokens are validated server-side (no direct client access)
6. Leads are write-only from client, read-only for admins
