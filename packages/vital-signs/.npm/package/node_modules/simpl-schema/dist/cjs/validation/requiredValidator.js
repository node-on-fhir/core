"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SimpleSchema_js_1 = require("../SimpleSchema.js");
const index_js_1 = require("../utility/index.js");
// Check for missing required values. The general logic is this:
// * If the operator is $unset or $rename, it's invalid.
// * If the value is null, it's invalid.
// * If the value is undefined and one of the following are true, it's invalid:
//     * We're validating a key of a sub-object.
//     * We're validating a key of an object that is an array item.
//     * We're validating a document (as opposed to a modifier).
//     * We're validating a key under the $set operator in a modifier, and it's an upsert.
function requiredValidator() {
    const { definition, isInArrayItemObject, isInSubObject, key, obj, operator, value } = this;
    const { optional } = definition;
    if (optional === true)
        return;
    // If value is null, no matter what, we add required
    if (value === null)
        return SimpleSchema_js_1.SimpleSchema.ErrorTypes.REQUIRED;
    // If operator would remove, we add required
    if (operator === '$unset' || operator === '$rename') {
        return SimpleSchema_js_1.SimpleSchema.ErrorTypes.REQUIRED;
    }
    // The rest of these apply only if the value is undefined
    if (value !== undefined)
        return;
    // At this point, if it's a normal, non-modifier object, then a missing value is an error
    if (operator == null)
        return SimpleSchema_js_1.SimpleSchema.ErrorTypes.REQUIRED;
    // Everything beyond this point deals with modifier objects only
    // We can skip the required check for keys that are ancestors of those in $set or
    // $setOnInsert because they will be created by MongoDB while setting.
    const keysWithValueInSet = (0, index_js_1.getKeysWithValueInObj)(obj.$set, key);
    if (keysWithValueInSet.length > 0)
        return;
    const keysWithValueInSetOnInsert = (0, index_js_1.getKeysWithValueInObj)(obj.$setOnInsert, key);
    if (keysWithValueInSetOnInsert.length > 0)
        return;
    // In the case of $set and $setOnInsert, the value may be undefined here
    // but it is set in another operator. So check that first.
    const fieldInfo = this.field(key);
    if (fieldInfo.isSet && fieldInfo.value !== null)
        return;
    // Required if in an array or sub object
    if (isInArrayItemObject || isInSubObject) {
        return SimpleSchema_js_1.SimpleSchema.ErrorTypes.REQUIRED;
    }
    // If we've got this far with an undefined $set or $setOnInsert value, it's a required error.
    if (operator === '$set' || operator === '$setOnInsert') {
        return SimpleSchema_js_1.SimpleSchema.ErrorTypes.REQUIRED;
    }
}
exports.default = requiredValidator;
