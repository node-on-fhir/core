# Stop Hook: Smart Test Verification

## Trigger
When Claude completes a task (before marking task complete)

## Purpose
Implement Boris Cherny's key insight: "Give Claude a way to verify its work."

Selectively suggest running tests when changes affect CRUD operations, avoiding unnecessary test runs on style-only changes.

## Smart Trigger Logic

### ✅ SUGGEST Tests When Changes Affect:

1. **Detail Components** (`*Detail.jsx`)
   - Create/edit/delete logic
   - Form validation
   - Save button handling
   - Patient reference assignment

2. **Table Components** (`*Table.jsx`)
   - Row click handlers
   - Search functionality
   - Column rendering
   - Sort operations

3. **Methods Files** (`methods.js`, `server/methods/*.js`)
   - Create/update/delete operations
   - Data transformation
   - Validation logic
   - Server-side CRUD

4. **FhirDehydrator** (`FhirDehydrator.js`)
   - `flatten*` functions
   - Field extraction logic
   - Data transformation

5. **Autopublish/Subscriptions** (`server/publications/autopublish.js`)
   - Query building
   - Patient filtering
   - Subscription logic

6. **Page Components** (`*Page.jsx`)
   - Subscription setup
   - Patient filtering queries
   - Search query building

### ❌ SKIP Tests When Changes Are:

1. **Style-Only**
   - `sx` prop changes
   - CSS updates
   - Theme token changes
   - Typography variants
   - Spacing adjustments

2. **Documentation**
   - `*.md` files
   - Comment-only changes
   - JSDoc updates
   - README files

3. **Console/Logging**
   - `console.log` additions
   - Debug statements
   - Logging level changes

4. **Minor Text**
   - Button labels
   - Tooltip text
   - Help text
   - Error messages (unless validation logic changed)

5. **Non-Functional**
   - PropTypes
   - Type definitions
   - Lint fixes (whitespace, semicolons)

## Detection Strategy

When Claude reports task completion, analyze the changes:

```javascript
// Pseudo-code for detection
const changedFiles = getChangedFilesFromSession();

const highRiskFiles = changedFiles.filter(file =>
  file.endsWith('Detail.jsx') ||
  file.endsWith('Table.jsx') ||
  file.includes('methods.js') ||
  file.includes('FhirDehydrator.js') ||
  file.includes('autopublish.js') ||
  (file.endsWith('Page.jsx') && containsSubscriptionChanges(file))
);

if (highRiskFiles.length > 0) {
  suggestTestVerification(highRiskFiles);
}
```

## Action When Triggered

**Present cost-conscious choice:**

```
✅ I've completed updates to ObservationsPage.jsx and ObservationDetail.jsx.

🧪 Test Verification Recommended:
   Changes affect CRUD operations (Detail component modified)

   Modified files:
   - imports/ui-fhir/observations/ObservationDetail.jsx (save handler updated)
   - imports/ui-fhir/observations/ObservationsPage.jsx (subscription query)

   Suggested test:
   npm test -- tests/nightwatch/honeycomb/crud.observations.js

   Estimated time: ~3 minutes

   Options:
   1. Run now - Verify immediately
   2. Skip - I'll test manually later
   3. Quick check - Just syntax validation (10 sec)

   What would you like? [1/2/3]
```

## Response Handling

### Option 1: Run Full Tests

```bash
cd /Users/abigailwatson/Code/honeycomb-ehr
npm test -- tests/nightwatch/honeycomb/crud.observations.js
```

**If tests pass:**
```
✅ All tests passed! (27 tests, 0 failures)
   Changes are verified and safe to commit.
```

**If tests fail:**
```
❌ 2 tests failed:

   Test 06: "View details" - Element not found: #observationDetailPage
   Test 08: "Delete record" - Button click intercepted

   This suggests the Detail component changes may have issues.

   Should I:
   1. Analyze the failures and propose fixes
   2. Revert the changes
   3. Let you investigate manually

   What would you like? [1/2/3]
```

### Option 2: Skip

```
Understood. Marking task complete without test verification.

⚠️  Remember to run before pushing:
   npm test -- tests/nightwatch/honeycomb/crud.observations.js
```

### Option 3: Quick Check (Syntax Only)

```bash
# Run linter for fast feedback
meteor npm run lint imports/ui-fhir/observations/ObservationDetail.jsx
```

```
✅ Syntax check passed! No linting errors.

Note: This only validates syntax. Full E2E tests still recommended before commit.
```

## Resource-Specific Test Mapping

Automatically determine which test to run based on changed files:

| File Pattern | Test Command |
|--------------|--------------|
| `**/patients/**` | `crud.patients.js` |
| `**/observations/**` | `crud.observations.js` |
| `**/conditions/**` | `crud.conditions.js` |
| `**/medications/**` | `crud.medications.js` |
| `**/immunizations/**` | `crud.immunizations.js` |
| `**/allergyintolerances/**` | `crud.allergyintolerances.js` |
| `**/careplans/**` | `crud.careplans.js` |
| `**/communications/**` | `crud.communications.js` |
| `FhirDehydrator.js` | ALL relevant CRUD tests (ask which resources) |
| `autopublish.js` | ALL CRUD tests (or ask which resources) |

## Cost Management

Provide transparency about test costs:

```
Test Cost Estimate:
  Single resource CRUD: ~3 minutes
  All CRUD tests: ~25 minutes

  Current changes affect: Observations only
  Recommended: Single resource test (3 min)
```

## Learning Mode

Track which changes actually broke tests to improve trigger logic:

```markdown
## Test Result History

### 2026-01-08: ObservationDetail save handler
- **Changed:** Async/await pattern in handleSave
- **Suggested test:** Yes
- **Result:** 2 failures (correct suggestion ✅)

### 2026-01-08: ConditionsTable button color
- **Changed:** sx={{ color: 'primary.main' }}
- **Suggested test:** No (style-only)
- **Manual test result:** No failures (correct skip ✅)

### 2026-01-07: ImmunizationDetail form validation
- **Changed:** Added required field check
- **Suggested test:** Yes
- **Result:** All passed (correct suggestion ✅)
```

Over time, refine the triggers based on this history.

## Integration with CI/CD

If tests fail locally, remind about CI:

```
⚠️  Tests failed locally.

CI will also catch these failures, but fixing now saves:
- CI pipeline time
- Faster iteration
- No broken commits

Want to fix these issues now? [yes/no]
```

## Graceful Degradation

If test files don't exist yet:

```
🧪 Test Verification Recommended but tests not found:
   Expected: tests/nightwatch/honeycomb/crud.medications.js

   Would you like me to:
   1. Create test file using /create-crud-tests
   2. Skip verification for now
   3. Suggest manual testing steps

   What would you like? [1/2/3]
```

## Benefits

✅ **Boris's Insight:** Gives Claude a verification loop
✅ **Cost-Conscious:** User decides when to pay for tests
✅ **Smart Triggers:** Only suggest when meaningful
✅ **Educational:** Learn from results over time
✅ **Fast Option:** Syntax check as alternative
✅ **Transparent:** Show estimated time/cost

## Integration Notes

- Hook runs automatically before task completion
- User controls whether tests actually run
- Zero cost if tests skipped (just a prompt)
- Graceful handling when tests don't exist
- Can invoke `/create-crud-tests` if needed

---

Reference: Boris Cherny's "Give Claude a way to verify its work"
