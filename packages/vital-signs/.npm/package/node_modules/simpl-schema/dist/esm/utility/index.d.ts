import { ObjectToValidate } from '../types.js';
export declare function appendAffectedKey(affectedKey: string | undefined, key: string): string | undefined;
/**
 * Given a Date instance, returns a date string of the format YYYY-MM-DD
 */
export declare function dateToDateString(date: Date): string;
/**
 * Run loopFunc for each ancestor key in a dot-delimited key. For example,
 * if key is "a.b.c", loopFunc will be called first with ('a.b', 'c') and then with ('a', 'b.c')
 */
export declare function forEachKeyAncestor(key: string, loopFunc: (ancestor: string, remainder: string) => void): void;
/**
 * Returns an array of keys that are in obj, have a value
 * other than null or undefined, and start with matchKey
 * plus a dot.
 */
export declare function getKeysWithValueInObj(obj: Record<string, unknown>, matchKey: string): string[];
/**
 * Returns the ending of key, after stripping out the beginning
 * ancestorKey and any array placeholders
 *
 * getLastPartOfKey('a.b.c', 'a') returns 'b.c'
 * getLastPartOfKey('a.b.$.c', 'a.b') returns 'c'
 */
export declare function getLastPartOfKey(key: string, ancestorKey: string): string;
/**
 * Returns the parent of a key. For example, returns 'a.b' when passed 'a.b.c'.
 * If no parent, returns an empty string. If withEndDot is true, the return
 * value will have a dot appended when it isn't an empty string.
 */
export declare function getParentOfKey(key: string, withEndDot?: boolean): string;
/**
 * @summary Determines whether the object has any "own" properties
 * @param {Object} obj Object to test
 * @return {Boolean} True if it has no "own" properties
 */
export declare function isEmptyObject(obj: Record<string, unknown>): boolean;
export declare function isObjectWeShouldTraverse(val: any): boolean;
/**
 * Returns true if any of the keys of obj start with a $
 */
export declare function looksLikeModifier(obj: ObjectToValidate | null | undefined): boolean;
export { humanize } from './humanize.js';
