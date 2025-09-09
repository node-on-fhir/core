import { SimpleSchema } from '../SimpleSchema.js';
export default function validateDocument({ extendedCustomContext, ignoreTypes, isModifier, isUpsert, keysToValidate, mongoObject, obj, schema, validationContext }) {
    // @ts-expect-error
    const docValidators = schema._docValidators.concat(
    // @ts-expect-error
    SimpleSchema._docValidators);
    const docValidatorContext = Object.assign({ ignoreTypes,
        isModifier,
        isUpsert,
        keysToValidate,
        mongoObject,
        obj,
        schema,
        validationContext }, (extendedCustomContext !== null && extendedCustomContext !== void 0 ? extendedCustomContext : {}));
    const validationErrors = [];
    for (const docValidator of docValidators) {
        const errors = docValidator.call(docValidatorContext, obj);
        if (!Array.isArray(errors)) {
            throw new Error('Custom doc validator must return an array of error objects');
        }
        if (errors.length > 0) {
            validationErrors.push(...errors);
        }
    }
    return validationErrors;
}
