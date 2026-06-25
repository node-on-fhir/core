# @node-on-fhir/prescription-benefit

Real-Time Prescription Benefit (RTPB) workflow module for Honeycomb EHR.

Implements ONC Health IT Certification criterion **§ 170.315(b)(4) — Real-time
prescription benefit**. The certification guide is bundled at
[`guides/real-time-prescription-benefit.pdf`](./guides/real-time-prescription-benefit.pdf).

## What it does

- **Send & receive** — composes an `RTPBRequest`, renders it to NCPDP-style XML,
  and obtains an `RTPBResponse`. By default a built-in **mock PBM** answers; if a
  live endpoint is configured it POSTs the XML to that endpoint instead.
- **Display** — shows patient-specific benefit info, **estimated patient
  out-of-pocket cost**, and **alternative products** in human-readable format,
  plus the raw request/response XML as certification evidence.
- **Persist** — stores every transaction (canonical JSON + wire XML) in the
  `PrescriptionBenefitRequest` / `PrescriptionBenefitResponse` collections.

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

## Meteor Methods

| Method | Description |
|--------|-------------|
| `prescriptionBenefit.submitRequest(requestJson, options?)` | Persist + render the request, get a response (mock or live), persist + return both JSON and XML. |
| `prescriptionBenefit.getConfig()` | Report transaction mode (`mock` / `live`) without leaking the endpoint or secret. |
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
│   ├── FooterButtons.jsx
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
│   └── mockResponder.js
├── data/
│   └── sampleDrugs.json
└── guides/
    └── real-time-prescription-benefit.pdf
```

## License

MIT
