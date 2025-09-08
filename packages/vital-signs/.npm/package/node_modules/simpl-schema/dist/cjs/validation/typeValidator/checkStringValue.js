"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SimpleSchema_js_1 = require("../../SimpleSchema.js");
function checkStringValue(def, value) {
    // Is it a String?
    if (typeof value !== 'string') {
        return { type: SimpleSchema_js_1.SimpleSchema.ErrorTypes.EXPECTED_TYPE, dataType: 'String' };
    }
    // Is the string too long?
    if (def.max !== null && def.max < value.length) {
        return { type: SimpleSchema_js_1.SimpleSchema.ErrorTypes.MAX_STRING, max: def.max };
    }
    // Is the string too short?
    if (def.min !== null && def.min > value.length) {
        return { type: SimpleSchema_js_1.SimpleSchema.ErrorTypes.MIN_STRING, min: def.min };
    }
    // Does the string match the regular expression?
    if ((def.skipRegExCheckForEmptyStrings !== true || value !== '') &&
        def.regEx instanceof RegExp &&
        !def.regEx.test(value)) {
        return {
            type: SimpleSchema_js_1.SimpleSchema.ErrorTypes.FAILED_REGULAR_EXPRESSION,
            regExp: def.regEx.toString()
        };
    }
    // If regEx is an array of regular expressions, does the string match all of them?
    if (Array.isArray(def.regEx)) {
        let regExError;
        def.regEx.every((re) => {
            if (!re.test(value)) {
                regExError = {
                    type: SimpleSchema_js_1.SimpleSchema.ErrorTypes.FAILED_REGULAR_EXPRESSION,
                    regExp: re.toString()
                };
                return false;
            }
            return true;
        });
        if (regExError !== undefined)
            return regExError;
    }
}
exports.default = checkStringValue;
