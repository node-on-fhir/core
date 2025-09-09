import { SimpleSchema, ValidationContext } from '../SimpleSchema.js';
import { ValidationError } from '../types.js';
interface ValidateFieldProps {
    affectedKey?: string | undefined;
    extendedCustomContext?: Record<string, unknown>;
    isInArrayItemObject?: boolean;
    isInSubObject?: boolean;
    keysToValidate?: string[] | undefined;
    obj: any;
    op?: string | null;
    schema: SimpleSchema;
    val: any;
    validationContext: ValidationContext;
}
/**
 * Validate a single field within an object being validated
 * @returns Array of all validation errors
 */
export default function validateField(props: ValidateFieldProps): ValidationError[];
export {};
