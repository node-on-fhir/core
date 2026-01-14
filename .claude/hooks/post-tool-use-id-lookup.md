# Post Tool Use Hook: ID Lookup Anti-Pattern Check

## Trigger
After any Edit or Write operation to `.js` or `.jsx` files

## Purpose
Detect the #1 bug pattern in Honeycomb: using OR logic (`||`) when looking up records by ID, which causes catastrophic ID collisions.

## The Anti-Pattern

**NEVER use OR logic when looking up records by ID:**

```javascript
// ❌ WRONG - Can match multiple records causing ID collisions!
const patientId = get(patient, 'id') || get(patient, '_id');
const record = collection.find(p => p.id === value || p._id === value);
const onClick = handleRowClick.bind(this, item._id || item.id);
```

**Why this is catastrophic:**

After data transformation functions like `flattenPatient()`, records have BOTH `_id` and `id` fields:

```javascript
{
  _id: '5832e8a0ea861706b1857c49',  // MongoDB primary key
  id: '23c65305-e7da-3fa8-e7c9-92d6199dd40e'  // FHIR identifier
}
```

Using OR logic creates ID collisions:
- Patient A: `{ _id: 'abc123', id: 'xyz789' }`
- Patient B: `{ _id: 'xyz789', id: 'def456' }`
- Looking up 'xyz789' with OR logic matches **BOTH** patients!
- `.find()` returns whichever comes first (wrong patient)

**Real-World Impact:** This bug caused test patients to open the wrong patient details page, showing "Kylee Leannon" instead of the test patient. With 293+ patients in the database, ID collisions are inevitable.

## Detection Patterns

Check for these patterns in the changed file:

1. **OR assignment pattern:**
   ```bash
   grep -n "\.id || \._id\|_id || \.id" "$CHANGED_FILE"
   ```

2. **OR comparison pattern:**
   ```bash
   grep -n "p\.id === .* || p\._id ===\|_id === .* || .*\.id ===" "$CHANGED_FILE"
   ```

3. **onClick handler pattern:**
   ```bash
   grep -n "onClick.*\._id || .*\.id\|onClick.*\.id || \._id" "$CHANGED_FILE"
   ```

4. **MongoDB query pattern:**
   ```bash
   grep -n "\$or.*_id.*\\.id\|\$or.*\\.id.*_id" "$CHANGED_FILE"
   ```

## Action When Detected

Display warning with:
- File and line number
- The problematic code
- Why it's wrong
- The correct fix

**Example Output:**

```
⚠️  ID Lookup Anti-Pattern Detected in CommunicationsTable.jsx

Line 234: onClick={ handleRowClick.bind(this, communications[i]._id || communications[i].id)}

🚨 This causes ID collisions! When records have both _id and id fields,
   OR logic can match multiple records. Patient A's id might equal Patient B's _id.

FIX: Use only _id (MongoDB primary key)
     onClick={ handleRowClick.bind(this, communications[i]._id)}

Should I fix this automatically? [yes/no]
```

## Correct Patterns

**✅ CORRECT - Use MongoDB _id (primary key) only:**

```javascript
const patientId = get(patient, '_id');
const record = collection.find(p => p._id === value);
const onClick = handleRowClick.bind(this, item._id);
```

**When You Need FHIR ID:**

Get it from the found record AFTER lookup, don't use it for the lookup itself:

```javascript
// Find by MongoDB _id
const patient = Patients.findOne({ _id: mongoId });

// Then extract FHIR id for navigation or display
const fhirId = patient.id;
navigate(`/patients/${fhirId}`);
```

## MongoDB _id is the Source of Truth

MongoDB `_id` is the primary key for all record lookups. FHIR `id` should only be used for:
- Display purposes
- FHIR API compliance
- Navigation URLs (after lookup)
- Reference strings in FHIR resources

## Skip Conditions

Do NOT flag these patterns:
- Comments (lines starting with `//` or within `/* */`)
- String literals that mention "id" (e.g., `"Please provide an ID"`)
- Variable names like `identifier`, `identity`, `idiom` (false positives)
- Documentation examples showing the anti-pattern explicitly marked as wrong

## Auto-Fix Option

If user approves, automatically fix the pattern:

1. **For onClick handlers:**
   - Replace `item._id || item.id` with `item._id`

2. **For assignments:**
   - Replace `get(obj, 'id') || get(obj, '_id')` with `get(obj, '_id')`

3. **For comparisons:**
   - Replace `p.id === val || p._id === val` with `p._id === val`

4. **For MongoDB queries:**
   - Replace `{$or: [{_id: id}, {id: id}]}` with `{_id: id}`

## Integration

This hook runs automatically after every Edit or Write to JavaScript files.
It provides:
- Instant feedback on the #1 bug pattern
- Educational explanation for why it's wrong
- Optional auto-fix
- Zero cost (grep is instant)

---

Reference: Root CLAUDE.md lines 84-133
