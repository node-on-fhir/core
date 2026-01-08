# SMART on FHIR 2.x Granular Scopes

## Overview

SMART on FHIR 2.x introduces **granular scopes** that allow fine-grained access control beyond simple resource-level permissions. This is required for ONC (g)(10) certification.

## Scope Format

```
{context}/{resource-type}.{interactions}?{filter-param}={filter-value}
```

### Components

- **context**: `patient`, `user`, or `system`
- **resource-type**: FHIR resource name (e.g., `Observation`, `Condition`)
- **interactions**: Combination of `c`reate, `r`ead, `u`pdate, `d`elete, `s`earch
- **filter-param**: FHIR search parameter (e.g., `category`, `code`)
- **filter-value**: Value to filter by

### Examples

```
patient/Observation.rs?category=vital-signs
  → Read/search vital signs observations for the patient

patient/Observation.rs?category=laboratory
  → Read/search laboratory observations for the patient

patient/Observation.rs?code=http://loinc.org|8867-4
  → Read/search only heart rate observations (LOINC 8867-4)

patient/Condition.cruds?category=encounter-diagnosis
  → Full access to encounter diagnoses

user/AllergyIntolerance.rs
  → Read/search all allergies (provider scope)

system/Patient.rs
  → Backend system access to read patients
```

## Scope Types

### Resource-Level Scopes (SMART 1.0)

```
patient/Observation.read     # Read any observation
patient/Observation.write    # Write any observation
patient/Observation.*        # Full access to observations
```

### Granular Scopes (SMART 2.0)

```
patient/Observation.rs?category=vital-signs    # Only vital signs
patient/Observation.rs?category=laboratory     # Only labs
patient/Observation.rs?code=LOINC|8867-4       # Only heart rate
```

## Interaction Codes

| Code | Interaction | Description |
|------|-------------|-------------|
| `c` | Create | POST new resources |
| `r` | Read | GET single resource (by ID) |
| `u` | Update | PUT/PATCH existing resource |
| `d` | Delete | DELETE resource |
| `s` | Search | GET resource list (with filters) |

**Common combinations**:
- `rs` - Read and search (most common for patient apps)
- `cruds` - Full access (for clinical apps)
- `cru` - Create, read, update (no delete)

## Implementation Pattern

### 1. Parse Scope String

```javascript
function parseGranularScope(scopeString) {
  // Example: "patient/Observation.rs?category=vital-signs"

  const regex = /^(patient|user|system)\/(\w+)\.([cruds]+)(\?(.+))?$/;
  const match = scopeString.match(regex);

  if (!match) {
    throw new Error('Invalid scope format');
  }

  const [, context, resourceType, interactions, , filterQuery] = match;

  // Parse filter query
  const filters = {};
  if (filterQuery) {
    filterQuery.split('&').forEach(param => {
      const [key, value] = param.split('=');
      filters[key] = value;
    });
  }

  return {
    context,           // 'patient'
    resourceType,      // 'Observation'
    interactions,      // 'rs'
    filters            // { category: 'vital-signs' }
  };
}
```

### 2. Apply Scope to MongoDB Query

```javascript
function applyScopeFilter(baseQuery, parsedScope) {
  const query = { ...baseQuery };

  // Apply filter parameters
  if (parsedScope.filters.category) {
    query['category.coding.code'] = parsedScope.filters.category;
  }

  if (parsedScope.filters.code) {
    // Handle system|code format (e.g., "http://loinc.org|8867-4")
    const [system, code] = parsedScope.filters.code.split('|');
    query['code.coding'] = {
      $elemMatch: {
        system: system,
        code: code
      }
    };
  }

  if (parsedScope.filters.date) {
    // Handle date range
    const dateFilter = parsedScope.filters.date;
    if (dateFilter.startsWith('ge')) {
      query['effectiveDateTime'] = { $gte: dateFilter.substring(2) };
    } else if (dateFilter.startsWith('le')) {
      query['effectiveDateTime'] = { $lte: dateFilter.substring(2) };
    }
  }

  return query;
}
```

### 3. Validate Interaction

