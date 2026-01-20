# SearchParametersEngine Documentation

## Overview

The `SearchParametersEngine` is a compile-time FHIR search parameter processor that translates FHIR search queries into MongoDB queries. It replaces the previous runtime MongoDB lookups for SearchParameter resources with an in-memory compiled lookup table, providing better performance and more robust query generation.

**Key Problem Solved:** Ad-hoc dotted paths like `identifier` don't automatically know to map to `identifier.value` or handle complex FHIR datatypes like CodeableConcept. The engine uses FHIRPath expressions from SearchParameter resources to derive correct MongoDB query paths.

---

## Architecture

### Files

| File | Purpose |
|------|---------|
| `server/SearchParametersEngine.js` | Main engine - compilation, lookup, query building |
| `server/SearchParameterMethods.js` | Meteor startup initialization, Meteor methods |
| `server/RestHelpers.js` | Type-specific query builders (Identifier, CodeableConcept, HumanName) |
| `server/FhirEndpoints.js:1284-1386` | Integration point - calls engine for query building |
| `private/SearchParameters/*.json` | SearchParameter resource definitions |

### Data Flow

```
STARTUP (if INITIALIZE_SEARCH_PARAMETERS=true)
  |
  +-> SearchParameterMethods.js (Meteor.startup)
  |     |
  |     +-> SearchParametersEngine.compile()
  |           |
  |           +-> loadCoreSearchParameters()
  |           |     +-> Assets.getTextAsync('SearchParameters/*.json')
  |           |
  |           +-> discoverPackageSearchParameters()
  |           |     +-> Package[*].SearchParametersRegistry.searchParameters
  |           |
  |           +-> Build _compiledParams lookup table
  |                 { Patient: { identifier: {...}, name: {...} }, ... }
  |
RUNTIME (HTTP request to /baseR4/Patient?identifier=12345)
  |
  +-> FhirEndpoints.js (GET handler)
        |
        +-> SearchParametersEngine.buildMongoQuery('Patient', 'identifier', '12345')
              |
              +-> lookup('Patient', 'identifier') -> compiled param info
              |
              +-> Route to type handler based on param.type and param.fieldType
                    |
                    +-> token + Identifier -> RestHelpers.buildIdentifierTokenQuery()
                    +-> token + CodeableConcept -> RestHelpers.buildCodeableConceptTokenQuery()
                    +-> token + code -> buildCodeQuery() (simple field)
                    +-> string + HumanName -> RestHelpers.buildHumanNameStringQuery()
                    +-> reference -> buildReferenceQuery()
                    +-> date -> buildDateQuery()
```

---

## Compiled Parameter Structure

Each compiled parameter stored in `_compiledParams[resourceType][code]`:

```javascript
{
  type: 'token',           // FHIR search type: token, string, reference, date
  baseField: 'identifier', // Top-level field derived from FHIRPath expression
  fieldType: 'Identifier', // FHIR datatype: Identifier, CodeableConcept, HumanName, Reference, code, string, date
  expression: 'Patient.identifier',  // Original FHIRPath
  target: ['Patient'],     // For reference type - allowed target resource types
  multipleOr: true,        // Supports comma-separated values (OR logic)
  multipleAnd: false,      // Supports repeated parameter (AND logic)
  comparators: null,       // For date: eq, ne, gt, lt, ge, le, sa, eb
  modifiers: ['exact'],    // Supported modifiers
  id: 'patient-identifier' // SearchParameter resource ID
}
```

---

## Field Type Detection

The engine detects FHIR datatypes to route to correct query builders:

| baseField | searchParamType | Detected fieldType |
|-----------|-----------------|-------------------|
| `identifier` | token | `Identifier` |
| `category`, `code`, `type`, `clinicalStatus`, `verificationStatus` | token | `CodeableConcept` |
| `status`, `gender`, `intent`, `priority` | token | `code` |
| `name` | string | `HumanName` |
| `address` | string | `Address` |
| `subject`, `patient`, `encounter` | reference | `Reference` |
| `birthDate`, `effectiveDateTime` | date | `date` |

---

## Query Building Examples

### Token on Identifier Field

```
Input:  identifier=MRN|12345
Output: { "identifier": { $elemMatch: { "system": "MRN", "value": "12345" } } }

Input:  identifier=12345
Output: { "identifier.value": "12345" }
```

### Token on CodeableConcept Field

```
Input:  category=assess-plan
Output: { $or: [
           { "category.coding.code": "assess-plan" },
           { "category.text": "assess-plan" }
         ] }

Input:  category=http://hl7.org/fhir/us/core/CodeSystem/careplan-category|assess-plan
Output: { "category.coding": { $elemMatch: { "system": "http://...", "code": "assess-plan" } } }
```

### Reference Field

```
Input:  patient=Patient/123
Output: { "subject.reference": { $in: [
           "123",
           "Patient/123",
           "http://localhost:3000/baseR4/Patient/123",
           "urn:uuid:123"
         ] } }
```

### Date Field

