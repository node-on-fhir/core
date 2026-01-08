# Post Tool Use Hook: Meteor v3 Async Pattern Check

## Trigger
After any Edit or Write operation to `.js` files in `server/` directory

## Purpose
Ensure Meteor v3 compliance by detecting synchronous MongoDB operations that must be converted to async patterns.

## Meteor v3 Requirement

**IMPORTANT:** Meteor v3 requires async patterns on the server side. All MongoDB operations must use the `Async` variants.

From root CLAUDE.md lines 199-200:
> *** IMPORTANT:  On the server, be sure to use Meteor v3 API, including getTextAsync, findAsync, insertAsync, updateAsync, removeAsync, countAsync, etc. ***

## The Pattern

### ❌ WRONG - Sync operations (Meteor v2 style):

```javascript
// Server-side code
const patient = Patients.findOne({_id: id});
const count = Observations.find(query).count();
Patients.insert(newPatient);
Patients.update({_id: id}, {$set: data});
Patients.remove({_id: id});
const cursor = Patients.find(query);
```

### ✅ CORRECT - Async operations (Meteor v3 required):

```javascript
// Server-side code
const patient = await Patients.findOneAsync({_id: id});
const count = await Observations.find(query).countAsync();
await Patients.insertAsync(newPatient);
await Patients.updateAsync({_id: id}, {$set: data});
await Patients.removeAsync({_id: id});
const cursor = await Patients.find(query).fetchAsync();
```

## Detection Patterns

Check for synchronous MongoDB methods in server files:

```bash
# Find non-async MongoDB operations
grep -n "\.findOne(\|\.find(\|\.insert(\|\.update(\|\.remove(\|\.count(\|\.fetch(" "$CHANGED_FILE" | \
grep -v "Async\|// \|/\*"
```

This catches:
- `.findOne(` without `Async`
- `.insert(` without `Async`
- `.update(` without `Async`
- `.remove(` without `Async`
- `.count()` without `Async`
- `.fetch()` without `Async`

But excludes:
- Already using `Async` variants
- Comments (`//` or `/* */`)

## Action When Detected

Display warning with line numbers and fixes:

```
⚠️  Meteor v3 Async Required in server/methods.js

Line 45: const patient = Patients.findOne({_id: id});
Line 67: Observations.insert(newObs);
Line 89: const count = Conditions.find(query).count();

🚨 Meteor v3 requires async MongoDB operations on the server!

FIXES:
  Line 45: const patient = await Patients.findOneAsync({_id: id});
  Line 67: await Observations.insertAsync(newObs);
  Line 89: const count = await Conditions.find(query).countAsync();

Note: Ensure parent function is async:
  Meteor.methods({
    'patients.insert': async function(data) {  // Add 'async' keyword
      await Patients.insertAsync(data);
    }
  });

Should I convert to async? [yes/no]
```

## Common Async Conversions

| Sync (Meteor v2) | Async (Meteor v3) |
|------------------|-------------------|
| `.find(query)` | `.find(query)` (cursor - OK as-is) |
| `.findOne(query)` | `await .findOneAsync(query)` |
| `.insert(doc)` | `await .insertAsync(doc)` |
| `.update(sel, mod)` | `await .updateAsync(sel, mod)` |
| `.remove(sel)` | `await .removeAsync(sel)` |
| `.find(query).count()` | `await .find(query).countAsync()` |
| `.find(query).fetch()` | `await .find(query).fetchAsync()` |
| `Meteor.call()` | `await Meteor.callAsync()` |
| `Meteor.userId()` | `await Meteor.userIdAsync()` |
| `Meteor.user()` | `await Meteor.userAsync()` |

## Function Context Check

When converting to async, verify the parent function is also async:

```javascript
// ❌ WRONG - async operations in sync function
Meteor.methods({
  'patients.insert': function(data) {  // Not async!
    await Patients.insertAsync(data);  // Won't work
  }
});

// ✅ CORRECT - async function
Meteor.methods({
  'patients.insert': async function(data) {  // Added 'async'
    await Patients.insertAsync(data);  // Works
  }
});
```

## Publications Special Case

Meteor publications return cursors, which don't need `fetchAsync`:

```javascript
// ✅ CORRECT - Publications return cursors
Meteor.publish('patients.all', function() {
  return Patients.find({});  // Cursor - OK without Async
});

// But if you need to check data first:
Meteor.publish('patients.filtered', async function(patientId) {
  const patient = await Patients.findOneAsync({_id: patientId});  // Need Async
  if (!patient) {
    return this.ready();
  }
  return Patients.find({_id: patientId});  // Cursor - OK
});
```

## Skip Conditions

Do NOT flag:
- Client-side files (`imports/ui/`, `client/`)
- Comments
- String literals
- Variable names like `finder`, `updater`
- Already using `Async` variants
- `.find()` that returns a cursor (not calling `.count()` or `.fetch()`)
- Test files that use test helpers

## Auto-Fix Option

If user approves, automatically:

1. **Add Async suffix:**
   - `findOne(` → `findOneAsync(`
   - `insert(` → `insertAsync(`
   - `update(` → `updateAsync(`
   - `remove(` → `removeAsync(`

2. **Add await:**
   - `const x = Patients.findOneAsync` → `const x = await Patients.findOneAsync`
   - `Patients.insertAsync` → `await Patients.insertAsync`

3. **Check parent function:**
   - If function is not async, add warning:
     ```
     ⚠️  Parent function also needs 'async' keyword
     ```

## Integration

This hook runs automatically after Edit/Write to server files.
Benefits:
- Enforces Meteor v3 compliance
- Prevents runtime errors
- Educational feedback
- Zero cost (grep is instant)

---

Reference: Root CLAUDE.md lines 199-200
