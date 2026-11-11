# Funnel Measurement Spec

**Orbital Health Systems homepage — GA4 + MongoDB cross-checks, campaign registry, internal-traffic policy**

Last updated: 2026-11-10

---

## Table of Contents

1. [Funnel Overview](#1-funnel-overview)
2. [Event Inventory](#2-event-inventory)
3. [Attribution Model](#3-attribution-model)
4. [Campaign Registry](#4-campaign-registry)
5. [MongoDB Truth Sources](#5-mongodb-truth-sources)
6. [Mongo Cross-Check Queries](#6-mongo-cross-check-queries)
7. [Internal-Traffic Handling](#7-internal-traffic-handling)
8. [GA4 Console Configuration](#8-ga4-console-configuration)
9. [Known Gaps and Follow-ups](#9-known-gaps-and-follow-ups)

---

## 1. Funnel Overview

Five stages; GA4 is directional signal, MongoDB is the source of truth.

| Stage | Name | GA4 events | Mongo source |
|------:|------|-----------|-------------|
| 1 | **Acquisition** | `page_view` by `utm_campaign` / `utm_source` | — |
| 2 | **Engagement** | `view_item`, `select_content` | — |
| 3 | **Conversion** | `sign_up`, `generate_lead` | `EmailList`, `Inquiries` |
| 4 | **Qualification** | — (human triage only) | `Inquiries.status` |
| 5 | **Commercial** | `begin_checkout` (now), `purchase` (follow-up) | `MonetizationPurchases` |

---

## 2. Event Inventory

### 2.1 `page_view`

| Property | Detail |
|----------|--------|
| **Trigger** | `useLocation` tracker in `imports/ui/App.jsx` via `trackPageView()` in `imports/lib/analyticsEvents.js` |
| **Deduplication** | `createPageViewDeduper()` (`imports/lib/pageViewDeduper.js`) — consecutive identical paths suppressed (React StrictMode, redundant history events) |
| **PHI scrubbing** | `scrubAnalyticsPath()` (`imports/lib/scrubAnalyticsPath.js`) — query string and fragment always dropped; id-shaped segments (UUID, hex ≥16 chars, digit-bearing ≥6 chars, long mixed-case) replaced with `:id`. `/moonbase2026` is in the static allowlist and passes verbatim. |
| **Consent gate** | `analyticsReady()` checks `getAnalyticsConsent() === 'granted'` before dispatch; pre-consent entry page fires via replay (see §8) |
| **Dev gate** | Suppressed when `Meteor.isDevelopment` unless `settings.public.google.analytics.sendInDevelopment: true` |
| **Attribution** | Latest-touch UTM merged into every event via `getAttribution()` |

### 2.2 `view_item`

Fires on mount of a product page or coming-soon landing page.

| `item_id` | `item_name` | Fired in |
|-----------|------------|---------|
| `chronicle-workstation` | `Chronicle Workstation` | `ChronicleWorkstationPage.jsx` |
| `lunar-colony-simulator` | value from `COMING_SOON_PRODUCTS` | `ComingSoonPage.jsx` |
| `mars-to-table` | value from `COMING_SOON_PRODUCTS` | `ComingSoonPage.jsx` |
| `new-lunar-settlers-cookbook` | value from `COMING_SOON_PRODUCTS` | `CookbookComingSoonPage.jsx` |

Additional params: `product` (same as `item_id`), `source` (route slug).

### 2.3 `select_content`

Fires on CTA clicks — product card and audience journey cards.

| `cta_location` | `product` | `item_name` | Fired in |
|---------------|-----------|------------|---------|
| `product_card` | product id | download platform or `Learn more` | `ProductCard.jsx` |
| `homepage_journeys` | journey key (`simulation` / `publishing` / `research`) | CTA label text | `AudienceJourneysSection.jsx` |

### 2.4 `sign_up`

Fires **only** when the server returns `created: true`.

| Param | Value |
|-------|-------|
| `method` | `email_interest` |
| `product` | product key (e.g. `lunar-colony-simulator`) |
| `source` | route slug |

**Counting caveat**: `emailList.subscribeInterest` is idempotent — a repeat submission by an existing subscriber (`status: 'subscribed'`, `status: 'pending'`, `status: 'verified'`) returns `created: false`. A previously unsubscribed address re-activated also returns `created: false` (re-subscription, not a new record). The GA4 `sign_up` count therefore undercounts total active list additions; Mongo is the authority.

**Double-opt-in flow** (`emailList.subscribe`): the main `/email-list` route uses a two-step verification flow. `created: true` is returned on initial insert; the subscriber reaches `status: 'verified'` only after clicking the confirmation link. The `sign_up` event fires on the first insert, before email verification. Mongo counts by status to distinguish confirmed vs pending.

### 2.5 `generate_lead`

Fires **only** when `inquiries.submit` returns `created: true`. Honeypot-triggered submissions return `created: false` and never count.

| Param | Value |
|-------|-------|
| `interest_area` | Select value: `mission-simulation` / `analog-research` / `space-agriculture` / `research-collaboration` / `other` |
| `cta_location` | `research_inquiry_page` |

### 2.6 `begin_checkout`

Fires when a real Stripe Checkout session is created (both hosted and satellite paths). Does **not** fire on the fallback `window.open` to the hosted pricing page.

| Param | Value |
|-------|-------|
| `item_id` | tier/catalog key (e.g. `earlyAccess`) |
| `value` | `amountCents / 100` (number, USD) |
| `currency` | `USD` |

Source: `extensions/monetization/client/PricingPage.jsx`, lines 539 and 560.

### 2.7 `purchase` — NOT YET IMPLEMENTED

The `purchase` event requires a confirmed payment signal. The client redirect return (`/payments`) is not a reliable trigger — the customer may close the browser before returning. The correct implementation is a GA4 Measurement Protocol call from the Stripe webhook at `checkout.session.completed`.

**Follow-up sketch** (see §9.1 for the full gap):

```javascript
// In extensions/monetization/server/webhooks.js
// Inside the 'checkout.session.completed' case, after recording the purchase:
const measurementId = get(Meteor, 'settings.private.google.analytics.measurementId', '');
const apiSecret = get(Meteor, 'settings.private.google.analytics.measurementProtocolApiSecret', '');
if (measurementId && apiSecret) {
  const clientId = get(session, 'metadata.gaClientId', 'server');
  await fetch(
    `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
    {
      method: 'POST',
      body: JSON.stringify({
        client_id: clientId,
        events: [{
          name: 'purchase',
          params: {
            transaction_id: session.id,
            value: session.amount_total / 100,
            currency: session.currency.toUpperCase(),
            items: [{ item_id: session.metadata.tierKey }]
          }
        }]
      })
    }
  );
}
```

Requirements: (a) pass `gaClientId` from the client into Stripe metadata at checkout creation; (b) add `settings.private.google.analytics.measurementProtocolApiSecret` to production settings; (c) ensure the Stripe webhook fires for `checkout.session.completed`.

---

## 3. Attribution Model

### Storage

First-touch and latest-touch UTM parameters are captured into `localStorage` key `campaignAttribution` once per app start (before the router strips the URL), via `captureAttribution()` in `imports/lib/campaignAttribution.js`.

Shape:
```json
{
  "first":  { "utm_source": "...", "utm_campaign": "...", "at": "ISO-8601", "landingPage": "/..." },
  "latest": { "utm_source": "...", "utm_campaign": "...", "at": "ISO-8601", "landingPage": "/..." }
}
```

Captured keys: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`. Values capped at 120 chars.

### GA4 event params

`trackEvent()` merges the latest-touch object into every event via `Object.assign({}, latest, params)` after passing through `scrubEventParams()` (allowlist). Attribution travels with the event to GA4 on every conversion.

### MongoDB storage

Attribution is sanitized server-side by `sanitizeAttribution()` (`extensions/email-list/lib/sanitizeSubscriptionContext.js`) before writing to `EmailList` or `Inquiries`. The raw client object is never stored.

Fields on `EmailList`:
- `attribution.first` — set on initial record creation; never overwritten
- `attribution.latest` — overwritten on every subsequent interaction

Fields on `Inquiries`:
- `attribution` — object with `first` and `latest` stored at inquiry time

---

## 4. Campaign Registry

Canonical `utm_campaign` values. All printed materials, QR codes, and social links **must** use these exact strings to roll up correctly in GA4.

| `utm_campaign` | Channel | Notes |
|---------------|---------|-------|
| `mars-society-2026` | Event handcard / QR | Mars Society Conference 2026; $600 print run |
| `postcards-qr` | Printed postcards / QR | Generic postcard distribution |
| `linkedin` | LinkedIn organic / paid | Social outreach |
| `youtube` | YouTube descriptions / cards | Video-linked traffic |
| `direct-outreach` | 1:1 email / personal referral | Manually tagged links |

**Example URL**: `https://orbital.healthcare/?utm_source=postcards-qr&utm_campaign=mars-society-2026&utm_medium=print`

Adding new campaigns: update this table and confirm the string is used in all outbound links before the material ships.

---

## 5. MongoDB Truth Sources

### 5.1 `EmailList` collection

The authoritative subscriber ledger. GA4 `sign_up` counts are directional; this collection is the source of truth.

| Field | Type | Notes |
|-------|------|-------|
| `email` | String | normalized to lowercase |
| `status` | String | `pending` / `verified` / `subscribed` / `unsubscribed` |
| `subscribedAt` | Date | initial signup timestamp |
| `verifiedAt` | Date | set when email link clicked (`emailList.subscribe` flow) |
| `unsubscribedAt` | Date | set on unsubscribe |
| `source` | String | route slug or `launch-page` |
| `sources` | Array\<String\> | accumulates every route that submitted this email (subscribeInterest) |
| `interests` | Array\<String\> | e.g. `['simulator']`, `['research']` |
| `attribution.first` | Object | first-touch UTM; never overwritten |
| `attribution.latest` | Object | latest-touch UTM; updated on re-submit |
| `landingPage` | String | path at time of signup |
| `ipAddress` | String | server-side (privacy policy must disclose retention window) |

**Status semantics**:
- `pending` — `emailList.subscribe` flow; awaiting email verification
- `verified` — clicked verification link; double-opted in
- `subscribed` — `emailList.subscribeInterest` flow; single-opt-in from coming-soon pages; also set when a previously `unsubscribed` address resubmits
- `unsubscribed` — clicked unsubscribe link

### 5.2 `Inquiries` collection

B2B institutional inquiries. Never auto-qualified; all triage is manual.

| Field | Type | Notes |
|-------|------|-------|
| `name` | String | truncated at 200 chars |
| `email` | String | lowercase |
| `organization` | String | optional; truncated at 300 chars |
| `interestArea` | String | one of: `mission-simulation`, `analog-research`, `space-agriculture`, `research-collaboration`, `other` |
| `message` | String | truncated at 5000 chars |
| `status` | String | `new` → `reviewed` → `qualified` or `declined` |
| `spam` | Boolean | `true` = honeypot was filled; never presented to operators |
| `submittedAt` | Date | |
| `landingPage` | String | `/research-inquiry` |
| `attribution` | Object | sanitized `{first, latest}` |
| `ipAddress` | String | server-side |

**Qualification is manual**: `status` starts as `new`. Operators move to `reviewed`, then to `qualified` or `declined`. Nothing automated changes `status` beyond `new`.

---

## 6. Mongo Cross-Check Queries

Run these in `mongosh` against the production database to validate GA4 numbers.

### Subscriber counts by status

```js
// Confirmed active subscribers (source of truth for conversion count)
db.EmailList.countDocuments({ status: { $in: ['subscribed', 'verified'] } })

// Full breakdown by status
db.EmailList.aggregate([
  { $group: { _id: '$status', count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])
```

### Signups by utm_campaign (latest-touch)

```js
// Cross-check against GA4 sign_up by campaign
db.EmailList.aggregate([
  { $match: { status: { $in: ['subscribed', 'verified'] } } },
  { $group: {
    _id: '$attribution.latest.utm_campaign',
    count: { $sum: 1 }
  }},
  { $sort: { count: -1 } }
])
```

### Signups by interests

```js
db.EmailList.aggregate([
  { $unwind: { path: '$interests', preserveNullAndEmptyArrays: true } },
  { $group: { _id: '$interests', count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])
```

### Non-spam inquiries by interestArea and status

```js
// Cross-check against GA4 generate_lead counts
db.Inquiries.aggregate([
  { $match: { spam: false } },
  { $group: {
    _id: { interestArea: '$interestArea', status: '$status' },
    count: { $sum: 1 }
  }},
  { $sort: { '_id.interestArea': 1, '_id.status': 1 } }
])
```

### Inquiries by campaign

```js
db.Inquiries.aggregate([
  { $match: { spam: false } },
  { $group: {
    _id: '$attribution.latest.utm_campaign',
    count: { $sum: 1 }
  }},
  { $sort: { count: -1 } }
])
```

---

## 7. Internal-Traffic Handling

### 7.1 Development instances

`analyticsEvents.js` suppresses all events when `Meteor.isDevelopment === true` unless `settings.public.google.analytics.sendInDevelopment: true` is explicitly set. No action needed; dev traffic is silent by default.

### 7.2 Production team visits

Production deploys on Galaxy send real events. To exclude team IPs from GA4 reports:

1. In GA4 Admin, go to **Data Streams** → select the homepage stream
2. Under **More tagging settings**, click **Define internal traffic**
3. Click **Create** and add the team's office/VPN IP address(es) with rule type **IP address equals**
4. Save
5. Navigate to **Admin → Data Filters** (under the property)
6. Find the auto-created **Internal Traffic** filter and change its state from **Testing** to **Active**

Note: testing mode lets you preview the exclusion in GA4's **Tech → Filtered users** report before activating.

### 7.3 Data-center origin visits (Ashburn, Boardman, Council Bluffs)

AWS and cloud-provider data centers in Ashburn VA, Boardman OR, and Council Bluffs IA appear in GA4 geographic reports. These are crawler/bot or server-generated requests, not real users.

**Do NOT configure GA4 to auto-exclude these.** Auto-exclusion is a collection-level filter that removes the data permanently — it cannot be recovered. Instead:

- In GA4 explorations or standard reports, apply a filter: **City does not contain** `Ashburn`, `Boardman`, `Council Bluffs` when computing conversion rates or funnel metrics
- In Looker Studio / BigQuery exports, exclude on `geo_city` or `geo_metro` in the analysis query
- Note these visits in campaign-performance reviews: they inflate session counts but typically have near-zero conversion rates, making their distortion visible

### 7.4 Consent banner impact on session counts

The consent mechanism means visitors who decline or dismiss the banner send zero GA4 events. After the consent banner ships, expect a step-change DROP in reported sessions — this is correct behavior, not lost traffic. The before/after comparison is therefore not apples-to-apples:

- **Before banner**: all sessions tracked (implicit consent)
- **After banner**: only consented sessions tracked

Do not interpret the drop as a site degradation. Use Mongo `EmailList` and `Inquiries` as absolute measures of conversion health independent of GA4 consent rate.

---

## 8. GA4 Console Configuration

### 8.1 Mark key events

After `sign_up` and `generate_lead` have each fired at least once in production:

1. GA4 Admin → **Events** (under the property's data stream)
2. Find `sign_up` in the event list; toggle **Mark as key event**
3. Repeat for `generate_lead`

Key events appear in the Conversions report and can be used as GA4 goal targets.

### 8.2 Disable Enhanced Measurement — page changes based on browser history

**This setting must be disabled.** Enhanced Measurement's "page changes based on browser history" fires automatic `page_view` events on every history push — including raw, un-scrubbed URLs. This:
- Duplicates the `page_view` events already dispatched by `analyticsEvents.js`
- Bypasses the PHI path scrubber (`scrubAnalyticsPath`)
- Sends raw patient/resource IDs to GA4

Steps to disable:
1. GA4 Admin → **Data Streams** → select the stream
2. Under **Enhanced measurement**, click the gear icon
3. Toggle off **Page changes based on browser history events**
4. Recommended: also toggle off **Scrolls** and **Outbound clicks** — these generate noise events that cannot carry attribution context and may reveal internal link destinations

### 8.3 DebugView during launch verification

During initial deployment verification (`settings.public.google.analytics.debug: true` in settings or via the GA4 DebugView Chrome extension):

1. GA4 Admin → **DebugView**
2. Navigate through the homepage, product pages, and coming-soon pages
3. Confirm `page_view` fires with scrubbed paths (`:id` for resource segments)
4. Confirm `view_item` fires on each product page load
5. Confirm `select_content` fires on CTA clicks with correct `cta_location`
6. Submit a test signup and confirm `sign_up` fires exactly once (not on re-submit)
7. Submit a test inquiry and confirm `generate_lead` fires; verify honeypot submissions do not fire it

---

## 9. Known Gaps and Follow-ups

### 9.1 `purchase` event — Measurement Protocol (follow-up)

The `purchase` event is not implemented. It requires the GA4 Measurement Protocol from the Stripe webhook handler (`extensions/monetization/server/webhooks.js`), case `checkout.session.completed`. See §2.7 for the implementation sketch.

Required prep: (a) thread `gaClientId` from the client through the checkout session creation into Stripe metadata; (b) provision a GA4 Measurement Protocol API secret; (c) add `settings.private.google.analytics.measurementProtocolApiSecret` to production settings.

### 9.2 DDPRateLimiter does not cover the HTTP RPC transport

`DDPRateLimiter` rules in `extensions/email-list/server/rate-limiter.js` apply to DDP connections. All public methods (`emailList.subscribe`, `emailList.subscribeInterest`, `emailList.verify`, `inquiries.submit`) are also reachable via `POST /api/rpc` (the HTTP JSON-RPC transport) — this path **bypasses DDPRateLimiter entirely**.

Current abuse mitigations on the HTTP path:
- Honeypot field on `inquiries.submit` silently flags bot submissions
- Server-side email validation rejects malformed addresses
- `emailList.subscribeInterest` is idempotent (repeat submissions update, not insert)

This is a known infrastructure gap. Follow-up: add per-IP rate limiting at the HTTP handler layer (nginx / Galaxy ingress, or a Meteor `WebApp.connectHandlers` middleware before `/api/rpc`).

### 9.3 IP address retention policy

Both `EmailList` and `Inquiries` store `ipAddress` from the server request context. The privacy policy must disclose: (a) that IP addresses are collected, (b) the retention window, and (c) the lawful basis. Set a retention window and add a TTL index or scheduled cleanup task before the first production send.

### 9.4 `/moonbase2026` allowlist maintenance

`scrubAnalyticsPath.js` has a static allowlist containing `/moonbase2026`. Any future digit-bearing static route slug (e.g. a year-based campaign URL) must be explicitly added to `STATIC_PATH_ALLOWLIST` in that file, or its pageviews will be collapsed into the `:id` bucket in GA4.
