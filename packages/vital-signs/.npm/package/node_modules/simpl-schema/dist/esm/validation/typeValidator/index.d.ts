import { SchemaKeyDefinitionWithOneType, TypeValidatorContext, ValidationErrorResult } from '../../types.js';
export declare function checkValueType(info: TypeValidatorContext): ValidationErrorResult | undefined;
export declare function isValueTypeValid(typeDefinitions: SchemaKeyDefinitionWithOneType[], value: any, operator: string | null): boolean;
export default function typeValidator(this: TypeValidatorContext): ValidationErrorResult | undefined;
