"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expandKey = exports.keyToPosition = exports.makeKeyGeneric = exports.isObject = exports.isEmpty = exports.isPrototype = exports.each = exports.isArrayLike = exports.isLength = exports.isNullUndefinedOrEmptyString = exports.genericKeyAffectsOtherGenericKey = exports.extractOp = exports.appendAffectedKey = exports.reportNulls = exports.isBasicObject = exports.cleanNulls = void 0;
/** Used as references for various `Number` constants. */
const MAX_SAFE_INTEGER = 9007199254740991;
/**
 * @param doc Source object or array
 * @param isArray True if `doc` is an array
 * @param keepEmptyStrings Whether to keep empty strings
 * @returns An object in which all properties with null, undefined, or empty
 *   string values have been removed, recursively.
 */
function cleanNulls(doc, isArray = false, keepEmptyStrings = false) {
    const newDoc = isArray ? [] : {};
    Object.keys(doc).forEach((key) => {
        let val = doc[key];
        if (!Array.isArray(val) && isBasicObject(val)) {
            val = cleanNulls(val, false, keepEmptyStrings); // Recurse into plain objects
            if (!isEmpty(val))
                newDoc[key] = val;
        }
        else if (Array.isArray(val)) {
            val = cleanNulls(val, true, keepEmptyStrings); // Recurse into non-typed arrays
            if (!isEmpty(val))
                newDoc[key] = val;
        }
        else if (!isNullUndefinedOrEmptyString(val)) {
            newDoc[key] = val;
        }
        else if (keepEmptyStrings &&
            typeof val === 'string' &&
            val.length === 0) {
            newDoc[key] = val;
        }
    });
    return newDoc;
}
exports.cleanNulls = cleanNulls;
/**
 * @param obj Any reference to check
 * @returns True if obj is an Object as opposed to
 *   something that inherits from Object
 */
function isBasicObject(obj) {
    return obj === Object(obj) && Object.getPrototypeOf(obj) === Object.prototype;
}
exports.isBasicObject = isBasicObject;
/**
 * @method MongoObject.reportNulls
 * @public
 * @param flatDoc An object with no properties that are also objects.
 * @returns An object in which the keys represent the keys in the
 *   original object that were null, undefined, or empty strings, and the value
 *   of each key is "".
 */