```javascript
function validateInteraction(requestedInteraction, allowedInteractions) {
  const interactionMap = {
    'GET_ID': 'r',        // GET /Observation/123
    'GET_SEARCH': 's',    // GET /Observation?patient=123
    'POST': 'c',          // POST /Observation
    'PUT': 'u',           // PUT /Observation/123
    'PATCH': 'u',         // PATCH /Observation/123
    'DELETE': 'd'         // DELETE /Observation/123
  };

  const requiredCode = interactionMap[requestedInteraction];

  if (!allowedInteractions.includes(requiredCode)) {
    throw new Meteor.Error('insufficient-scope',
      `Scope does not allow ${requestedInteraction} interaction`
    );
  }

  return true;
}
```

## SearchParametersEngine Integration

Honeycomb uses **SearchParametersEngine** (compile-time) to generate query builders with scope enforcement:

```javascript
// server/CLAUDE.md lines 86-125

// At compile time, SearchParametersEngine generates:
export const ObservationSearchParameters = {
  category: function(value, scopes) {
    // Check if scopes allow this category
    const allowedCategories = scopes
      .filter(s => s.resourceType === 'Observation')
      .flatMap(s => s.filters.category);

    if (allowedCategories.length > 0 && !allowedCategories.includes(value)) {
      throw new Meteor.Error('insufficient-scope',
        `Scope does not allow category=${value}`
      );
    }

    return { 'category.coding.code': value };
  },

  code: function(value, scopes) {
    // Similar scope checking for code parameter
    return { 'code.coding.code': value };
  }
};

// At runtime, FHIR REST API uses these functions:
const query = ObservationSearchParameters.category('vital-signs', userScopes);
```

## Complete Example

### OAuth Token with Granular Scopes

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "patient/Observation.rs?category=vital-signs patient/Observation.rs?category=laboratory patient/Condition.rs",
  "patient": "123"
}
```

### Parsed Scopes

```javascript
const scopes = [
  {
    context: 'patient',
    resourceType: 'Observation',
    interactions: 'rs',
    filters: { category: 'vital-signs' }
  },
  {
    context: 'patient',
    resourceType: 'Observation',
    interactions: 'rs',
    filters: { category: 'laboratory' }
  },
  {
    context: 'patient',
    resourceType: 'Condition',
    interactions: 'rs',
    filters: {}
  }
];
```

### Request Validation

```javascript
// Request: GET /fhir/Observation?patient=123&category=vital-signs

function validateRequest(request, userScopes) {
  const { resourceType, method, params } = request;

  // Find applicable scopes
  const applicableScopes = userScopes.filter(scope =>
    scope.resourceType === resourceType &&
    scope.context === 'patient'
  );

  if (applicableScopes.length === 0) {
    throw new Meteor.Error('no-scope', 'No scope for Observation');
  }

  // Validate interaction
  const interaction = method === 'GET' ? 's' : 'c';
  const hasInteraction = applicableScopes.some(scope =>
    scope.interactions.includes(interaction)
  );

  if (!hasInteraction) {
    throw new Meteor.Error('insufficient-scope', 'Scope does not allow search');
  }

  // Validate filter parameters
  const requestedCategory = params.category;
  const allowedCategories = applicableScopes
    .filter(scope => scope.filters.category)
    .map(scope => scope.filters.category);

  if (allowedCategories.length > 0 && !allowedCategories.includes(requestedCategory)) {
    throw new Meteor.Error('insufficient-scope',
      `Scope does not allow category=${requestedCategory}`
    );
  }

  return true;
}
```

### Query Execution

```javascript
// Build MongoDB query with scope filters
function buildScopedQuery(patientId, params, userScopes) {
  // Base query (patient filter)
  let query = {
    'subject.reference': `Patient/${patientId}`
  };

  // Get applicable scopes
  const observationScopes = userScopes.filter(s =>
    s.resourceType === 'Observation'
  );

  // Combine scope filters with OR
  const scopeFilters = observationScopes.map(scope => {
    const filter = {};

    if (scope.filters.category) {
      filter['category.coding.code'] = scope.filters.category;
    }

    if (scope.filters.code) {
      const [system, code] = scope.filters.code.split('|');
      filter['code.coding'] = {
        $elemMatch: { system, code }
      };
    }

    return filter;
  });

  // If scopes have filters, apply them with OR
  if (scopeFilters.length > 0 && scopeFilters.some(f => Object.keys(f).length > 0)) {
    query.$and = [
      { $or: scopeFilters }
    ];
  }

  // Add request parameters
  if (params.category) {
    query['category.coding.code'] = params.category;
  }

  return query;
}

