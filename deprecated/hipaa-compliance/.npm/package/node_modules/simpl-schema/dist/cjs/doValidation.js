"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const validateDocument_js_1 = __importDefault(require("./validation/validateDocument.js"));
const validateField_js_1 = __importDefault(require("./validation/validateField.js"));
function shouldCheck(operator) {
    if (operator === '$pushAll') {
        throw new Error('$pushAll is not supported; use $push + $each');
    }
    return !['$pull', '$pullAll', '$pop', '$slice'].includes(operator);
}
function doValidation({ extendedCustomContext, ignoreTypes, isModifier, isUpsert, keysToValidate, mongoObject, obj, schema, validationContext }) {
    const validationErrors = [];
    // Kick off the validation
    if (isModifier) {
        // Loop through operators
        for (const [op, opObj] of Object.entries(obj)) {
            // If non-operators are mixed in, throw error
            if (op.slice(0, 1) !== '$') {
                throw new Error(`Expected '${op}' to be a modifier operator like '$set'`);
            }
            if (!shouldCheck(op))
                continue;
            const presentKeys = Object.keys(opObj);
            const fields = presentKeys.map((opKey) => {
                let value = opObj[opKey];
                if (op === '$push' || op === '$addToSet') {
                    if (typeof value === 'object' && '$each' in value) {
                        value = value.$each;
                    }
                    else {
                        opKey = `${opKey}.0`;
                    }
                }
                return { key: opKey, value };
            });
            // For an upsert, missing props would not be set if an insert is performed,
            // so we check them all with undefined value to force any 'required' checks to fail
            if (isUpsert && (op === '$set' || op === '$setOnInsert')) {
                for (const key of schema.objectKeys()) {
                    if (!presentKeys.includes(key)) {
                        fields.push({ key, value: undefined });
                    }
                }
            }
            for (const field of fields) {
                const fieldErrors = (0, validateField_js_1.default)({
                    affectedKey: field.key,
                    keysToValidate,
                    obj,
                    op,
                    schema,
                    val: field.value,
                    validationContext
                });
                if (fieldErrors.length > 0) {
                    validationErrors.push(...fieldErrors);
                }
            }
        }
    }
    else {
        const fieldErrors = (0, validateField_js_1.default)({
            keysToValidate,
            obj,
            schema,
            val: obj,
            validationContext
        });
        if (fieldErrors.length > 0) {
            validationErrors.push(...fieldErrors);
        }
    }
    const wholeDocumentErrors = (0, validateDocument_js_1.default)({
        extendedCustomContext,
        ignoreTypes,
        isModifier,
        isUpsert,
        keysToValidate,
        mongoObject,
        obj,
        schema,
        validationContext
    });
    if (wholeDocumentErrors.length > 0) {
        validationErrors.push(...wholeDocumentErrors);
    }
    const addedFieldNames = new Set();
    return validationErrors.filter((errObj) => {
        // Remove error types the user doesn't care about
        if ((ignoreTypes === null || ignoreTypes === void 0 ? void 0 : ignoreTypes.includes(errObj.type)) === true)
            return false;
        // Make sure there is only one error per fieldName
        if (addedFieldNames.has(errObj.name))
            return false;
        addedFieldNames.add(errObj.name);
        return true;
    });
}
exports.default = doValidation;
