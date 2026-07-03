# Slash Command: /audit-phi-logs

Scan the codebase for console statements likely to interpolate PHI (Protected Health Information), classify each hit, and emit a worklist for the conversion loop.

## Description

This command scans `imports/` `server/` `npmPackages/` for `console.*` calls that may leak PHI into plain log streams. The goal is to surface candidates for migration to `Meteor.Logger.for('<module>').phi(msg, resource, {action})` (Tasks 1-3 of the structured-logging plan).

Lines already annotated `// phi-audit: ok` are skipped by all heuristics — add that marker when you have confirmed a statement is safe.

## Usage

```
/audit-phi-logs
```

Emits `docs/superpowers/plans/phi-log-worklist.txt` and reports counts.

## Critical bypass patterns to flag first

Before the three heuristic passes, always run these two targeted sweeps:

**Bypass A — JSON.stringify in log data args:**
```bash
grep -rnE "log\.(debug|info|warn|error|trace|verbose)\([^)]*JSON\.stringify" \
  server/ imports/ npmPackages/ --include="*.js" --include="*.jsx"
```
`JSON.stringify(obj)` passed as the data argument produces a STRING, which `redactPhi`
passes through untouched (the redaction net only walks plain objects). Pass the raw
object instead: `log.debug('msg', obj)` — the backend serialises it safely.
Full-body FHIR resource dumps should use `log.trace` (gated below the default
threshold), not `log.debug`.

**Bypass B — PHI interpolated into the message string:**
```bash
grep -rnE "log\.(debug|info|warn|error|trace|verbose)\(['\"].*\$\{(patient|name|birth|address|telecom|family|given)" \
  server/ imports/ npmPackages/ --include="*.js" --include="*.jsx"
```
The `msg` string is NEVER redacted — it flows through to backends verbatim. Interpolating
patient demographics or identifiers into the message text (`log.info('Patient: ' + patient.name)`)
bypasses the redaction net entirely. Keep messages static; pass variable data in the
second (data) argument where `redactPhi` can inspect and sanitise it.

## Heuristics

Three grep passes (all case-insensitive, recursive, file:line output):

**Heuristic 1 — patient objects/variables:**
```
console\.(log|warn|error|info|debug)\(.*(patient|parsedPatient|selectedPatient)
```
Catches statements referencing patient variables, which are the most likely PHI carriers.

**Heuristic 2 — Bundle/resource objects in FHIR-collection files:**
```
console\.(log|warn|error|info|debug)\(.*(Bundle|resource)\b
```
Applied to files that import FHIR collections (`from '.*Collections'`, `from '.*Patients'`, etc.). Approximate — expects some false positives.

**Heuristic 3 — direct demographic fields:**
```
console\.(log|warn|error|info|debug)\(.*(birthDate|familyName|givenName|\.name\[)
```
Catches statements interpolating demographics directly.

## Classification

For each hit, classify from the line text alone (no deep file read required):

| Label | Meaning | Action |
|-------|---------|--------|
| `phi-payload` | Logs an object likely containing PHI (patient object, Bundle, resource with demographics, full FHIR resource) | Convert to `Meteor.Logger.for('<module>').phi(msg, resource, {action})` |
| `identifier-only` | Logs only an id/reference string (e.g. `patientId`, `patient._id`, `subject.reference`) | Convert to `.debug(msg, {id})` |
| `false-positive` | The trigger word appears in a plain string message with no data payload; or `selectedPatientId`-only; or clearly non-PHI context | Annotate `// phi-audit: ok` |

**Safe default:** when genuinely ambiguous, classify `phi-payload`. Task 6 re-judges per file during conversion.

## Worklist Output Format

```
path:line<TAB>classification<TAB>line-text (trimmed)
```

One entry per hit, sorted by path. Written to `docs/superpowers/plans/phi-log-worklist.txt`.

Example lines:
```
imports/ui-fhir/patients/PatientDetail.jsx:142	phi-payload	console.log('[PatientDetail] patient:', patient);
imports/lib/FhirDehydrator.js:89	identifier-only	console.log('[flattenPatient] _id:', get(patient, '_id'));
imports/ui/Header.jsx:203	false-positive	console.log('No patient selected');
```

