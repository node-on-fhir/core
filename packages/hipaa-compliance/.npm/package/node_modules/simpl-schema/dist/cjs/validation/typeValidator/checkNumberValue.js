"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SimpleSchema_js_1 = require("../../SimpleSchema.js");
function checkNumberValue(def, value, op, expectsInteger) {
    // Is it a valid number?
    if (typeof value !== 'number' || isNaN(value)) {
        return {
            type: SimpleSchema_js_1.SimpleSchema.ErrorTypes.EXPECTED_TYPE,
            dataType: expectsInteger ? 'Integer' : 'Number'
        };
    }
    // Assuming we are not incrementing, is the value less than the maximum value?
    if (op !== '$inc' &&
        def.max !== null &&
        (def.exclusiveMax === true
            ? def.max <= value
            : def.max < value)) {
        return {
            type: def.exclusiveMax === true
                ? SimpleSchema_js_1.SimpleSchema.ErrorTypes.MAX_NUMBER_EXCLUSIVE
                : SimpleSchema_js_1.SimpleSchema.ErrorTypes.MAX_NUMBER,
            max: def.max
        };
    }
    // Assuming we are not incrementing, is the value more than the minimum value?
    if (op !== '$inc' &&
        def.min !== null &&
        (def.exclusiveMin === true
            ? def.min >= value
            : def.min > value)) {
        return {
            type: def.exclusiveMin === true
                ? SimpleSchema_js_1.SimpleSchema.ErrorTypes.MIN_NUMBER_EXCLUSIVE
                : SimpleSchema_js_1.SimpleSchema.ErrorTypes.MIN_NUMBER,
            min: def.min
        };
    }
    // Is it an integer if we expect an integer?
    if (expectsInteger && !Number.isInteger(value)) {
        return { type: SimpleSchema_js_1.SimpleSchema.ErrorTypes.MUST_BE_INTEGER };
    }
}
exports.default = checkNumberValue;
