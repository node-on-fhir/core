import MongoObject from 'mongo-object';
import { SimpleSchema } from './SimpleSchema.js';
import { ValidationError } from './types.js';
import ValidationContext from './ValidationContext.js';
interface DoValidationProps {
    extendedCustomContext?: Record<string, unknown>;
    ignoreTypes?: string[];
    isModifier: boolean;
    isUpsert: boolean;
    keysToValidate?: string[];
    mongoObject?: MongoObject;
    obj: any;
    schema: SimpleSchema;
    validationContext: ValidationContext;
}
declare function doValidation({ extendedCustomContext, ignoreTypes, isModifier, isUpsert, keysToValidate, mongoObject, obj, schema, validationContext }: DoValidationProps): ValidationError[];
export default doValidation;