// Execute query
const query = buildScopedQuery('123', { category: 'vital-signs' }, userScopes);
const observations = await Observations.find(query).fetchAsync();
```

## Common Filter Parameters

### category (Observation, Condition)

```
patient/Observation.rs?category=vital-signs
patient/Observation.rs?category=laboratory
patient/Observation.rs?category=social-history
patient/Condition.rs?category=encounter-diagnosis
patient/Condition.rs?category=problem-list-item
```

### code (Observation, Condition, Procedure)

```
patient/Observation.rs?code=http://loinc.org|8867-4
  → Heart rate (LOINC 8867-4)

patient/Observation.rs?code=http://loinc.org|85354-9
  → Blood pressure panel

patient/Condition.rs?code=http://snomed.info/sct|44054006
  → Diabetes mellitus (SNOMED CT)
```

### date (Observation, Condition, etc.)

```
patient/Observation.rs?date=ge2024-01-01
  → Observations from 2024 onwards

patient/Observation.rs?date=le2024-12-31
  → Observations up to end of 2024
```

### status (Most resources)

```
patient/Condition.rs?clinical-status=active
  → Only active conditions

patient/MedicationRequest.rs?status=active
  → Only active medication orders
```

## ONC (g)(10) Requirements

For certification, must support granular scopes for:

### Required Granular Scopes

```
# Vital Signs
patient/Observation.rs?category=vital-signs

# Laboratory Results
patient/Observation.rs?category=laboratory

# Smoking Status
patient/Observation.rs?code=http://loinc.org|72166-2

# Clinical Notes (by type)
patient/DocumentReference.rs?category=clinical-note

# Problems (by category)
patient/Condition.rs?category=problem-list-item
patient/Condition.rs?category=encounter-diagnosis

# Medications (by status)
patient/MedicationRequest.rs?status=active

# Allergies (by status)
patient/AllergyIntolerance.rs?clinical-status=active
```

## Testing Granular Scopes

```javascript
describe('Granular Scopes', function() {
  it('should filter observations by category scope', async function() {
    const userScopes = [
      {
        context: 'patient',
        resourceType: 'Observation',
        interactions: 'rs',
        filters: { category: 'vital-signs' }
      }
    ];

    // Create test data
    await Observations.insertAsync({
      subject: { reference: 'Patient/123' },
      category: [{ coding: [{ code: 'vital-signs' }] }],
      code: { text: 'Heart rate' }
    });

    await Observations.insertAsync({
      subject: { reference: 'Patient/123' },
      category: [{ coding: [{ code: 'laboratory' }] }],
      code: { text: 'Glucose' }
    });

    // Query with scope filter
    const query = buildScopedQuery('123', {}, userScopes);
    const observations = await Observations.find(query).fetchAsync();

    // Should only return vital signs
    assert.equal(observations.length, 1);
    assert.equal(observations[0].category[0].coding[0].code, 'vital-signs');
  });

  it('should reject request without sufficient scope', function() {
    const userScopes = [
      {
        context: 'patient',
        resourceType: 'Observation',
        interactions: 'r', // Only read, not search
        filters: {}
      }
    ];

    assert.throws(() => {
      validateInteraction('GET_SEARCH', userScopes);
    }, /insufficient-scope/);
  });
});
```

## Related

- Agent: `healthit-auditor` - ONC (g)(10) certification requirements
- Agent: `fhir-schema-expert` - FHIR search parameters
- See `server/CLAUDE.md` lines 86-125 for SearchParametersEngine
- See `server/fhir/oauth/` for OAuth implementation
- SMART App Launch: http://hl7.org/fhir/smart-app-launch/scopes-and-launch-context.html
