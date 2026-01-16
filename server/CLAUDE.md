# Server Directory Context

This file provides context for Claude Code when working in the `server/` directory.

---

## SearchParametersEngine

The SearchParametersEngine (`SearchParametersEngine.js`) is a compile-time FHIR search parameter processor that translates FHIR search queries into MongoDB queries.

### Quick Reference

- **Enable:** Set `INITIALIZE_SEARCH_PARAMETERS=true` at startup
- **Disable:** Set `DISABLE_SP_ENGINE=true` to fall back to MongoDB lookups
- **SearchParameter files:** `private/SearchParameters/*.json`

### Key Functions

| Function | Description |
|----------|-------------|
| `SearchParametersEngine.compile()` | Called at startup to load and compile params |
| `SearchParametersEngine.buildMongoQuery(resourceType, code, value)` | Build MongoDB query from FHIR search param |
| `SearchParametersEngine.lookup(resourceType, code)` | Get compiled param info |
| `SearchParametersEngine.isCompiled()` | Check if engine is compiled |
| `SearchParametersEngine.isEnabled()` | Check if engine is enabled |
| `SearchParametersEngine.getParamsForResource(resourceType)` | Get all params for a resource type |

### Adding New Search Parameters

1. Create JSON file in `private/SearchParameters/SearchParameter-{resource}-{code}.json`
2. Add filename to `loadCoreSearchParameters()` array in SearchParametersEngine.js
3. Restart with `INITIALIZE_SEARCH_PARAMETERS=true`

### Type Routing

| Search Type | Field Type | Query Builder |
|-------------|------------|---------------|
| token | Identifier | `RestHelpers.buildIdentifierTokenQuery()` |
| token | CodeableConcept | `RestHelpers.buildCodeableConceptTokenQuery()` |
| token | code | `SearchParametersEngine.buildCodeQuery()` |
| string | HumanName | `RestHelpers.buildHumanNameStringQuery()` |
| reference | Reference | `SearchParametersEngine.buildReferenceQuery()` |
| date | date | `SearchParametersEngine.buildDateQuery()` |

### Integration Point

The engine is called from `FhirEndpoints.js:1286`:

```javascript
if (SearchParametersEngine.isEnabled() && SearchParametersEngine.isCompiled()) {
  const newQueryPart = SearchParametersEngine.buildMongoQuery(resourceType, queryKey, queryValue);
  // ...
}
```

Full documentation: `docs/SearchParametersEngine.md`

---

## RestHelpers

`RestHelpers.js` contains helper functions for FHIR REST operations:

### Token Search Helpers

| Function | Purpose |
|----------|---------|
| `buildIdentifierTokenQuery(mongoPath, searchValue)` | Token search on Identifier field |
| `buildCodeableConceptTokenQuery(mongoPath, searchValue)` | Token search on CodeableConcept field |
| `buildHumanNameStringQuery(mongoPath, searchValue)` | String search on HumanName field |
| `isIdentifierField(fieldName, code)` | Check if field is Identifier type |
| `isCodeableConceptField(fieldName, code)` | Check if field is CodeableConcept type |
| `isHumanNameField(fieldName, code)` | Check if field is HumanName type |
| `xpathToMongoPath(xpath)` | Convert FHIRPath/xpath to MongoDB path |

### Other Helpers

| Function | Purpose |
|----------|---------|
| `generateMongoSearchQuery(query, resourceType)` | Legacy query builder (fallback) |
| `prepForFhirTransfer(response)` | Clean resource for FHIR wire format |
| `toMongo(resource)` | Prepare resource for MongoDB storage |

---

## Granular Scopes (SMART 2.x)

SMART on FHIR 2.x granular scopes allow fine-grained access control. ONC (g)(10) requires filtering results based on scope parameters.

### Scope Format

```
patient/Condition.rs?category=health-concern
patient/Observation.rs?category=http://terminology.hl7.org/CodeSystem/observation-category|survey
```

### Key Functions (FhirEndpoints.js:726-953)

| Function | Purpose |
|----------|---------|
| `parseGranularScope(scope)` | Parse scope into components (resourceType, permission, filters) |
| `getGranularFiltersForResource(authContext, resourceType)` | Get all granular filters for a resource type |
| `resourceMatchesGranularFilter(resource, filter)` | Check if resource matches a filter |
| `codeableConceptMatchesValue(cc, value)` | Match CodeableConcept against system|code |
| `applyGranularScopeFilters(resources, filters)` | Filter resources by granular scopes |

### Behavior

- If scope has no `?` query params → no filtering (full access)
- If scope has `?category=X` → only resources with matching category returned
- Multiple granular scopes → OR logic (match any one filter)
- Unmatched resources → filtered out (empty Bundle is acceptable per spec)

### Integration Point

Applied after database query, before response (FhirEndpoints.js:1857-1864):

```javascript
const granularFilters = getGranularFiltersForResource(authorizationContext, routeResourceType);
if (granularFilters.length > 0) {
  records = applyGranularScopeFilters(records, granularFilters);
}
```

---

## FhirEndpoints

`FhirEndpoints.js` is the main FHIR REST API implementation.

### Key Sections

- **Lines 663-724**: Resource scope authorization (isResourceScopeAuthorized)
- **Lines 726-953**: Granular scope parsing and filtering
- **Lines 1284-1386**: Search parameter processing (uses SearchParametersEngine)
- **$everything operation**: Patient compartment data retrieval
- **Chained parameters**: Handled before SearchParametersEngine processing

### Search Query Flow

1. Parse special params (`_id`, `_count`, `_include`)
2. Handle chained params (`patient.name`)
3. Use SearchParametersEngine for regular params
4. Apply fallbacks if engine not compiled
5. Execute MongoDB query
6. Apply granular scope filters (SMART 2.x)

---

## SearchParameterMethods

`SearchParameterMethods.js` handles initialization:

### Meteor Startup

If `INITIALIZE_SEARCH_PARAMETERS` is set:
1. Compiles SearchParametersEngine
2. Inserts SearchParameter resources to MongoDB (for discovery endpoint)

### Meteor Methods

| Method | Purpose |
|--------|---------|
| `initSearchParameters` | Manually initialize SearchParameters |
| `clearSearchParameters` | Clear all SearchParameters from MongoDB |
| `listSearchParameters` | List all SearchParameters in MongoDB |
