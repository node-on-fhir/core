# Anti-Pattern: ID Lookup with OR Logic

## The Problem

**NEVER use OR logic when looking up records by ID.** This is the #1 bug in Honeycomb and causes catastrophic ID collisions that return wrong records.

## Why This Happens

After data transformation (e.g., `flattenPatient()`), records have **BOTH** `_id` and `id` fields:

```javascript
{
  _id: '5832e8a0ea861706b1857c49',  // MongoDB primary key
  id: '23c65305-e7da-3fa8-e7c9-92d6199dd40e'  // FHIR identifier
}
```

Using OR logic creates ambiguity:
- Patient A: `{ _id: 'abc123', id: 'xyz789' }`
- Patient B: `{ _id: 'xyz789', id: 'def456' }`
- Looking up `'xyz789'` with OR logic matches **BOTH** patients!
- `.find()` returns whichever comes first (wrong patient)

## ❌ WRONG Patterns

```javascript
// OR logic in variable assignment
const patientId = get(patient, 'id') || get(patient, '_id');
const patientId = patient.id || patient._id;

// OR logic in collection queries
const record = Patients.findOne(p => p.id === value || p._id === value);
const record = Patients.findOne({ $or: [{ id: value }, { _id: value }] });

// OR logic in array methods
const patient = patients.find(p => p.id === id || p._id === id);
const filtered = patients.filter(p => p.id === id || p._id === id);

// OR logic in onClick handlers
onClick={() => {
  const id = record._id || record.id;
  navigate(`/patients/${id}`);
}}

// OR logic in useTracker
const patient = useTracker(() => {
  return Patients.findOne({ $or: [{ id: patientId }, { _id: patientId }] });
}, [patientId]);
```

## ✅ CORRECT Patterns

```javascript
// Use MongoDB _id (primary key) for lookups
const patientId = get(patient, '_id');
const record = Patients.findOne({ _id: value });
const patient = patients.find(p => p._id === id);

// If you receive FHIR id in URL, look up by _id first
const urlId = params.id; // From URL parameter

// Try _id first
let patient = Patients.findOne({ _id: urlId });

// If not found, try FHIR id as fallback
if (!patient) {
  patient = Patients.findOne({ id: urlId });
}

// Extract FHIR id AFTER lookup for navigation/display
const patient = Patients.findOne({ _id: mongoId });
const fhirId = patient.id; // Safe to use for display/navigation
navigate(`/patients/${fhirId}`);
```

## Real-World Impact

This bug caused test patients to open the wrong patient details page, showing "Kylee Leannon" instead of the test patient. With 293+ patients in the database, ID collisions are inevitable.

## Rule Summary

**MongoDB `_id` is the source of truth** for all record lookups. FHIR `id` is just a field and should only be used for:
- Display purposes
- FHIR API compliance
- Navigation URLs (after lookup)

**Never use OR logic (`||` or `$or`) when dealing with record IDs.**

## Detection

The `post-tool-use-id-lookup.md` hook automatically detects this pattern:

```bash
grep -n "\.id || \._id\|_id || \.id" file.js
grep -n "onClick.*\._id || .*\.id" file.jsx
grep -n "\$or.*_id.*\.id" file.js
```

Use `/audit-id-lookups` command to scan the entire codebase.

## Related

- Hook: `.claude/hooks/post-tool-use-id-lookup.md`
- Command: `.claude/commands/audit-id-lookups.md`
- See root `CLAUDE.md` lines 84-133 for detailed explanation
