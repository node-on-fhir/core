# TEFCA Implementation Game Plan

## Overview

Implementation roadmap for TEFCA Facilitated FHIR support in Honeycomb EHR, based on SOP Version 2.0 Draft (October 2025).

**Target Role**: Responding Node (FHIR server responding to queries from TEFCA participants)

---

## Current Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| UDAP Discovery (`.well-known/udap`) | ✅ Done | Implemented |
| Signed Metadata JWT | ✅ Done | Fixed x509 signing Jan 2026 |
| SSRAA Dynamic Registration | ✅ Done | `/auth/register` endpoint |
| SSRAA Token Endpoint | ✅ Done | `/auth/token` endpoint |
| Authorization Code Grant | ✅ Done | Via (g)(10) certification |
| US Core Decorators | ✅ Done | `packages/us-core` |
| X-Provenance Headers | ✅ Done | JIT implementation |
| Patient $match | ⚠️ Partial | Package exists, name matching broken |
| Community ID Support | ❌ Missing | TEFCA community URN not implemented |
| QHIN Contract | ❌ Missing | Not yet contracted with a QHIN |
| RCE Directory Registration | ❌ Missing | Cannot register without QHIN |

---

## Key Milestones & Deadlines

| Date | Milestone |
|------|-----------|
| July 1, 2026 | Testing systems available for all production nodes |
| November 1, 2026 | All QHINs capable of SSRAA-based authentication |
| January 1, 2027 | All new FHIR nodes in production Directory MUST support SSRAA |
| Q1 2027 | Full SSRAA v1.1.0 mandatory for all FHIR exchange |

---

## Blockers (Business/Administrative)

### 1. QHIN Contract Required
- Must contract with a Qualified Health Information Network (QHIN)
- Candidate QHINs: EMR Direct, CommonWell, Carequality, etc.
- QHIN provides: certificate issuance, directory registration, network access

### 2. RCE Directory Registration
- Cannot register FHIR endpoints until QHIN contract in place
- QHIN submits our endpoint information to RCE Directory
- Directory entry must include: FHIR endpoint URL, supported auth methods, Organization Resource ID

---

## Remaining Technical Work

### Priority 1: Fix Patient $match

**Problem**: Name matching not working in `packages/patient-matching`

**Possible Causes**:
- Package not loaded in Meteor settings
- Missing index on patient name fields
- Algorithm configuration issue

**Action Items**:
- [ ] Verify `clinical:patient-matching` is in `.meteor/packages`
- [ ] Verify package is enabled in settings: `settings.private.fhir.patient-matching.enabled`
- [ ] Test $match with sample patient demographics
- [ ] Debug name matching algorithm

**Location**: `packages/patient-matching/`

### Priority 2: Community ID Support

**Problem**: No support for TEFCA community identifier

**Required**: Include community URN in UDAP metadata and JWT assertions

```javascript
// In .well-known/udap response
{
  "community": "urn:oid:2.16.840.1.113883.3.7204.1.5"
}

// In JWT assertions (hl7-b2b extension)
{
  "extensions": {
    "hl7-b2b": {
      "organization_id": "Organization/[RCE-Directory-ID]",  // From RCE Directory
      // ...
    }
  }
}
```

**Action Items**:
- [ ] Add `community` field to `.well-known/udap` endpoint
- [ ] Add community URN to signed_metadata JWT
- [ ] Update hl7-b2b extension validation to require `organization_id`
- [ ] Store RCE Directory Organization ID in settings (once registered)

**Location**: `server/Metadata.js` or UDAP endpoint implementation

### Priority 3: Exchange Purpose SANs in Certificate

**When QHIN contract is in place**, generate new CSR with Exchange Purpose SANs:

```
URI.1 = urn:oid:2.16.840.1.113883.3.7204.1.5.2.1.TPO    (Treatment)
URI.2 = urn:oid:2.16.840.1.113883.3.7204.1.5.2.1.IAS    (Individual Access)
```

**CSR Config Template** (`private/tefca/tefca-csr.cnf`):
```ini
[req]
default_bits = 4096
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = req_ext

[dn]
C = US
ST = [State]
L = [City]
O = [Organization Legal Name]
CN = fhir.[domain].org

[req_ext]
subjectAltName = @alt_names

[alt_names]
URI.1 = urn:oid:2.16.840.1.113883.3.7204.1.5.2.1.TPO
URI.2 = urn:oid:2.16.840.1.113883.3.7204.1.5.2.1.IAS
```

---

## What We Have (Reference)

