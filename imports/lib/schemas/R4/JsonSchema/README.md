# FHIR R4 JSON Schemas

This directory contains official FHIR R4 JSON Schemas downloaded from HL7.

## Source

Schemas are fetched from: `https://hl7.org/fhir/R4/{resource}.schema.json`

## Usage

These schemas serve as reference documentation for:
1. Understanding FHIR resource structure
2. Generating Zod schemas for `typed:model` validation
3. Creating UI components and Meteor methods

## Download Command

```bash
# Download a schema (lowercase resource name in URL)
curl -o imports/lib/schemas/R4/JsonSchema/{Resource}.json \
  https://hl7.org/fhir/R4/{resource}.schema.json

# Example: BodyStructure
curl -o imports/lib/schemas/R4/JsonSchema/BodyStructure.json \
  https://hl7.org/fhir/R4/bodystructure.schema.json
```

## Integration with typed:model

These JSON Schemas are used as reference to create Zod schemas:

```javascript
import { z } from 'zod';
import { Model } from 'meteor/typed:model';

// Zod schema derived from FHIR JSONSchema
const BodyStructureSchema = z.object({
  resourceType: z.literal('BodyStructure'),
  // ... fields mapped from JSONSchema
});

const BodyStructureModel = new Model({
  name: 'BodyStructures',
  schema: BodyStructureSchema,
});
```

## Related

- Manifest: `/FHIR_RESOURCES_MANIFEST.md`
- Loop command: `/.claude/commands/ralph-fhir-loop.md`
- typed:model docs: https://forums.meteor.com/t/introducing-typed-model-zod-validated-type-safe-mongodb-collections-for-meteor/64258
