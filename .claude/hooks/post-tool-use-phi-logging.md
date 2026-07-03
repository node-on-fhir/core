# Post Tool Use Hook: PHI Logging Check

## Trigger

After any Edit or Write operation to `*.js` or `*.jsx` files anywhere in the repo.

## Purpose

Catch PHI-risky console statements immediately after they are written, before they are committed. Warn only — never block. Raw `console.*` is fine for non-PHI dev chatter; this hook flags statements that may interpolate patient objects, demographics, or FHIR resources into plain log streams.

## Detection Patterns

Grep the edited file for Heuristic 1 and Heuristic 3 from `/audit-phi-logs`, excluding lines already annotated:

### Heuristic 1 — patient variables

```bash
grep -nE 'console\.(log|warn|error|info|debug)\(.*(patient|parsedPatient|selectedPatient)' "$CHANGED_FILE" \
  | grep -v 'phi-audit: ok'
```

Catches console statements referencing `patient`, `parsedPatient`, or `selectedPatient`.

### Heuristic 3 — direct demographic fields

```bash
grep -nE 'console\.(log|warn|error|info|debug)\(.*(birthDate|familyName|givenName|\.name\[)' "$CHANGED_FILE" \
  | grep -v 'phi-audit: ok'
```

Catches console statements interpolating demographic fields directly.

> **Note:** Heuristic 2 (Bundle/resource in FHIR-collection files) is not run per-edit — it requires a two-pass scan across multiple files. Run `/audit-phi-logs` to catch those.

## Warn Message

If either heuristic finds a match:

```
⚠️  PHI-risky console statement in <filename>

Line <N>: <matched line (trimmed)>
[Line <M>: <matched line (trimmed)>]

PHI-risky console statement — use `Meteor.Logger.for('<module>').phi(...)` (see /audit-phi-logs).
Raw console is fine for non-PHI dev chatter.

To silence this warning for a confirmed-safe line, add:  // phi-audit: ok
```

## Action

**Warn only.** Never block the edit, never auto-fix, never ask to fix. The developer decides whether to:

1. Convert to `Meteor.Logger.for('<module>').phi(msg, resource, {action})` if the statement logs PHI
2. Convert to `.debug(msg, {id})` if it only logs an identifier
3. Add `// phi-audit: ok` to confirm the line is safe (no PHI payload)

## Skip Conditions

Do NOT warn when:

- The matching line contains `phi-audit: ok`
- The file is a test file (`*.test.js`, `*.test.jsx`, `*.tests.js`, `*.tests.jsx`)
- The file is under `tests/`, `node_modules/`, or `deprecated/`
- The match is a comment (line starts with `//` or `*` after trimming)

## Example Warning

```
⚠️  PHI-risky console statement in PatientDetail.jsx

Line 142: console.log('[PatientDetail] patient:', patient);
Line 203: console.log('[PatientDetail] parsedPatient:', parsedPatient);

PHI-risky console statement — use `Meteor.Logger.for('<module>').phi(...)` (see /audit-phi-logs).
Raw console is fine for non-PHI dev chatter.

To silence this warning for a confirmed-safe line, add:  // phi-audit: ok
```

## Safe Patterns (no warning)

```javascript
// Identifier only — warn-free after annotation
console.log('[PatientDetail] loading patient._id:', patient._id); // phi-audit: ok

// Plain string — warn-free after annotation
console.log('[PatientDetail] No patient selected'); // phi-audit: ok

// Structured PHI log — correct pattern, no console at all
Meteor.Logger.for('PatientDetail').phi('loading patient', patient, { action: 'read' });

// Debug-level id log — correct pattern
Meteor.Logger.for('PatientDetail').debug('patient id', { id: patient._id });
```

## Integration

Runs automatically after every Edit/Write to `.js`/`.jsx` files. Zero cost (single grep). Prevents accidental PHI leakage into plain log streams and keeps the conversion worklist from growing.

---

Reference: `.claude/commands/audit-phi-logs.md` (full scan + worklist generation), `docs/superpowers/plans/2026-07-01-structured-logging.md` (roadmap), `docs/superpowers/plans/phi-log-worklist.txt` (Task 6 input)
