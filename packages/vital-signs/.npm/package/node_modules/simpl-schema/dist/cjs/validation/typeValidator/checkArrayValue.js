"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SimpleSchema_js_1 = require("../../SimpleSchema.js");
function checkArrayValue(def, value) {
    // Is it an array?
    if (!Array.isArray(value)) {
        return { type: SimpleSchema_js_1.SimpleSchema.ErrorTypes.EXPECTED_TYPE, dataType: 'Array' };
    }
    // Are there fewer than the minimum number of items in the array?
    if (def.minCount != null && value.length < def.minCount) {
        return { type: SimpleSchema_js_1.SimpleSchema.ErrorTypes.MIN_COUNT, minCount: def.minCount };
    }
    // Are there more than the maximum number of items in the array?
    if (def.maxCount != null && value.length > def.maxCount) {
        return { type: SimpleSchema_js_1.SimpleSchema.ErrorTypes.MAX_COUNT, maxCount: def.maxCount };
    }
}
exports.default = checkArrayValue;
