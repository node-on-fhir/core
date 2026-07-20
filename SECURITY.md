# Security Policy

## Supported Versions

Use this section to tell people about which versions of your project are
currently being supported with security updates.

| Version | Supported          | Release Name          |
| ------- | ------------------ | --------------------- |
| 0.8.0   | :white_check_mark: | Cybersecurity Audit   |
| 0.7.0   | ---                | HIMSS'21.             |
| 0.6.7   | ---                | Cerner SMART on FHIR Validation |
| 0.6.6   | ---                | Google Play Support    |
| 0.6.5   | ---                | Android Build Pipeline |
| 0.6.4   | ---                | Hotfix: Mobile Chrome  | 
| 0.6.3   | ---                | Vaccine Passport       |
| 0.6.2   | ---                | Low Energy Airport / Travel Maps |
| 0.6.1   | ---                | hGraph Mobile & Synthea Surfer   |
| 0.6.0   | ---                | HL7 Connectathon 26   |
| 0.5.2   | ---                | Synthea Surfer   |
| 0.5.1   | ---                | Hotfixes & Cleanup   |
| 0.5.0   | ---                | Meteor Impact Conference   |
| 0.4.2   | ---                | S.A.N.E.R. & AMA Gravity Modules   |
| 0.4.1   | ---                | CDC/FEMA Measures & MeasureReports   |
| 0.4.0   | ---                | Patient Charting with SMART on FHIR   |
| 0.3.2   | ---                | COVID 19 - Geocoding & Heatmaps   |
| 0.3.1   | ---                | COVID 19 - FHIR Queries   |
| 0.3.0   | ---                | HL7 FHIR Data Infrastructure Refactor   |
| 0.2.1   | ---                | Lighthouse   |
| 0.2.0   | ---                | Lighthouse Audit   |




## Security Features

### PHI debugging sessions

Settings-only, time-boxed, audited. Enabling requires operator/deployment-level access; activation and auto-expiry are recorded in both the operational log (warn) and, when the `@node-on-fhir/hipaa-compliance` package is loaded, in the HIPAA audit trail as `security` events. See `docs/LOGGING.md` §PHI debugging sessions / Security posture (threat model) for the full threat model, residual risks, and operator runbook.

### Cross-origin policy (CORS & CSP)

All cross-origin configuration lives under a single canonical settings block, `Meteor.settings.private.cors`:

```json
"private": {
  "cors": {
    "enabled": true,
    "allowedOrigins": ["https://viewer.example.com"],
    "browserPolicy": { "allowConnectOrigin": ["https://api.example.com"] }
  }
}
```

The two halves are different mechanisms pointing in opposite directions:

- **Inbound CORS** (`enabled`, `allowedOrigins`) controls which foreign origins may call this server's HTTP APIs (FHIR REST at `/baseR4`, DICOM at `/api/dicom`). Enforced by the shared middleware in `server/lib/Cors.js`, which sets the `Access-Control-*` response headers and answers `OPTIONS` preflights. When an origin is not in the allowlist, no CORS headers are emitted (the browser blocks the response) and a warning naming the origin is logged. The effective policy is logged at boot (`FHIR REST CORS ...`).
- **Outbound CSP** (`browserPolicy`) controls which origins pages *served by this server* may connect out to, via the `Content-Security-Policy` header. Consumed by `server/VaultServer.js` / Meteor BrowserPolicy.

**Defaults**: when no `private.cors` block is configured, inbound CORS is enabled with `allowedOrigins: ["*"]` — appropriate for development, **not for production**. Production deployments handling PHI should pin `allowedOrigins` to the exact origins of registered client applications (e.g. the OHIF viewer).

**Deprecated legacy keys** — still honored as fallbacks, each logging a `DEPRECATED:` warning at startup with the new location:

| Legacy key | Replaced by |
|---|---|
| `private.security.cors` | `private.cors` |
| `private.fhir.corsOrigin` | `private.cors.allowedOrigins` |
| `private.browserPolicy` | `private.cors.browserPolicy` |

New HTTP endpoints must mount `corsMiddleware()` from `server/lib/Cors.js` rather than hand-rolling `Access-Control-*` headers or introducing new settings keys. (Known debt: a few older endpoints — OAuth, Metadata, BulkData, CDS Hooks — still hardcode `Access-Control-Allow-Origin: *` and are pending consolidation.)

---

## Reporting a Vulnerability

Use this section to tell people how to report a vulnerability.

Tell them where to go, how often they can expect to get an update on a
reported vulnerability, what to expect if the vulnerability is accepted or
declined, etc.




