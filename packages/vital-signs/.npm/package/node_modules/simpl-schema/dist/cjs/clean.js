"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const clone_1 = __importDefault(require("clone"));
const mongo_object_1 = __importDefault(require("mongo-object"));
const convertToProperType_js_1 = __importDefault(require("./clean/convertToProperType.js"));
const setAutoValues_js_1 = __importDefault(require("./clean/setAutoValues.js"));
const SimpleSchema_js_1 = require("./SimpleSchema.js");
const index_js_1 = require("./utility/index.js");
const index_js_2 = require("./validation/typeValidator/index.js");
const operatorsToIgnoreValue = ['$unset', '$currentDate'];
function log(message) {
    if (SimpleSchema_js_1.SimpleSchema.debug === true) {
        console.debug(message);
    }
}
/**
 * Cleans a document or modifier object. By default, will filter, automatically
 * type convert where possible, and inject automatic/default values. Use the options
 * to skip one or more of these.
 *
 * @param ss A SimpleSchema instance
 * @param doc Document or modifier to clean. Referenced object will be modified in place.
 * @param options Clean options
 * @returns The modified doc.
 */
function clean(ss, doc, options = {}) {
    var _a;
    // By default, doc will be filtered and auto-converted
    const cleanOptions = Object.assign(Object.assign({ isModifier: (0, index_js_1.looksLikeModifier)(doc), isUpsert: false }, ss._cleanOptions), options);
    Object.getOwnPropertyNames(cleanOptions).forEach((opt) => {
        if (!SimpleSchema_js_1.SimpleSchema.supportedCleanOptions.has(opt)) {
            console.warn(`Unsupported "${opt}" option passed to SimpleSchema clean`);
        }
    });
    // Clone so we do not mutate
    const cleanDoc = cleanOptions.mutate === true ? doc : (0, clone_1.default)(doc);
    const mongoObject = (_a = cleanOptions.mongoObject) !== null && _a !== void 0 ? _a : new mongo_object_1.default(cleanDoc, ss.blackboxKeys());
    // Clean loop
    if (cleanOptions.filter === true ||
        cleanOptions.autoConvert === true ||
        cleanOptions.removeEmptyStrings === true ||
        cleanOptions.trimStrings === true) {
        const removedPositions = []; // For removing now-empty objects after
        mongoObject.forEachNode(function eachNode() {
            // The value of a $unset is irrelevant, so no point in cleaning it.
            // Also we do not care if fields not in the schema are unset.
            // Other operators also have values that we wouldn't want to clean.
            if (operatorsToIgnoreValue.includes(this.operator))
                return;
            const gKey = this.genericKey;
            if (gKey == null)
                return;
            let val = this.value;
            if (val === undefined)
                return;
            let p;
            // Filter out props if necessary
            if ((cleanOptions.filter === true && !ss.allowsKey(gKey)) ||
                (cleanOptions.removeNullsFromArrays === true && this.isArrayItem && val === null)) {
                // XXX Special handling for $each; maybe this could be made nicer
                if (this.position.slice(-7) === '[$each]') {
                    mongoObject.removeValueForPosition(this.position.slice(0, -7));
                    removedPositions.push(this.position.slice(0, -7));
                }
                else {
                    this.remove();
                    removedPositions.push(this.position);
                }
                log(`SimpleSchema.clean: filtered out value that would have affected key "${gKey}", which is not allowed by the schema`);
                return; // no reason to do more
            }
            const outerDef = ss.schema(gKey);
            const defs = outerDef === null || outerDef === void 0 ? void 0 : outerDef.type.definitions;
            const def = defs === null || defs === void 0 ? void 0 : defs[0];
            // Auto-convert values if requested and if possible
            if (cleanOptions.autoConvert === true && defs !== undefined && def != null && !(0, index_js_2.isValueTypeValid)(defs, val, this.operator)) {
                const newVal = (0, convertToProperType_js_1.default)(val, def.type);
                if (newVal !== undefined && newVal !== val) {
                    log(`SimpleSchema.clean: auto-converted value ${String(val)} from ${typeof val} to ${typeof newVal} for ${gKey}`);
                    val = newVal;
                    this.updateValue(newVal);
                }
            }
            // Clean string values
            if (typeof val === 'string') {
                // Trim strings if
                // 1. The trimStrings option is `true` AND
                // 2. The field is not in the schema OR is in the schema with `trim` !== `false`
                if (cleanOptions.trimStrings === true &&
                    (def === null || def === void 0 ? void 0 : def.trim) !== false) {
                    val = val.trim();
                    this.updateValue(val);
                }
                // Remove empty strings if
                // 1. The removeEmptyStrings option is `true` AND
                // 2. The value is in a normal object or in the $set part of a modifier
                // 3. The value is an empty string.
                if (cleanOptions.removeEmptyStrings === true &&
                    (this.operator == null || this.operator === '$set') &&
                    val.length === 0) {
                    // For a document, we remove any fields that are being set to an empty string
                    this.remove();
                    // For a modifier, we $unset any fields that are being set to an empty string.
                    // But only if we're not already within an entire object that is being set.
                    if (this.operator === '$set') {
                        const matches = this.position.match(/\[/g);
                        if (matches !== null && matches.length < 2) {
                            p = this.position.replace('$set', '$unset');
                            mongoObject.setValueForPosition(p, '');
                        }
                    }
                }
            }
        }, { endPointsOnly: false });
        // Remove any objects that are now empty after filtering
        removedPositions.forEach((removedPosition) => {
            const lastBrace = removedPosition.lastIndexOf('[');
            if (lastBrace !== -1) {
                const removedPositionParent = removedPosition.slice(0, lastBrace);
                const value = mongoObject.getValueForPosition(removedPositionParent);
                if ((0, index_js_1.isEmptyObject)(value)) {
                    mongoObject.removeValueForPosition(removedPositionParent);
                }
            }
        });
        mongoObject.removeArrayItems();
    }
    // Set automatic values
    if (cleanOptions.getAutoValues === true) {
        (0, setAutoValues_js_1.default)(ss.autoValueFunctions(), mongoObject, cleanOptions.isModifier || false, cleanOptions.isUpsert || false, cleanOptions.extendAutoValueContext);
    }
    // Ensure we don't have any operators set to an empty object
    // since MongoDB 2.6+ will throw errors.
    if (cleanOptions.isModifier) {
        Object.keys(cleanDoc !== null && cleanDoc !== void 0 ? cleanDoc : {}).forEach((op) => {
            const operatorValue = cleanDoc[op];
            if (typeof operatorValue === 'object' &&
                operatorValue !== null &&
                (0, index_js_1.isEmptyObject)(operatorValue)) {
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                delete cleanDoc[op];
            }
        });
    }
    return cleanDoc;
}
exports.default = clean;
