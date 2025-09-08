"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongo_object_1 = __importDefault(require("mongo-object"));
const SimpleSchema_js_1 = require("../SimpleSchema.js");
const index_js_1 = require("../utility/index.js");
const allowedValuesValidator_js_1 = __importDefault(require("./allowedValuesValidator.js"));
const requiredValidator_js_1 = __importDefault(require("./requiredValidator.js"));
const index_js_2 = __importDefault(require("./typeValidator/index.js"));
function shouldValidateKey({ affectedKey, affectedKeyGeneric, keysToValidate }) {
    if (keysToValidate == null)
        return true;
    return keysToValidate.some((keyToValidate) => {
        var _a, _b;
        return keyToValidate === affectedKey ||
            keyToValidate === affectedKeyGeneric ||
            ((_a = affectedKey === null || affectedKey === void 0 ? void 0 : affectedKey.startsWith(`${keyToValidate}.`)) !== null && _a !== void 0 ? _a : false) ||
            ((_b = affectedKeyGeneric === null || affectedKeyGeneric === void 0 ? void 0 : affectedKeyGeneric.startsWith(`${keyToValidate}.`)) !== null && _b !== void 0 ? _b : false);
    });
}
function shouldCheckValue({ affectedKeyGeneric, isOptional, op, val }) {
    if (op === '$unset')
        return false;
    if (op === '$rename')
        return false;
    if (val === undefined || val === null) {
        return (affectedKeyGeneric === null || affectedKeyGeneric === void 0 ? void 0 : affectedKeyGeneric.slice(-2)) === '.$' &&
            val === null &&
            isOptional !== true;
    }
    return true;
}
function makeGenericKeyOrThrow(key) {
    const genericKey = mongo_object_1.default.makeKeyGeneric(key);
    if (genericKey == null)
        throw new Error(`Failed to get generic key for key "${key}"`);
    return genericKey;
}
/**
 * Validate a single field within an object being validated
 * @returns Array of all validation errors
 */
