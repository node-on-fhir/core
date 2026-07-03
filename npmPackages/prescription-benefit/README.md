# @node-on-fhir/prescription-benefit

Real-Time Prescription Benefit (RTPB) workflow module for Honeycomb EHR.

Implements ONC Health IT Certification criterion **§ 170.315(b)(4) — Real-time
prescription benefit**. The certification guide is bundled at
[`guides/real-time-prescription-benefit.pdf`](./guides/real-time-prescription-benefit.pdf).

## What it does

- **Send & receive** — composes an `RTPBRequest`, renders it to NCPDP-style XML,
  and obtains an `RTPBResponse`. The request is sent to a selectable **responder**
  (see below); a live endpoint, when configured, is POSTed the XML instead.
- **Display** — shows patient-specific benefit info, **estimated patient
  out-of-pocket cost** (or **stock status** for inventory responders), and
  **alternative products** in human-readable format, plus the raw request/response
  XML as certification evidence.
- **Persist** — stores every transaction (canonical JSON + wire XML) in the
  `PrescriptionBenefitRequest` / `PrescriptionBenefitResponse` collections.

## Responders

A **responder** is the counterparty an `RTPBRequest` is sent to. The requester page
shows a responder picker and the target URL. The registry lives in
[`lib/responders.js`](./lib/responders.js); each responder is either:

- **`formulary`** — a PBM coverage/pricing check. The built-in **Sample PBM Plan**
  derives coverage status + patient cost from a formulary
  ([`lib/mockResponder.js`](./lib/mockResponder.js) + [`data/sampleDrugs.json`](./data/sampleDrugs.json)).
- **`inventory`** — a physical-stock check against a kit/cart
  ([`lib/inventoryResponder.js`](./lib/inventoryResponder.js) + a JSON file under
  `data/inventories/`). Ships with **Community Pharmacy**, **ER Crash Cart**,
  **EMT Field Kit**, and **RV Camper Van Crash Cart**.

Both kinds emit the **same `RTPBResponse` shape**, tagged `responderType`, so the
requester UI + History work unchanged. Inventory responses remap the coverage codes:

| `RTPBResponse` field | Formulary meaning | Inventory meaning |
|----------------------|-------------------|-------------------|
| `coverage.status` | covered / w-restrictions / not-covered | in stock (qty > par) / low stock (0 < qty ≤ par) / out of stock |
| `coverage.payerName` | payer / PBM | kit/cart name |
| `requestedProduct.patientPayAmount` / `planPayAmount` | dollar amounts | `null` |
| `requestedProduct.{qtyOnHand,parLevel,lot,expiry,location,inStock}` | — | stock fields |
| `alternatives[]` | lower-cost same-class drugs | in-stock same-class items in this kit |

The external live endpoint stays settings-driven and secret — it is surfaced as a
selectable responder **without** revealing its URL.

Canonical storage is **JSON**; XML lives only at the wire boundary. The
conversion is bidirectional — see `lib/RtpbXml.js`
(`jsonToRequestXml` / `jsonToResponseXml` / `requestXmlToJson` /
`responseXmlToJson`, backed by `xml2js`).

> Representative NCPDP RTPB IG v13 subset — not the full proprietary schema.
> RxNorm + NDC are carried on every product.

## Quick Start

```bash
EXTRA_WORKFLOWS=@node-on-fhir/prescription-benefit \
  meteor run --settings settings/settings.honeycomb.localhost.json
```

Select a patient, then open `/prescription-benefit`.

## Pages

### `/prescription-benefit`

`PrescriptionBenefitPage` — three tabs:
- **Compose** — build an `RTPBRequest` from the selected patient + a drug
  (sample-catalog picker, manual RxNorm/NDC entry, or prefill from an existing
  `MedicationRequest`), prescriber, pharmacy, and coverage.
- **Result** — benefit summary, out-of-pocket cost, alternatives table, and raw
  request/response XML.
- **History** — past transactions for the patient (click a row to reopen it).

A **responder picker** in the header selects where the request is sent and displays
the target URL.

### `/prescription-benefit-provider`

`PrescriptionBenefitProviderPage` — a read-only inspector of the responders an
`RTPBRequest` can be sent to (patient-agnostic). Pick a responder to view:
- *formulary* → the drug catalog + the pricing policy the mock PBM applies;
- *inventory* → the kit/cart location + stocked contents (qty / par / lot / expiry),
  with low/out-of-stock rows flagged.

## Meteor Methods

| Method | Description |
|--------|-------------|
| `prescriptionBenefit.submitRequest(requestJson, options?)` | Persist + render the request, route to the responder in `options.responderId` (mock PBM, an inventory kit, or the live endpoint), persist + return both JSON and XML. |
| `prescriptionBenefit.getConfig()` | Report the responder registry + default selection (and back-compat `mode`) without leaking the endpoint or secret. |
| `prescriptionBenefit.getStatus()` | Module name, version, status. |

## Settings

```json
{
  "private": {
    "prescriptionBenefit": {
      "endpoint": "",
      "authorizationHeader": ""
    }
  },
  "public": { "modules": { "prescriptionBenefit": { "enabled": true } } }
}
```

- `private.prescriptionBenefit.endpoint` — empty → **mock mode** (default). Set to
  an RTPB endpoint URL → **live mode** (the request XML is POSTed there and the
  XML reply is parsed back to JSON via `meteor/fetch`).
- `private.prescriptionBenefit.authorizationHeader` — optional `Authorization`
  header value for the live POST.
- `public.modules.prescriptionBenefit.enabled` — `false` hides the route + sidebar.

## File Structure

```
prescription-benefit/
├── package.json
├── workflow.json
├── client.js
├── server.js
├── README.md
├── client/
│   ├── PrescriptionBenefitPage.jsx
│   ├── PrescriptionBenefitProviderPage.jsx
│   └── components/
│       ├── BenefitResultCard.jsx
│       ├── AlternativesTable.jsx
│       └── RawXmlAccordion.jsx
├── server/
│   ├── methods.js
│   └── publications.js
├── lib/
│   ├── collections.js
│   ├── RtpbModel.js
│   ├── RtpbXml.js
│   ├── responders.js
│   ├── mockResponder.js
│   └── inventoryResponder.js
├── data/
│   ├── sampleDrugs.json
│   └── inventories/
│       ├── community-pharmacy.json
│       ├── er-crash-cart.json
│       ├── emt-field-kit.json
│       └── rv-camper-van.json
└── guides/
    └── real-time-prescription-benefit.pdf
```

## License

MIT