## Example Output

```markdown
# PHI Log Audit Results

Scanned: imports/ server/ npmPackages/
Excluded: node_modules, deprecated, test files (*.test.*, *.tests.*, tests/ dirs), phi-audit: ok lines

Heuristic 1 (patient variables):   387 raw hits
Heuristic 2 (Bundle/resource):     412 raw hits
Heuristic 3 (demographics):         52 raw hits
De-duplicated total:               ≈700-1100 entries

Classification breakdown:
  phi-payload:      ### (##%)
  identifier-only:  ### (##%)
  false-positive:   ### (##%)

Worklist written to: docs/superpowers/plans/phi-log-worklist.txt
```

## Search Commands Used

```bash
# Heuristic 1
grep -rinE 'console\.(log|warn|error|info|debug)\(.*(patient|parsedPatient|selectedPatient)' \
  imports/ server/ npmPackages/ \
  --include="*.js" --include="*.jsx" \
  --exclude-dir=node_modules --exclude-dir=deprecated --exclude-dir=tests \
  --exclude="*.test.*" --exclude="*.tests.*" \
  | grep -v 'phi-audit: ok'

# Heuristic 3
grep -rinE 'console\.(log|warn|error|info|debug)\(.*(birthDate|familyName|givenName|\.name\[)' \
  imports/ server/ npmPackages/ \
  --include="*.js" --include="*.jsx" \
  --exclude-dir=node_modules --exclude-dir=deprecated --exclude-dir=tests \
  --exclude="*.test.*" --exclude="*.tests.*" \
  | grep -v 'phi-audit: ok'

# Heuristic 2 (two-pass: collect FHIR-collection files, then grep for Bundle/resource)
grep -rl 'Mongo.Collection' \
  imports/ server/ npmPackages/ \
  --include="*.js" --include="*.jsx" \
  --exclude-dir=node_modules --exclude-dir=deprecated | \
  xargs grep -nE 'console\.(log|warn|error|info|debug)\(.*(Bundle|resource)\b' \
  | grep -v 'phi-audit: ok'
```

## Classification Guide

When running the command, apply these rules to each hit's line text:

```
Line contains patient/parsedPatient/selectedPatient AND:
  - followed by , patient or , parsedPatient (object payload) → phi-payload
  - is 'patient._id' or 'patientId' only → identifier-only
  - is a plain string "No patient selected" → false-positive

Line contains Bundle or resource AND:
  - logs the variable → phi-payload
  - just says "bundle.entry.length" or count → identifier-only

Line contains selectedPatientId (string id) → identifier-only
Line contains .name[ or familyName or givenName → phi-payload (demographics)
```

## The `// phi-audit: ok` Annotation

Add this comment at the end of a console statement line to exclude it from all future scans:

```javascript
console.log('[PatientSidebar] No patient in session'); // phi-audit: ok
console.log('[Debug] patientId:', patientId); // phi-audit: ok
```

Use it for:
- Confirmed non-PHI messages (plain strings, IDs only)
- Dev-only debugging that has been verified safe

## Exclusions

- `node_modules/` (all depths)
- `deprecated/`
- Test files: `*.test.js`, `*.test.jsx`, `*.tests.js`, `*.tests.jsx`
- Test directories: `tests/`
- Lines containing `phi-audit: ok`

## When to Use

- Before any PHI-logging conversion sprint (generates the conversion worklist)
- After a large merge, to check for newly introduced PHI logs
- As part of HIPAA audit trail implementation
- When the structured-logging migration (Task 6) is about to begin

## Related

- Hook: `.claude/hooks/post-tool-use-phi-logging.md` — warns on PHI-risky console statements after each file edit
- Plan: `docs/superpowers/plans/2026-07-01-structured-logging.md` — the structured-logging roadmap
- Plan: `docs/superpowers/plans/phi-log-worklist.txt` — the generated worklist (Task 6 input)
- Rules: `.claude/rules/anti-patterns/patient-context.md` — patient context patterns
