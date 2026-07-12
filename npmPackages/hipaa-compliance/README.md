# @node-on-fhir/hipaa-compliance

HIPAA audit logging and compliance policy management for Honeycomb / NodeOnFHIR
(ONC §170.315(d)(2), (d)(3), (d)(10)). Meteor v3 + React + Material-UI.

## Overview

The package makes the core **FHIR `AuditEvents` collection the single,
canonical audit store**. It provides:

- **Automated audit logging** — collection hooks (create/update/delete, optional
  read logging) and account hooks (login/logout/failed login) emit FHIR R4B
  AuditEvent resources
- **Fail-closed, role-gated access** — audit data is only visible/exportable to
  `admin`, `compliance-officer`, `hipaa-officer`, or `auditor` roles; every
  check denies unless an affirmative role match is found
- **Tamper evidence** — RSA-SHA256 signatures over each event, keyed to the
  installation's **UDAP x509 key** and verifiable against its certificate
- **Field-level encryption (optional)** — person-identifying display fields
  encrypted with per-field AES-256-GCM data keys wrapped by the UDAP RSA public
  key; stored records stay encrypted, publications decrypt in-flight for
  authorized viewers
- **Append-only records** — no code path updates or deletes an audit event;
  key rotation never rewrites history (old events verify/decrypt via the keyId
  embedded in each record)
- **Compliance reporting + export** — reports, CSV/JSON/FHIR-Bundle export,
  integrity verification
- **Policy management** — 20+ HIPAA policy markdown templates served at
  `/hipaa/policies` (inherited from the Catalyze open-source policy set; the
  content still carries hosted-PaaS language and needs adaptation before use as
  a real Book of Evidence)

## Quick Start

The package is registered (disabled) in `workflows/workflows.json`; activate it
with `EXTRA_WORKFLOWS`:

```bash
EXTRA_WORKFLOWS=@node-on-fhir/hipaa-compliance meteor run \
  --settings npmPackages/hipaa-compliance/configs/settings.hipaa-dev.json
```

Routes: `/hipaa/audit-log` (role-gated), `/hipaa/policies`,
`/hipaa/policies/:policyId`.

## Canonical Settings Schema

`configs/settings.hipaa-dev.template.json` is the tracked reference instance
of this schema. Copy it to `settings.hipaa-dev.json` (local development) or
`settings.hipaa.json` (production-shaped) — both are gitignored by the
repo-wide `settings.*.json` rule so real keys never land in git.

### `public.organization` — feeds policy template substitution

| Path | Type | Default | Read by |
|------|------|---------|---------|
| `name` / `address` / `privacyOfficer` / `securityOfficer` | String | `[…]` placeholders | `lib/PolicyGenerator.js` |

### `public.security`

| Path | Type | Default | Read by |
|------|------|---------|---------|
| `passwordMinLength` | Number | 12 | PolicyGenerator |
| `maxLoginAttempts` | Number | 5 | PolicyGenerator |

### `public.hipaa.features` — feature gates

| Path | Type | Default | Gates |
|------|------|---------|-------|
| `auditLogging` | Boolean | `true` | all event logging (`lib/HipaaLogger.js`) |
| `automaticHooks` | Boolean | `true` | collection + account hooks (`server/startup.js`) |
| `complianceReporting` | Boolean | `true` | (informational) |
| `policyManagement` | Boolean | `true` | (informational) |
| `dataExport` | Boolean | `true` | `hipaa.exportAuditTrail`, `hipaa.auditEvents.exportCsv` |
| `encryptedExport` | Boolean | `false` | `hipaa.generateEncryptedExport` |
| `integrityChecking` | Boolean | `true` | `hipaa.verifyAuditIntegrity` |

### `public.hipaa.security`

| Path | Type | Default | Read by |
|------|------|---------|---------|
| `requireSecondaryAuth` | Boolean | `false` | `SecurityValidators.validateCurrentUser` |
| `authTimeoutMinutes` | Number | 30 | `SecurityValidators.validateSecondaryAuth` |
| `sessionTimeout` | Number | 30 | PolicyGenerator |

### `public.hipaa.compliance`

| Path | Type | Default | Read by |
|------|------|---------|---------|
| `environment` | `development` \| `staging` \| `production` | `production` | startup validation (production refuses to boot with `encryptionLevel: aes` and no key), debug gate, PolicyGenerator |
| `auditDetailLevel` | `minimal` \| `standard` \| `verbose` | `standard` | HipaaLogger (verbose adds IP/user-agent/session attribution) |
| `dataRetentionYears` | Number | 7 | retention advisory (`cleanupOldAuditLogs`), PolicyGenerator |

