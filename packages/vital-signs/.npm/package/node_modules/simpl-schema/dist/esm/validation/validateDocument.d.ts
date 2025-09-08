import MongoObject from 'mongo-object';
import { SimpleSchema, ValidationContext } from '../SimpleSchema.js';
import { ValidationError } from '../types.js';
interface ValidateDocumentProps {
    extendedCustomContext?: Record<string, unknown>;
    ignoreTypes?: string[];
    isModifier: boolean;
    isUpsert: boolean;
    keysToValidate?: string[] | undefined;
    mongoObject?: MongoObject;
    obj: any;
    schema: SimpleSchema;
    validationContext: ValidationContext;
}
export default function validateDocument({ extendedCustomContext, ignoreTypes, isModifier, isUpsert, keysToValidate, mongoObject, obj, schema, validationContext }: ValidateDocumentProps): ValidationError[];
export {};
