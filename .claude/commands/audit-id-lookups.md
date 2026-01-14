# Slash Command: /audit-id-lookups

Scan the codebase for the #1 bug pattern in Honeycomb: using OR logic (`||`) when looking up records by ID.

## Description

This command finds all instances of the ID lookup anti-pattern that causes catastrophic ID collisions. It scans JavaScript files for patterns like:
- `item._id || item.id`
- `p.id === value || p._id === value`
- `{$or: [{_id: id}, {id: id}]}`

These patterns cause bugs because after data transformation, records have BOTH `_id` (MongoDB primary key) and `id` (FHIR identifier), leading to wrong records being matched.

## Usage

```
/audit-id-lookups
```

Optional: Scan specific directory
```
/audit-id-lookups imports/ui-fhir
```

## What It Does

1. **Scans for anti-patterns:**
   - OR assignment: `const id = obj._id || obj.id`
   - OR comparison: `p.id === val || p._id === val`
   - onClick handlers: `onClick={handle(item._id || item.id)}`
   - MongoDB queries: `{$or: [{_id: x}, {id: x}]}`

2. **Reports violations** with:
   - File and line number
   - The problematic code
   - Why it's wrong
   - Suggested fix

3. **Offers to fix** violations automatically

## Example Output

```markdown
# ID Lookup Anti-Pattern Audit Results

Found **8 violations** across 5 files:

## ❌ CRITICAL - Table onClick Handlers (3 violations)

### imports/ui-fhir/communications/CommunicationsTable.jsx:234
```javascript
onClick={ handleRowClick.bind(this, communications[i]._id || communications[i].id)}
```

**Problem:** When both _id and id exist, this can pass the wrong ID

**Fix:**
```javascript
onClick={ handleRowClick.bind(this, communications[i]._id)}
```

---

### imports/ui-fhir/encounters/EncountersTable.jsx:189
```javascript
<TableRow onClick={() => handleRowClick(encounter._id || encounter.id)}>
```

**Problem:** OR logic can match multiple records

**Fix:**
```javascript
<TableRow onClick={() => handleRowClick(encounter._id)}>
```

---

## ❌ CRITICAL - Data Lookup Methods (2 violations)

### imports/api/patients/methods.js:45
```javascript
const patient = Patients.findOne({$or: [{_id: id}, {id: id}]});
```

**Problem:** MongoDB query matches multiple patients with ID collision

**Fix:**
```javascript
const patient = Patients.findOne({_id: id});
```

---

## ⚠️  WARNING - ID Assignment (3 violations)

### imports/ui-fhir/observations/ObservationDetail.jsx:67
```javascript
const patientId = get(selectedPatient, 'id') || get(selectedPatient, '_id');
```

**Problem:** Fallback logic can return wrong ID

**Fix:**
```javascript
const patientId = get(selectedPatient, '_id');
```

---

## Summary

- **Critical (onClick/queries):** 5 violations - Must fix
- **Warning (assignments):** 3 violations - Should fix
- **Total:** 8 violations

## Real-World Impact

This bug caused test patients to open the wrong patient details page, showing "Kylee Leannon" instead of the test patient. With 293+ patients in the database, ID collisions are inevitable.

## Recommendations

1. Fix all Critical violations immediately
2. Fix Warning violations to prevent future bugs
3. Use MongoDB `_id` as the source of truth for all lookups
4. Only use FHIR `id` for display, navigation, and API compliance

---

Would you like me to:
1. Fix all violations automatically
2. Fix only Critical violations
3. Show me the fixes for manual review
4. Skip auto-fix (I'll handle it manually)

[1/2/3/4]
```

## Search Patterns Used

```bash
# OR assignment
grep -rn "\.id || \._id\|_id || \.id" --include="*.js" --include="*.jsx" .

# OR comparison
grep -rn "\.id === .* || \._id ===\|_id === .* || .*\.id ===" --include="*.js" --include="*.jsx" .

# onClick handlers
grep -rn "onClick.*\._id || .*\.id\|onClick.*\.id || \._id" --include="*.js" --include="*.jsx" .

# MongoDB queries
grep -rn "\$or.*_id.*\.id\|\$or.*\.id.*_id" --include="*.js" --include="*.jsx" .
```

## Directories Scanned (Default)

- `imports/ui/`
- `imports/ui-fhir/`
- `imports/api/`
- `server/`
- `client/`

## Exclusions

- `node_modules/`
- `.meteor/`
- `tests/` (unless specifically requested)
- Comments (lines starting with `//` or within `/* */`)
- Documentation files (`.md`)

## Auto-Fix Behavior

If user approves auto-fix:

1. **For onClick handlers:**
   - Replace `item._id || item.id` → `item._id`

2. **For assignments:**
   - Replace `get(obj, 'id') || get(obj, '_id')` → `get(obj, '_id')`

3. **For comparisons:**
   - Replace `p.id === val || p._id === val` → `p._id === val`

4. **For MongoDB queries:**
   - Replace `{$or: [{_id: id}, {id: id}]}` → `{_id: id}`

## When to Use

- Before releases
- After implementing new FHIR resources
- When debugging "wrong record" bugs
- During code reviews
- As part of regular maintenance

## Related

- See `.claude/hooks/post-tool-use-id-lookup.md` for automatic detection on file edits
- See `.claude/rules/anti-patterns/id-lookup.md` for detailed explanation
- See root `CLAUDE.md` lines 84-133 for the anti-pattern guide

---

**Note:** This is the #1 bug pattern in Honeycomb. Regular audits recommended.