```
Input:  birthdate=1996-04-07
Output: { $or: [
           { "birthDate": "1996-04-07" },  // String match
           { $and: [
             { "birthDate": { $gte: Date("1996-04-07") } },
             { "birthDate": { $lt: Date("1996-04-08") } }
           ]}  // Date object match
         ] }

Input:  birthdate=ge1990-01-01
Output: { $or: [
           { $and: [{ "birthDate": { $type: "string" } }, { "birthDate": { $gte: "1990-01-01" } }] },
           { $and: [{ "birthDate": { $type: "date" } }, { "birthDate": { $gte: Date("1990-01-01") } }] }
         ] }
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `INITIALIZE_SEARCH_PARAMETERS` | (unset) | Set to any value to compile engine at startup |
| `DISABLE_SP_ENGINE` | (unset) | Set to `true` to disable engine, fall back to MongoDB lookups |
| `DEBUG` | (unset) | Set to see detailed query building logs |

---

## SearchParameter JSON Structure

Each file in `private/SearchParameters/` follows this pattern:

```json
{
  "resourceType": "SearchParameter",
  "id": "patient-identifier",
  "code": "identifier",
  "base": ["Patient"],
  "type": "token",
  "expression": "Patient.identifier",
  "xpath": "identifier.value",
  "target": ["Patient"],
  "multipleOr": true,
  "multipleAnd": false,
  "modifier": ["exact", "text"]
}
```

**Fields:**
- `code` - The query parameter name (`?identifier=...`)
- `base` - Resources this applies to
- `type` - FHIR search type (token, string, reference, date)
- `expression` - FHIRPath expression used to derive baseField
- `xpath` - Legacy field, may be used by fallback code
- `target` - For reference types only, allowed target resource types

---

## Integration with FhirEndpoints.js

At `server/FhirEndpoints.js:1286`:

```javascript
if (SearchParametersEngine.isEnabled() && SearchParametersEngine.isCompiled()) {
  // Use engine for query building
  Object.keys(req.query).forEach(function(queryKey) {
    if (queryKey.startsWith('_')) return;  // Skip special params

    const newQueryPart = SearchParametersEngine.buildMongoQuery(
      routeResourceType, queryKey, queryValue
    );

    // Smart combination of $or clauses with $and
    if (mongoQuery.$or && newQueryPart.$or) {
      mongoQuery.$and = [{ $or: mongoQuery.$or }, { $or: newQueryPart.$or }];
      delete mongoQuery.$or;
    } else {
      Object.assign(mongoQuery, newQueryPart);
    }
  });
} else {
  // Fallback: MongoDB lookups from SearchParameters collection
}
```

---

## Package Discovery Pattern

Packages can provide SearchParameters via `SearchParametersRegistry`:

```javascript
// In package.js
api.export('SearchParametersRegistry');

// In package code
export const SearchParametersRegistry = {
  searchParameters: [
    { resourceType: 'SearchParameter', id: 'custom-param', code: 'custom', ... }
  ]
};
```

The engine discovers these at compile time via `discoverPackageSearchParameters()`.

---

## Debugging Tips

1. **Check if engine is compiled:**
   ```javascript
   SearchParametersEngine.isCompiled()  // true/false
   SearchParametersEngine.isEnabled()   // true/false
   ```

2. **List compiled params:**
   ```javascript
   SearchParametersEngine.getParamsForResource('Patient')
   // { identifier: {...}, name: {...}, birthdate: {...}, ... }
   ```

3. **Test a single query build:**
   ```javascript
   SearchParametersEngine.buildMongoQuery('Patient', 'identifier', 'MRN|12345')
   // { "identifier": { $elemMatch: { system: "MRN", value: "12345" } } }
   ```

4. **Enable debug logging:**
   ```bash
   DEBUG=true meteor run --settings configs/settings.honeycomb.localhost.json
   ```

5. **Check console logs at startup:**
   Look for `[SearchParametersEngine] Compiled:` messages to verify params are loading.

---

## Adding New Search Parameters

1. Create JSON file in `private/SearchParameters/SearchParameter-{resource}-{code}.json`
2. Add filename to the `searchParameterFiles` array in `SearchParametersEngine.loadCoreSearchParameters()`
3. Restart with `INITIALIZE_SEARCH_PARAMETERS=true`

Example for adding `Observation.code` search:

```json
{
  "resourceType": "SearchParameter",
  "id": "observation-code",
  "code": "code",
  "base": ["Observation"],
  "type": "token",
  "expression": "Observation.code",
  "multipleOr": true
}
```

---

## Known Limitations / TODOs

1. **Address type** - Not fully implemented, falls back to simple string search
2. **Composite search parameters** - Not yet supported
3. **Modifiers** (`:exact`, `:contains`, `:missing`) - Not fully implemented
4. **Chained parameters** (`patient.name`) - Handled separately in FhirEndpoints.js, not in engine

---

## Healthy Paranoia Checklist

**What could still go wrong:**

- Missing SearchParameter JSON file for a required search -> query param silently ignored
- Wrong fieldType detection -> incorrect MongoDB query structure (e.g., identifier.value vs identifier)
- $or/$and combination bug -> invalid MongoDB query syntax
- Date stored as string vs Date object -> partial matches only
- Package SearchParametersRegistry not exported correctly -> params not discovered
- Engine compiled before packages loaded -> missing package params

**But remember:** The engine successfully routes to type-specific handlers, handles comma-separated values, and properly combines multiple search parameters with $and logic.
