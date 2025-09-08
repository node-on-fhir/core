"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SimpleSchema_js_1 = require("../../SimpleSchema.js");
const index_js_1 = require("../../utility/index.js");
function checkDateValue(def, value) {
    // Is it an invalid date?
    if (isNaN(value.getTime())) {
        return { type: SimpleSchema_js_1.SimpleSchema.ErrorTypes.BAD_DATE };
    }
    // Is it earlier than the minimum date?
    if (def.min !== undefined &&
        typeof def.min.getTime === 'function' &&
        def.min.getTime() > value.getTime()) {
        return {
            type: SimpleSchema_js_1.SimpleSchema.ErrorTypes.MIN_DATE,
            min: (0, index_js_1.dateToDateString)(def.min)
        };
    }
    // Is it later than the maximum date?
    if (def.max !== undefined &&
        typeof def.max.getTime === 'function' &&
        def.max.getTime() < value.getTime()) {
        return {
            type: SimpleSchema_js_1.SimpleSchema.ErrorTypes.MAX_DATE,
            max: (0, index_js_1.dateToDateString)(def.max)
        };
    }
}
exports.default = checkDateValue;
