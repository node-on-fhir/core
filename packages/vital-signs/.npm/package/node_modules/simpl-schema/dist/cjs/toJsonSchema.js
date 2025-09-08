"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toJsonSchema = void 0;
const SimpleSchema_js_1 = require("./SimpleSchema.js");
const jsonSchemaVersion = 'https://json-schema.org/draft/2020-12/schema';
function toJSArray(ss, key, fieldDef) {
    const itemSchema = fieldDefToJsonSchema(ss, `${key}.$`);
    if (itemSchema == null)
        return null;
    const arrayDef = {
        type: 'array',
        items: [itemSchema],
        additionalItems: false
    };
    if (fieldDef.minCount !== undefined) {
        arrayDef.minItems = fieldDef.minCount;
    }
    if (fieldDef.maxCount !== undefined) {
        arrayDef.maxItems = fieldDef.maxCount;
    }
    return arrayDef;
}
function toJsProperties(ss) {
    const properties = {};
    const required = [];
    for (const key of ss.objectKeys()) {
        const fieldDef = ss.schema(key);
        if (fieldDef == null)
            continue;
        if (fieldDef.optional !== true)
            required.push(key);
        const schema = fieldDefToJsonSchema(ss, key);
        if (schema != null)
            properties[key] = schema;
    }
    return { properties, required };
}
function toJSObj(simpleSchema, additionalProperties = false) {
    return Object.assign(Object.assign({ type: 'object' }, toJsProperties(simpleSchema)), { additionalProperties });
}
function fieldDefToJsonSchema(ss, key) {
    var _a;
    const fieldDef = ss.schema(key);
    if (fieldDef == null)
        return null;
    const itemSchemas = [];
    for (const fieldTypeDef of fieldDef.type.definitions) {
        let itemSchema = null;
        switch (fieldTypeDef.type) {
            case String:
                itemSchema = { type: 'string' };
                if (fieldTypeDef.allowedValues !== undefined && typeof fieldTypeDef.allowedValues !== 'function') {
                    itemSchema.enum = [...fieldTypeDef.allowedValues];
                }
                if (fieldTypeDef.max !== undefined && typeof fieldTypeDef.max !== 'function') {
                    itemSchema.maxLength = fieldTypeDef.max;
                }
                if (fieldTypeDef.min !== undefined && typeof fieldTypeDef.min !== 'function') {
                    itemSchema.minLength = fieldTypeDef.min;
                }
                if (fieldTypeDef.regEx instanceof RegExp) {
                    itemSchema.pattern = String(fieldTypeDef.regEx);
                }
                break;
            case Number:
            case SimpleSchema_js_1.SimpleSchema.Integer:
                itemSchema = { type: fieldTypeDef.type === Number ? 'number' : 'integer' };
                if (fieldTypeDef.max !== undefined && typeof fieldTypeDef.max !== 'function') {
                    if (fieldTypeDef.exclusiveMax === true) {
                        itemSchema.exclusiveMaximum = fieldTypeDef.max;
                    }
                    else {
                        itemSchema.maximum = fieldTypeDef.max;
                    }
                }
                if (fieldTypeDef.min !== undefined && typeof fieldTypeDef.min !== 'function') {
                    if (fieldTypeDef.exclusiveMin === true) {
                        itemSchema.exclusiveMinimum = fieldTypeDef.min;
                    }
                    else {
                        itemSchema.minimum = fieldTypeDef.min;
                    }
                }
                break;
            case Boolean:
                itemSchema = { type: 'boolean' };
                break;
            case Date:
                itemSchema = {
                    type: 'string',
                    format: 'date-time'
                };
                break;
            case Array:
                itemSchema = toJSArray(ss, key, fieldDef);
                break;
            case Object:
                itemSchema = toJSObj(ss.getObjectSchema(key), fieldTypeDef.blackbox);
                break;
            case SimpleSchema_js_1.SimpleSchema.Any:
                // In JSONSchema an empty object means any type
                itemSchema = {};
                break;
            default:
                if (SimpleSchema_js_1.SimpleSchema.isSimpleSchema(fieldTypeDef.type)) {
                    itemSchema = toJSObj(fieldTypeDef.type, fieldTypeDef.blackbox);
                }
                else if (
                // support custom objects
                fieldTypeDef.type instanceof Function) {
                    itemSchema = toJSObj(ss.getObjectSchema(key), fieldTypeDef.blackbox);
                }
                break;
        }
        if (itemSchema != null && fieldTypeDef.defaultValue !== undefined) {
            itemSchema.default = fieldTypeDef.defaultValue;
        }
        if (itemSchema != null)
            itemSchemas.push(itemSchema);
    }
    if (itemSchemas.length > 1) {
        return { anyOf: itemSchemas };
    }
    return (_a = itemSchemas[0]) !== null && _a !== void 0 ? _a : null;
}
/**
 * Convert a SimpleSchema to a JSONSchema Document.
 *
 * Notes:
 * - Date fields will become string fields with built-in 'date-time' format.
 * - JSONSchema does not support minimum or maximum values for date fields
 * - Custom validators are ignored
 * - Field definition properties that are a function are ignored
 * - Custom objects are treated as regular objects
 *
 * @param simpleSchema SimpleSchema instance to convert
 * @param id Optional ID to use for the `$id` field
 * @returns JSONSchema Document
 */
function toJsonSchema(simpleSchema, id) {
    return Object.assign(Object.assign(Object.assign({}, (id != null ? { $id: id } : {})), { $schema: jsonSchemaVersion }), toJSObj(simpleSchema));
}
exports.toJsonSchema = toJsonSchema;
