"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.humanize = exports.looksLikeModifier = exports.isObjectWeShouldTraverse = exports.isEmptyObject = exports.getParentOfKey = exports.getLastPartOfKey = exports.getKeysWithValueInObj = exports.forEachKeyAncestor = exports.dateToDateString = exports.appendAffectedKey = void 0;
function appendAffectedKey(affectedKey, key) {
    if (key === '$each')
        return affectedKey;
    return affectedKey == null ? key : `${affectedKey}.${key}`;
}
exports.appendAffectedKey = appendAffectedKey;
/**
 * Given a Date instance, returns a date string of the format YYYY-MM-DD
 */
function dateToDateString(date) {
    let month = date.getUTCMonth() + 1;
    if (month < 10)
        month = `0${month}`;
    let day = date.getUTCDate();
    if (day < 10)
        day = `0${day}`;
    return `${date.getUTCFullYear()}-${month}-${day}`;
}
exports.dateToDateString = dateToDateString;
/**
 * Run loopFunc for each ancestor key in a dot-delimited key. For example,
 * if key is "a.b.c", loopFunc will be called first with ('a.b', 'c') and then with ('a', 'b.c')
 */
function forEachKeyAncestor(key, loopFunc) {
    let lastDot;
    // Iterate the dot-syntax hierarchy
    let ancestor = key;
    do {
        lastDot = ancestor.lastIndexOf('.');
        if (lastDot !== -1) {
            ancestor = ancestor.slice(0, lastDot);
            const remainder = key.slice(ancestor.length + 1);
            loopFunc(ancestor, remainder); // Remove last path component
        }
    } while (lastDot !== -1);
}
exports.forEachKeyAncestor = forEachKeyAncestor;
/**
 * Returns an array of keys that are in obj, have a value
 * other than null or undefined, and start with matchKey
 * plus a dot.
 */
function getKeysWithValueInObj(obj, matchKey) {
    const keysWithValue = [];
    const keyAdjust = (key) => key.slice(0, matchKey.length + 1);
    const matchKeyPlusDot = `${matchKey}.`;
    Object.keys(obj !== null && obj !== void 0 ? obj : {}).forEach((key) => {
        const val = obj[key];
        if (val === undefined || val === null)
            return;
        if (keyAdjust(key) === matchKeyPlusDot) {
            keysWithValue.push(key);
        }
    });
    return keysWithValue;
}
exports.getKeysWithValueInObj = getKeysWithValueInObj;
/**
 * Returns the ending of key, after stripping out the beginning
 * ancestorKey and any array placeholders
 *
 * getLastPartOfKey('a.b.c', 'a') returns 'b.c'
 * getLastPartOfKey('a.b.$.c', 'a.b') returns 'c'
 */
function getLastPartOfKey(key, ancestorKey) {
    let lastPart = '';
    const startString = `${ancestorKey}.`;
    if (key.indexOf(startString) === 0) {
        lastPart = key.replace(startString, '');
        if (lastPart.startsWith('$.'))
            lastPart = lastPart.slice(2);
    }
    return lastPart;
}
exports.getLastPartOfKey = getLastPartOfKey;
/**
 * Returns the parent of a key. For example, returns 'a.b' when passed 'a.b.c'.
 * If no parent, returns an empty string. If withEndDot is true, the return
 * value will have a dot appended when it isn't an empty string.
 */
function getParentOfKey(key, withEndDot = false) {
    const lastDot = key.lastIndexOf('.');
    return lastDot === -1 ? '' : key.slice(0, lastDot + Number(withEndDot));
}
exports.getParentOfKey = getParentOfKey;
/**
 * @summary Determines whether the object has any "own" properties
 * @param {Object} obj Object to test
 * @return {Boolean} True if it has no "own" properties
 */
function isEmptyObject(obj) {
    /* eslint-disable no-restricted-syntax */
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            return false;
        }
    }
    /* eslint-enable no-restricted-syntax */
    return true;
}
exports.isEmptyObject = isEmptyObject;
function isObjectWeShouldTraverse(val) {
    // Some of these types don't exist in old browsers so we'll catch and return false in those cases
    try {
        if (val !== Object(val))
            return false;
        // There are some object types that we know we shouldn't traverse because
        // they will often result in overflows and it makes no sense to validate them.
        if (val instanceof Date)
            return false;
        if (val instanceof Int8Array)
            return false;
        if (val instanceof Uint8Array)
            return false;
        if (val instanceof Uint8ClampedArray)
            return false;
        if (val instanceof Int16Array)
            return false;
        if (val instanceof Uint16Array)
            return false;
        if (val instanceof Int32Array)
            return false;
        if (val instanceof Uint32Array)
            return false;
        if (val instanceof Float32Array)
            return false;
        if (val instanceof Float64Array)
            return false;
    }
    catch (e) {
        return false;
    }
    return true;
}
exports.isObjectWeShouldTraverse = isObjectWeShouldTraverse;
/**
 * Returns true if any of the keys of obj start with a $
 */
function looksLikeModifier(obj) {
    return Object.keys(obj !== null && obj !== void 0 ? obj : {}).some((key) => key.substring(0, 1) === '$');
}
exports.looksLikeModifier = looksLikeModifier;
var humanize_js_1 = require("./humanize.js");
Object.defineProperty(exports, "humanize", { enumerable: true, get: function () { return humanize_js_1.humanize; } });