function reportNulls(flatDoc, keepEmptyStrings = false) {
    const nulls = {};
    // Loop through the flat doc
    Object.keys(flatDoc).forEach((key) => {
        const val = flatDoc[key];
        if (val === null ||
            val === undefined ||
            (!keepEmptyStrings && typeof val === 'string' && val.length === 0) ||
            // If value is an array in which all the values recursively are undefined, null,
            // or an empty string
            (Array.isArray(val) &&
                cleanNulls(val, true, keepEmptyStrings).length === 0)) {
            nulls[key] = '';
        }
    });
    return nulls;
}
exports.reportNulls = reportNulls;
function appendAffectedKey(affectedKey, key) {
    if (key === '$each')
        return affectedKey;
    return (affectedKey != null && affectedKey.length > 0) ? `${affectedKey}.${key}` : key;
}
exports.appendAffectedKey = appendAffectedKey;
// Extracts operator piece, if present, from position string
function extractOp(position) {
    const firstPositionPiece = position.slice(0, position.indexOf('['));
    return firstPositionPiece.substring(0, 1) === '$' ? firstPositionPiece : null;
}
exports.extractOp = extractOp;
function genericKeyAffectsOtherGenericKey(key, affectedKey) {
    // If the affected key is the test key
    if (affectedKey === key)
        return true;
    // If the affected key implies the test key because the affected key
    // starts with the test key followed by a period
    if (affectedKey.substring(0, key.length + 1) === `${key}.`)
        return true;
    // If the affected key implies the test key because the affected key
    // starts with the test key and the test key ends with ".$"
    const lastTwo = key.slice(-2);
    if (lastTwo === '.$' && key.slice(0, -2) === affectedKey)
        return true;
    return false;
}
exports.genericKeyAffectsOtherGenericKey = genericKeyAffectsOtherGenericKey;
function isNullUndefinedOrEmptyString(val) {
    return (val === undefined ||
        val === null ||
        (typeof val === 'string' && val.length === 0));
}
exports.isNullUndefinedOrEmptyString = isNullUndefinedOrEmptyString;
function isLength(value) {
    return (typeof value === 'number' &&
        value > -1 &&
        value % 1 === 0 &&
        value <= MAX_SAFE_INTEGER);
}
exports.isLength = isLength;
function isArrayLike(value) {
    return value != null && typeof value !== 'function' && isLength(value.length);
}
exports.isArrayLike = isArrayLike;
function each(collection, iteratee) {
    if (collection == null) {
        return;
    }
    if (Array.isArray(collection)) {
        collection.forEach(iteratee);
        return;
    }
    const iterable = Object(collection);
    if (!isArrayLike(collection)) {
        Object.keys(iterable).forEach((key) => iteratee(iterable[key], key, iterable));
        return;
    }
    let index = -1;
    while (++index < collection.length) {
        if (iteratee(iterable[index], index, iterable) === false) {
            break;
        }
    }
}
exports.each = each;
function isPrototype(value) {
    const Ctor = value === null || value === void 0 ? void 0 : value.constructor;
    if (typeof Ctor !== 'function' || Ctor.prototype === undefined) {
        return value === Object.prototype;
    }
    return value === Ctor.prototype;
}
exports.isPrototype = isPrototype;
function isEmpty(value) {
    if (value === null || value === undefined) {
        return true;
    }
    if (Array.isArray(value) || typeof value === 'string') {
        return value.length === 0;
    }
    const tag = Object.prototype.toString.call(value);
    if (tag === '[object Map]' || tag === '[object Set]') {
        return value.size === 0;
    }
    if (isPrototype(value)) {
        return Object.keys(value).length === 0;
    }
    // eslint-disable-next-line no-restricted-syntax
    for (const key in value) {
        if (Object.hasOwnProperty.call(value, key)) {
            return false;
        }
    }
    return true;
}
exports.isEmpty = isEmpty;
function isObject(value) {
    const type = typeof value;
    return value != null && (type === 'object' || type === 'function');
}
exports.isObject = isObject;
/* Takes a specific string that uses any mongo-style positional update
 * dot notation and returns a generic string equivalent. Replaces all numeric
 * positional "pieces" (e.g. '.1') or any other positional operator
 * (e.g. '$[<identifier>]')  with a dollar sign ($).
 *
 * @param key A specific or generic key
 * @returns Generic name.
 */
function makeKeyGeneric(key) {
    if (typeof key !== 'string')
        return null;
    return key.replace(/\.([0-9]+|\$\[[^\]]*\])(?=\.|$)/g, '.$');
}
exports.makeKeyGeneric = makeKeyGeneric;
function keyToPosition(key, wrapAll = false) {
    let position = '';
    key.split('.').forEach((piece, i) => {
        if (i === 0 && !wrapAll) {
            position += piece;
        }
        else {
            position += `[${piece}]`;
        }
    });
    return position;
}
exports.keyToPosition = keyToPosition;
/**
 *  Takes a string representation of an object key and its value
 *  and updates "obj" to contain that key with that value.
 *
 *  Example keys and results if val is 1:
 *    "a" -> {a: 1}
 *    "a[b]" -> {a: {b: 1}}
 *    "a[b][0]" -> {a: {b: [1]}}
 *    'a[b.0.c]' -> {a: {'b.0.c': 1}}
 * @param val Value
 * @param key Key
 * @param obj Object
 */
function expandKey(val, key, obj) {
    const subkeys = key.split('[');
    let current = obj;
    for (let i = 0, ln = subkeys.length; i < ln; i++) {
        let subkey = subkeys[i];
        if (subkey.slice(-1) === ']') {
            subkey = subkey.slice(0, -1);
        }
        if (i === ln - 1) {
            // Last iteration; time to set the value; always overwrite
            current[subkey] = val;
            // If val is undefined, delete the property
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            if (val === undefined)
                delete current[subkey];
        }
        else {
            // See if the next piece is a number
            const nextPiece = subkeys[i + 1];
            if (current[subkey] === undefined) {
                current[subkey] = Number.isNaN(parseInt(nextPiece, 10)) ? {} : [];
            }
        }
        current = current[subkey];
    }
}
exports.expandKey = expandKey;
