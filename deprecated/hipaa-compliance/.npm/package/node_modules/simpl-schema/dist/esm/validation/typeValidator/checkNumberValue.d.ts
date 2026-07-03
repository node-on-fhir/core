import { SchemaKeyDefinition, ValidationErrorResult } from '../../types.js';
export default function checkNumberValue(def: SchemaKeyDefinition, value: number, op: string | null, expectsInteger: boolean): ValidationErrorResult | undefined;
