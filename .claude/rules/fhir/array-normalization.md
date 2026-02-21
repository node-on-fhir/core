# FHIR Array Normalization

## Why FHIR Arrays Need Normalization

FHIR resources contain arrays of objects (`address[]`, `extension[]`, `identifier[]`, `telecom[]`) whose order is not semantically significant. However, MongoDB's `$set` operation and `JSON.parse(JSON.stringify())` cycles can silently reorder these arrays.

When comparing two versions of a resource (e.g., for version history diffs), `lodash.isEqual()` is **order-sensitive** for arrays. This means:

```javascript
[{use: "home"}, {use: "work"}]  !==  [{use: "work"}, {use: "home"}]
```

Even though these represent the same data, a naive diff reports every sub-field of every array element as changed.

## The Fix: Two Complementary Strategies

### 1. Normalize Before Storage

Use `normalizeFhirArrays()` to sort arrays of objects deterministically before writing to merkle storage (or any content-addressable store):

```javascript
import { normalizeFhirArrays } from '@merkalis/node-on-fhir-merkle-storage/lib/FhirDiff';

const plainResource = JSON.parse(JSON.stringify(resource));
const normalized = normalizeFhirArrays(plainResource);
// Now store `normalized` — arrays are in deterministic order
```

**Sort keys** (priority order): `use` > `system` > `url` > `type` > `code`

These cover the most common FHIR array discriminators:
- `address[].use` (home, work, temp)
- `telecom[].system` (phone, email, fax)
- `extension[].url` (extension URL)
- `identifier[].type` (type coding)
- `coding[].code` (code value)

**Only arrays of objects** are sorted. Primitive arrays (e.g., `name.given: ["John", "James"]`) preserve their order since FHIR primitive array order is semantically meaningful.

### 2. Order-Insensitive Comparison

Use `isEqualFhir()` instead of `lodash.isEqual()` when comparing FHIR values that may contain reordered arrays:

```javascript
import { isEqualFhir } from '@merkalis/node-on-fhir-merkle-storage/lib/FhirDiff';

// Handles reordered arrays of objects
isEqualFhir(
  [{use: "home"}, {use: "work"}],
  [{use: "work"}, {use: "home"}]
);  // → true

// Still order-sensitive for primitives
isEqualFhir(
  ["John", "James"],
  ["James", "John"]
);  // → false (primitive array order matters in FHIR)
```

## When to Use Each

| Scenario | Use |
|----------|-----|
| Writing to content-addressable storage | `normalizeFhirArrays()` |
| Comparing two FHIR resources for diffs | `isEqualFhir()` |
| Computing shallow diffs (field-level) | `computePatientDiff()` (uses `isEqualFhir` internally) |
| Computing deep diffs (sub-field level) | `computeDeepPatientDiff()` (uses `isEqualFhir` + `findMatchingElement`) |
| Comparing historical (unnormalized) vs new (normalized) data | `isEqualFhir()` handles it |

## Library Location

All functions live in:
```
npmPackages/merkalis/lib/FhirDiff.js
```

This file is **isomorphic** (no Meteor dependencies, only lodash) and can be used from server methods, client components, or other packages.

## Related

- File: `npmPackages/merkalis/lib/FhirDiff.js` — Implementation
- File: `npmPackages/merkalis/server/methods.js` — Server usage
- File: `npmPackages/merkalis/client/MerkleStoragePanel.jsx` — Client usage
- Rule: `rules/fhir/dehydrator.md` — FhirDehydrator patterns