### `public.hipaa.ui`

| Path | Type | Default | Read by |
|------|------|---------|---------|
| `defaultPageSize` | Number | 25 | `hipaa.auditEvents` publication |

### `public.hipaa.policies`

| Path | Type | Default | Read by |
|------|------|---------|---------|
| `backupFrequency` | String | `daily` | PolicyGenerator (`{{BACKUP_FREQUENCY}}`) |
| `networkScanningSoftware` | String | placeholder | PolicyGenerator (`{{NETWORK_SCANNING_SOFTWARE}}` / legacy `{{getNetworkScanningSoftware}}`) |

### `private.x509` — the UDAP key (audit crypto key source)

Audit signing and encryption ride the installation's UDAP x509 material — the
same key `imports/lib/UdapMethods.js` uses for client-assertion JWTs. There is
**no separate audit secret**; one key-management surface per installation.

| Path | Type | Purpose |
|------|------|---------|
| `privateKey` | PEM String | active signing/unwrapping key. `keyId` = SHA-256 thumbprint of its SPKI public part |
| `certificate` | PEM String | the matching certificate (external signature verification) |
| `previousKeys` | `{ <keyId>: <PEM> }` | retained historical keys — old events decrypt/verify forever via the keyId embedded in their envelopes/extensions |

**Rotation**: install the new PEM as `privateKey`, move the old PEM into
`previousKeys` keyed by its thumbprint, then call
`Meteor.call('hipaa.rotateEncryptionKey')` to stamp + audit the rotation. No
stored audit record is ever rewritten.

**Dev key generation** (never commit a real key; settings files with real
credentials must be gitignored):

```bash
openssl genrsa 2048            # paste into private.x509.privateKey (JSON-escaped)
```

### `private.accounts`

| Path | Type | Default | Purpose |
|------|------|---------|---------|
| `defaultRole` | [String] | `["user","patient"]` | roles assigned at signup. The dev settings add `admin` so local logins pass the fail-closed audit gates |

### `private.hipaa.audit`

| Path | Type | Default | Purpose |
|------|------|---------|---------|
| `immutable` | Boolean | `false` (core) / `true` (hipaa configs) | when true, the core `auditEvents.update` / `auditEvents.remove` methods refuse to run — append-only enforcement |

### `private.hipaa.security`

| Path | Type | Default | Purpose |
|------|------|---------|---------|
| `encryptionLevel` | `none` \| `aes` | `none` | field-level encryption of stored audit events. `advanced` is accepted as an alias of `aes`; the old Base64 `basic` mode was removed (it provided no protection) and is treated as `none`, loudly |
| `allowDebugAccess` | Boolean | `false` | debug gate (development environment only) |

### `private.hipaa.encryption`

| Path | Type | Default | Purpose |
|------|------|---------|---------|
| `algorithm` | String | `aes-256-gcm` | (informational — envelopes are self-describing) |
| `keyRotationDays` | Number | 90 | rotation-due advisory |
| `lastKeyRotation` | Date/null | null | stamped by `hipaa.rotateEncryptionKey` |

### `private.hipaa.hooks`

| Path | Type | Default | Purpose |
|------|------|---------|---------|
| `enableCollectionHooks` | Boolean | `true` | master switch for collection hooks |
| `monitoredCollections` | [String] | all known FHIR collections | which collections get create/update/delete hooks (`AuditEvents` is always excluded to prevent audit-of-audit loops) |
| `excludeSystemUsers` | [String] | `["system","migration-user"]` | userIds whose writes are not audited |
| `logReadAccess` | Boolean | `false` | also log patient-specific find() access |

### `private.hipaa.reporting`

| Path | Type | Default | Purpose |
|------|------|---------|---------|
| `maxExportRecords` | Number | 10000 | export size cap |
| `requireApprovalForExport` | Boolean | `false` | exports must carry an `approvalId` |

### Environment variable overrides (`server/startup.js`)

| Variable | Sets |
|----------|------|
| `HIPAA_ENCRYPTION_KEY` | `private.x509.privateKey` (only when unset; deprecated — configure the x509 key directly) |
| `HIPAA_SECURITY_LEVEL` | `private.hipaa.security.encryptionLevel` |
| `HIPAA_RETENTION_YEARS` | `public.hipaa.compliance.dataRetentionYears` |
| `HIPAA_ENVIRONMENT` | `public.hipaa.compliance.environment` |
| `HIPAA_ALLOW_DEBUG` | `private.hipaa.security.allowDebugAccess` |

