# Slash Command: /fetch-fhir-schemas

Fetch and transform FHIR JsonSchemas from HL7.org for any FHIR version.

## Description

This command fetches official HL7 FHIR JsonSchemas and transforms them into Honeycomb's simplified format with MongoDB `_id` support and resolved `$ref` references.

## Usage

```
/fetch-fhir-schemas {version}
/fetch-fhir-schemas {version} {Resource1} {Resource2} ...
/fetch-fhir-schemas {version} --all
```

### Examples

```
# Fetch all R5 resources
/fetch-fhir-schemas R5 --all

# Fetch specific resources for R4B
/fetch-fhir-schemas R4B Patient Observation Condition

# Fetch single resource for STU3
/fetch-fhir-schemas STU3 Patient

# Fetch all DSTU2 resources
/fetch-fhir-schemas DSTU2 --all
```

## Supported FHIR Versions

| Version | URL Pattern | Destination Directory |
|---------|-------------|----------------------|
| DSTU2 | `https://hl7.org/fhir/DSTU2/{resource}.schema.json` | `imports/lib/schemas/DSTU2/JsonSchema/` |
| STU3 | `https://hl7.org/fhir/STU3/{resource}.schema.json` | `imports/lib/schemas/STU3/JsonSchema/` |
| R4 | `https://hl7.org/fhir/R4/{resource}.schema.json` | `imports/lib/schemas/R4/JsonSchema/` |
| R4B | `https://hl7.org/fhir/R4B/{resource}.schema.json` | `imports/lib/schemas/R4B/JsonSchema/` |
| R5 | `https://hl7.org/fhir/R5/{resource}.schema.json` | `imports/lib/schemas/R5/JsonSchema/` |
| R6 | `https://hl7.org/fhir/R6/{resource}.schema.json` | `imports/lib/schemas/R6/JsonSchema/` |

## What It Does

### 1. Parse Arguments
- First argument: FHIR version (required) - one of: DSTU2, STU3, R4, R4B, R5, R6
- Remaining arguments: Resource names OR `--all` flag
- If no resources specified and no `--all`, prompt for resources

### 2. Fetch Resource List (if --all)
Fetch the full resource list from:
```
https://hl7.org/fhir/{version}/resourcelist.html
```

Extract all resource type names from the page.

### 3. For Each Resource

1. **Create destination directory** if it doesn't exist:
   ```
   imports/lib/schemas/{VERSION}/JsonSchema/
   ```

2. **Attempt to fetch** from HL7.org:
   ```
   https://hl7.org/fhir/{VERSION}/{lowercase-resource}.schema.json.html
   ```

3. **If fetch fails**, use FHIR specification knowledge to create the schema based on the resource definition

4. **Transform** to Honeycomb format (see Schema Transformation below)

5. **Save** to:
   ```
   imports/lib/schemas/{VERSION}/JsonSchema/{ResourceType}.json
   ```

### 4. Schema Transformation

Transform official HL7 schema to Honeycomb format:

- **Format**: JSON Schema draft-06
- **Resolve $ref**: All `$ref` references resolved inline (no external file dependencies)
- **Add _id**: Add MongoDB primary key field:
  ```json
  "_id": { "type": "string", "description": "MongoDB primary key" }
  ```
- **Use const**: Replace `$ref` for resourceType with `const`:
  ```json
  "resourceType": { "const": "Patient" }
  ```
- **Inline data types**: Expand CodeableConcept, Reference, Identifier, etc. inline

### 5. Output Summary

Report results:
- List of successfully created/updated files
- List of any failed resources
- Total count of schemas created

## Target Schema Format

