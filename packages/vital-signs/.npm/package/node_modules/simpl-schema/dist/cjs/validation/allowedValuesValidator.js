"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SimpleSchema_js_1 = require("../SimpleSchema.js");
function allowedValuesValidator() {
    if (!this.valueShouldBeChecked)
        return;
    const { allowedValues } = this.definition;
    if (allowedValues == null)
        return;
    let isAllowed;
    // set defined in scope and allowedValues is its instance
    if (typeof Set === 'function' && allowedValues instanceof Set) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        isAllowed = allowedValues.has(this.value);
    }
    else {
        isAllowed = allowedValues.includes(this.value);
    }
    return isAllowed ? true : SimpleSchema_js_1.SimpleSchema.ErrorTypes.VALUE_NOT_ALLOWED;
}
exports.default = allowedValuesValidator;