function validateField(props) {
    const { affectedKey, extendedCustomContext, isInArrayItemObject = false, isInSubObject = false, keysToValidate, obj, op = null, schema, validationContext } = props;
    let { val } = props;
    let affectedKeyGeneric;
    let def;
    const fieldValidationErrors = [];
    let mongoObject;
    function getFieldInfo(key) {
        var _a;
        // Create mongoObject if necessary, cache for speed
        if (mongoObject === undefined)
            mongoObject = new mongo_object_1.default(obj, schema.blackboxKeys());
        const keyInfo = (_a = mongoObject.getInfoForKey(key)) !== null && _a !== void 0 ? _a : {
            operator: null,
            value: undefined
        };
        return Object.assign(Object.assign({}, keyInfo), { isSet: keyInfo.value !== undefined });
    }
    if (affectedKey !== undefined) {
        // When we hit a blackbox key, we don't progress any further
        if (schema.keyIsInBlackBox(affectedKey))
            return [];
        affectedKeyGeneric = makeGenericKeyOrThrow(affectedKey);
        // Prepare the context object for the rule functions
        const fieldParentNameWithEndDot = (0, index_js_1.getParentOfKey)(affectedKey, true);
        const fieldParentName = fieldParentNameWithEndDot.slice(0, -1);
        const functionsContext = Object.assign({ field(fName) {
                return getFieldInfo(fName);
            }, genericKey: affectedKeyGeneric, isInArrayItemObject,
            isInSubObject, isModifier: op != null, isSet: val !== undefined, key: affectedKey, obj, operator: op, parentField() {
                return getFieldInfo(fieldParentName);
            },
            siblingField(fName) {
                return getFieldInfo(fieldParentNameWithEndDot + fName);
            },
            validationContext, value: val }, (extendedCustomContext !== null && extendedCustomContext !== void 0 ? extendedCustomContext : {}));
        if (shouldValidateKey({
            affectedKey,
            affectedKeyGeneric: affectedKeyGeneric !== null && affectedKeyGeneric !== void 0 ? affectedKeyGeneric : undefined,
            keysToValidate
        })) {
            // Perform validation for this key
            for (const currentDef of schema.getDefinitions(affectedKey, null, functionsContext)) {
                def = currentDef;
                // Whenever we try a new possible schema, clear any field errors from the previous tried schema
                fieldValidationErrors.length = 0;
                const validatorContext = Object.assign(Object.assign({}, functionsContext), { addValidationErrors(errors) {
                        errors.forEach((error) => fieldValidationErrors.push(error));
                    }, 
                    // Value checks are not necessary for null or undefined values, except
                    // for non-optional null array items, or for $unset or $rename values
                    valueShouldBeChecked: shouldCheckValue({
                        affectedKeyGeneric: affectedKeyGeneric !== null && affectedKeyGeneric !== void 0 ? affectedKeyGeneric : undefined,
                        isOptional: currentDef.optional,
                        op,
                        val
                    }) });
                // Loop through each of the definitions in the SimpleSchemaGroup.
                // If the value matches any, we are valid and can stop checking the rest.
                for (const [typeIndex, typeDef] of currentDef.type.entries()) {
                    // If the type is SimpleSchema.Any, then it is valid
                    if (typeDef === SimpleSchema_js_1.SimpleSchema.Any)
                        break;
                    const nonAnyTypeDefinition = typeDef;
                    const { type } = currentDef, definitionWithoutType = __rest(currentDef
                    // @ts-expect-error
                    , ["type"]);
                    // @ts-expect-error
                    const finalValidatorContext = Object.assign(Object.assign({}, validatorContext), { 
                        // Take outer definition props like "optional" and "label"
                        // and add them to inner props like "type" and "min"
                        definition: Object.assign(Object.assign({}, definitionWithoutType), nonAnyTypeDefinition) });
                    // Order of these validators is important
                    const customFieldValidator = nonAnyTypeDefinition.custom;
                    const fieldValidators = [
                        requiredValidator_js_1.default,
                        index_js_2.default,
                        allowedValuesValidator_js_1.default,
                        ...(customFieldValidator == null ? [] : [customFieldValidator]),
                        // @ts-expect-error It's fine to access private method from here
                        ...schema._validators,
                        // @ts-expect-error It's fine to access private method from here
                        ...SimpleSchema_js_1.SimpleSchema._validators
                    ];
                    const fieldValidationErrorsForThisType = [];
                    for (const fieldValidator of fieldValidators) {
                        const result = fieldValidator.call(finalValidatorContext);
                        // If the validator returns a string, assume it is the error type.
                        if (typeof result === 'string') {
                            fieldValidationErrorsForThisType.push({
                                name: affectedKey,
                                type: result,
                                value: val
                            });
                        }
                        // If the validator returns an object, assume it is an error object.
                        if (typeof result === 'object' && result !== null) {
                            fieldValidationErrorsForThisType.push(Object.assign({ name: affectedKey, value: val }, result));
                        }
                    }
                    if (val !== undefined && SimpleSchema_js_1.SimpleSchema.isSimpleSchema(nonAnyTypeDefinition.type)) {
                        const itemErrors = validateField({
                            extendedCustomContext,
                            keysToValidate,
                            obj: val,
                            op,
                            schema: nonAnyTypeDefinition.type,
                            val,
                            validationContext
                        });
                        if (itemErrors.length > 0) {
                            fieldValidationErrorsForThisType.push(...itemErrors.map((error) => (Object.assign(Object.assign({}, error), { name: `${affectedKey}.${error.name}` }))));
                        }
                    }
                    // As soon as we find a type for which the value is valid, stop checking more
                    if (fieldValidationErrorsForThisType.length === 0) {
                        // One we have chosen a valid schema, there is no need to validate the
                        // properties of this object because we validated all the way down
                        if (SimpleSchema_js_1.SimpleSchema.isSimpleSchema(nonAnyTypeDefinition.type)) {
                            return fieldValidationErrors;
                        }
                        break;
                    }
                    if (typeIndex === currentDef.type.length - 1) {
                        fieldValidationErrors.push(...fieldValidationErrorsForThisType);
                    }
                }
                // If it's valid with this schema, we don't need to try any more
                if (fieldValidationErrors.length === 0)
                    break;
            }
            // Mark invalid if not found in schema
            if (def == null) {
                // We don't need KEY_NOT_IN_SCHEMA error for $unset and we also don't need to continue
                if (op === '$unset' ||
                    (op === '$currentDate' && affectedKey.endsWith('.$type'))) {
                    return [];
                }
                return [
                    {
                        name: affectedKey,
                        type: SimpleSchema_js_1.SimpleSchema.ErrorTypes.KEY_NOT_IN_SCHEMA,
                        value: val
                    }
                ];
            }
            // For $rename, make sure that the new name is allowed by the schema
            if (op === '$rename' && !schema.allowsKey(val)) {
                return [
                    {
                        name: val,
                        type: SimpleSchema_js_1.SimpleSchema.ErrorTypes.KEY_NOT_IN_SCHEMA,
                        value: null
                    }
                ];
            }
        }
        // Loop through arrays
        if (Array.isArray(val)) {
            for (const [index, itemValue] of val.entries()) {
                const itemErrors = validateField(Object.assign(Object.assign({}, props), { affectedKey: `${affectedKey}.${index}`, val: itemValue }));
                if (itemErrors.length > 0) {
                    fieldValidationErrors.push(...itemErrors);
                }
            }
            return fieldValidationErrors;
        }
    }
    // If affectedKeyGeneric is undefined due to this being the first run of this
    // function, objectKeys will return the top-level keys.
    const childKeys = schema.objectKeys(affectedKeyGeneric !== null && affectedKeyGeneric !== void 0 ? affectedKeyGeneric : undefined);
    // Temporarily convert missing objects to empty objects
    // so that the looping code will be called and required
    // descendent keys can be validated.
    if ((val === undefined || val === null) &&
        ((def == null) || (def.optional !== true && childKeys.length > 0))) {
        val = {};
    }
    // Loop through object keys
    if ((0, index_js_1.isObjectWeShouldTraverse)(val) &&
        // @ts-expect-error
        ((def == null) || !schema._blackboxKeys.has(affectedKey !== null && affectedKey !== void 0 ? affectedKey : ''))) {
        // Check all present keys plus all keys defined by the schema.
        // This allows us to detect extra keys not allowed by the schema plus
        // any missing required keys, and to run any custom functions for other keys.
        for (const key of new Set([...Object.keys(val), ...childKeys])) {
            const childFieldErrors = validateField(Object.assign(Object.assign({}, props), { affectedKey: (0, index_js_1.appendAffectedKey)(affectedKey, key), 
                // If this object is within an array, make sure we check for required as if it's not a modifier
                isInArrayItemObject: (affectedKeyGeneric === null || affectedKeyGeneric === void 0 ? void 0 : affectedKeyGeneric.slice(-2)) === '.$', isInSubObject: true, val: val[key] }));
            if (childFieldErrors.length > 0) {
                fieldValidationErrors.push(...childFieldErrors);
            }
        }
    }
    return fieldValidationErrors;
}
exports.default = validateField;