```json
{
  "$schema": "http://json-schema.org/draft-06/schema#",
  "id": "http://hl7.org/fhir/json-schema/{ResourceType}",
  "description": "Resource description from FHIR spec...",
  "type": "object",
  "required": ["resourceType", ...],
  "properties": {
    "resourceType": { "const": "{ResourceType}" },
    "id": { "type": "string", "description": "Logical id of this artifact" },
    "_id": { "type": "string", "description": "MongoDB primary key" },
    "meta": {
      "type": "object",
      "properties": {
        "versionId": { "type": "string" },
        "lastUpdated": { "type": "string" },
        "source": { "type": "string" },
        "profile": { "type": "array", "items": { "type": "string" } },
        "security": { "type": "array", "items": { "type": "object", "properties": { "system": { "type": "string" }, "code": { "type": "string" }, "display": { "type": "string" } } } },
        "tag": { "type": "array", "items": { "type": "object", "properties": { "system": { "type": "string" }, "code": { "type": "string" }, "display": { "type": "string" } } } }
      }
    },
    "implicitRules": { "type": "string" },
    "language": { "type": "string" },
    "text": { "type": "object", "properties": { "status": { "type": "string" }, "div": { "type": "string" } } },
    "contained": { "type": "array", "items": { "type": "object" } },
    "extension": { "type": "array", "items": { "type": "object" } },
    "modifierExtension": { "type": "array", "items": { "type": "object" } },
    ...
  }
}
```

## Common FHIR Data Types (Inlined)

### Reference
```json
{
  "type": "object",
  "properties": {
    "reference": { "type": "string" },
    "display": { "type": "string" }
  }
}
```

### CodeableConcept
```json
{
  "type": "object",
  "properties": {
    "coding": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "system": { "type": "string" },
          "code": { "type": "string" },
          "display": { "type": "string" }
        }
      }
    },
    "text": { "type": "string" }
  }
}
```

### Identifier
```json
{
  "type": "object",
  "properties": {
    "use": { "type": "string" },
    "system": { "type": "string" },
    "value": { "type": "string" }
  }
}
```

### Period
```json
{
  "type": "object",
  "properties": {
    "start": { "type": "string" },
    "end": { "type": "string" }
  }
}
```

### Quantity
```json
{
  "type": "object",
  "properties": {
    "value": { "type": "number" },
    "unit": { "type": "string" },
    "system": { "type": "string" },
    "code": { "type": "string" }
  }
}
```

## Verification

After creating schemas, verify:
- Each file is valid JSON (parse without error)
- Contains `"resourceType"` with `"const": "{ResourceType}"`
- Contains `"_id"` property for MongoDB
- No remaining `$ref` to external files

## Example Session

```
> /fetch-fhir-schemas R5 Patient Observation

Fetching FHIR R5 schemas...

Destination: imports/lib/schemas/R5/JsonSchema/

[1/2] Patient
  - Fetching from hl7.org...
  - Transforming schema...
  - Saved: Patient.json

[2/2] Observation
  - Fetching from hl7.org...
  - Transforming schema...
  - Saved: Observation.json

Summary:
  Created: 2 schemas
  Failed: 0
  Location: imports/lib/schemas/R5/JsonSchema/
```

## Batch Processing (--all)

When using `--all`, process resources in batches of 10 to avoid overwhelming the network:

```
> /fetch-fhir-schemas R5 --all

Fetching all FHIR R5 resources...

Fetching resource list from hl7.org...
Found 150 resource types.

Processing in batches of 10...

Batch 1/15: Patient, Practitioner, Organization, Location, Encounter...
  - Created: 10 schemas

Batch 2/15: Observation, Condition, Procedure, DiagnosticReport, Medication...
  - Created: 10 schemas

...

Summary:
  Created: 150 schemas
  Failed: 0
  Location: imports/lib/schemas/R5/JsonSchema/
```

## Error Handling

### Network Failures
If HL7.org fetch fails:
1. Log the failure
2. Use FHIR specification knowledge to create the schema
3. Continue with remaining resources

### Invalid Resource Name
```
Error: "InvalidResource" is not a valid FHIR resource type for R5.

Valid resource types include: Patient, Observation, Condition, ...

Use --all to fetch all resources, or specify valid resource names.
```

## Notes

- **DSTU2/STU3**: Older versions may have different schema structures. The transformation will adapt accordingly.
- **R6**: May not be fully available yet. Will fetch what's published.
- **Network Issues**: HL7.org can be slow or unavailable. The command includes retry logic and fallback to spec-based generation.

## Related

- See `imports/lib/schemas/R4B/JsonSchema/` for existing R4B schemas
- See `.claude/agents/fhir-schema-expert.md` for FHIR spec expertise
- See `CLAUDE.md` for schema format requirements

---

**Note:** This command creates production-ready schemas following the established Honeycomb patterns. All schemas include MongoDB `_id` support and resolved references.