## Architecture

### One audit store

`HipaaLogger` maps flat events to FHIR R4B AuditEvent resources
(`lib/AuditEventMapping.js`) and inserts them into
`global.Collections.AuditEvents`. Publications, reports, exports, and the
integrity checker all read the same collection with FHIR-path queries
(`type.code`, `recorded`, `agent.who.reference`, `patient.reference`) matching
the indexes created at startup. The legacy package-local `HipaaAuditLog`
collection is gone.

### Event mapping (flat → FHIR)

| Flat field | FHIR path |
|------------|-----------|
| `eventType` | `type.code` (+ derived `action` C/R/U/D/E and `outcome`) |
| `eventDate` | `recorded` |
| `message` | `outcomeDesc` |
| `userId` / `userName` / `userEmail` / `userRoles` | `agent[0]` (`who.reference` = `User/<id>`, `who.display`, `altId`, `role[]`) |
| `patientId` / `patientName` | `patient[0]` + a Person/Patient `entity` entry |
| `resourceType` / `resourceId` | `entity[0].what.reference` |
| `collectionName`, `metadata` | `entity[0].detail[]` |
| encryption level, signature, keyId | `extension[]` (`urn:honeycomb:hipaa:*`) |

### Authorization (fail-closed)

`lib/SecurityValidators.js` reads the union of `alanning:roles` v4 assignments
and the plain `user.roles` array on the user document. Every check is async and
denies on missing roles, lookup failure, or absent role data — there is no
"roles unavailable → allow" branch.

### log.phi() routing

`server.js` re-exports `HipaaLogger`, so the generated workflow server-loader
registers it on `Package['@node-on-fhir/hipaa-compliance']` and the core
logging facade routes `log.phi()` calls into the audit trail
(`imports/startup/both/loggingSetup.js`).

## API Reference

### Logging

```javascript
import { HipaaLogger } from '@node-on-fhir/hipaa-compliance';        // client
// server code inside the package imports from './lib/HipaaLogger'

HipaaLogger.logPatientAccess(patientId, 'view');
HipaaLogger.logDataModification('Patients', recordId, 'update');
HipaaLogger.logSystemEvent('login', { userId });
HipaaLogger.logSecurityEvent('denied', { userId, message: '...' });
HipaaLogger.logEvent({ eventType, message, resourceType, resourceId,
                       collectionName, patientId, patientName, metadata });
HipaaLogger.logAuditEvent(fhirAuditEventResource);   // pre-built FHIR resource
```

### Server methods

| Method | Auth | Purpose |
|--------|------|---------|
| `hipaa.logEvent(flatEvent)` | logged-in context attributed | log a flat event |
| `hipaa.logAuditEvent(fhirResource)` | validated user | log a FHIR AuditEvent |
| `hipaa.generateReport(filters)` | `canViewAuditLog` | stats + event list |
| `hipaa.exportAuditTrail({format, dateRange, limit})` | `canExportAuditData` + `dataExport` gate | csv/json/fhir export |
| `hipaa.auditEvents.exportCsv(filters)` | `canExportAuditData` + `dataExport` gate | audit-log page CSV |
| `hipaa.getAuditStatistics(dateRange)` | `canViewAuditLog` | daily aggregates |
| `hipaa.verifyAuditIntegrity(dateRange)` | admin/compliance + `integrityChecking` gate | signature verification |
| `hipaa.generateEncryptedExport(options)` | export roles + `encryptedExport` gate | encrypted export bundle |
| `hipaa.rotateEncryptionKey()` | admin | acknowledge x509 key rotation |
| `hipaa.getPolicy(policyId)` / `hipaa.getAllPolicies()` | public | policy content |

### Publications

| Publication | Auth | Payload |
|-------------|------|---------|
| `hipaa.auditEvents(filters)` | `canViewAuditLog` (+ `canViewPatientAudits` for patient filters) | decrypted AuditEvents |
| `hipaa.patientAuditTrail(patientId)` | `canViewPatientAudits` | decrypted patient events |
| `hipaa.auditStatistics(dateRange)` | `canViewAuditLog` | synthetic summary doc |
| `hipaa.securityEvents(limit)` | admin | recent security events |

## Testing

```bash
# App-level mocha suite (includes the package's mapping/crypto/auth tests)
meteor test --once --driver-package meteortesting:mocha

# ONC §170.315(d)(1) nightwatch test (runs in CI base-ehr group)
# npmPackages/hipaa-compliance/tests/nightwatch/170.315.d.1.test.js
```

## License

MIT License - see LICENSE file for details
