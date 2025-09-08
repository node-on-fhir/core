import { SchemaDefinition, SchemaDefinitionWithShorthand } from './types.js';
/**
 * Clones a schema object, expanding shorthand as it does it.
 */
export default function expandShorthand(schema: SchemaDefinitionWithShorthand): SchemaDefinition;