### US Core Decorators
```
packages/us-core/
├── lib/
│   ├── ProfileDecorator.js        # Base class
│   └── decorators/
│       ├── PatientDecorator.js    # US Core Patient must-support
│       └── OrganizationDecorator.js  # US Core Organization (fixed Jan 2026)
└── server/
    └── index.js                   # Exports ProfileDecorators global
```

### Patient Matching
```
packages/patient-matching/         # $match implementation (needs debugging)
```

### UDAP/SSRAA
- `.well-known/udap` endpoint
- Dynamic client registration
- Token endpoint with hl7-b2b extension support
- Signed metadata JWT (fixed x509 signing)

### Provenance
- X-Provenance header support
- JIT /Provenance endpoint

### (g)(10) Compliance
- Authorization Code Grant flow
- SMART scopes
- Granular scope filtering

---

## Onboarding Checklist

### Phase 1: Technical Readiness (Now)
- [ ] Fix $match patient name matching
- [ ] Add community ID to UDAP metadata
- [ ] Verify US Core v6.1.0 compliance for all resources
- [ ] Test with Inferno US Core test suite

### Phase 2: QHIN Engagement
- [ ] Select QHIN partner (EMR Direct?)
- [ ] Complete QHIN application/contract
- [ ] Receive QHIN-specific onboarding requirements

### Phase 3: Certificate & Registration
- [ ] Generate CSR with Exchange Purpose SANs
- [ ] Submit CSR to QHIN for certificate issuance
- [ ] Install signed certificate
- [ ] QHIN submits our endpoint to RCE Directory

### Phase 4: Testing
- [ ] Connect to QHIN test environment
- [ ] Test Patient Discovery → $match → Query flow
- [ ] Test with other TEFCA participants in sandbox

### Phase 5: Production
- [ ] QHIN promotes endpoint to production directory
- [ ] Begin live TEFCA exchange

---

## Quick Reference: Required Endpoints

| Endpoint | Status | Purpose |
|----------|--------|---------|
| `/.well-known/udap` | ✅ | UDAP server metadata |
| `/auth/register` | ✅ | SSRAA dynamic client registration |
| `/auth/token` | ✅ | OAuth token endpoint |
| `/fhir/r4/metadata` | ✅ | CapabilityStatement |
| `/fhir/r4/Patient/$match` | ⚠️ | Patient matching (name broken) |
| `/fhir/r4/Patient` | ✅ | Patient resource |
| `/fhir/r4/Provenance` | ✅ | Provenance (JIT) |

---

## Connectathon Notes (January 2026)

### Fixed This Session
- POST create returns resource directly (not Bundle)
- Server ignores client `id` on POST (FHIR spec compliant)
- Server ignores `meta.versionId` on PUT
- US Core OrganizationDecorator valid NPI (`1234567893`) and state (`CA`)
- UDAP signed_metadata JWT uses x509 private key

### Key Finding: PUT vs POST
Per FHIR R4 spec: "If the client wishes to have control over the id of a newly submitted resource, it should use the update interaction instead."

- **POST**: Server assigns ID
- **PUT**: Client specifies ID (for update OR create)

Inferno TOC test may be incorrectly using POST for client-assigned IDs.

---

## References

### Specifications
- [SOP v2.0 Draft (local)](./TEFCA-SOP-Facilitated-FHIR-Implementation-2.0-Draft-October_508.pdf)
- [SOP v2.0 Draft (RCE)](https://rce.sequoiaproject.org/wp-content/uploads/2025/10/SOP-Facilitated-FHIR-Implementation-2.0-Draft-October_508.pdf)
- [HL7 SSRAA IG v1.1.0](https://hl7.org/fhir/us/udap-security/STU1.1/)
- [US Core IG v6.1.0](https://hl7.org/fhir/us/core/STU6.1/)

### RCE & Directory
- [RCE Website](https://rce.sequoiaproject.org/tefca-and-rce-resources/)
- [TEFCA Map Search (Directory)](https://rce.sequoiaproject.org/tefca-map-search/)

### Tools & Portals
- [UDAP Editor (FHIR Labs)](https://udaped.fhirlabs.net/)
- [EMR Direct PHIMail Portal](https://www.emrdirect.com/phimail/login.php)
- [App Studio (Interop Engine)](https://appstudio.interopengine.com/)

### Project Notes
- [Connectathon Notes (Claude)](https://claude.ai/share/af9d146d-f0f1-4f7b-849c-44c1ce7cc648)
- [TEFCA Implementation Planning Doc](https://docs.google.com/document/d/1T6fmU-5RIril32Zf4vEuWKNXG9Qp6UVd32ZpVNXC_Xo/edit?tab=t.0)
