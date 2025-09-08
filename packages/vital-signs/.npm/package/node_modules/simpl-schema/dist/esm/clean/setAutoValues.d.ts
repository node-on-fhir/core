import MongoObject from 'mongo-object';
import { AutoValueFunctionDetails, CustomAutoValueContext } from '../types.js';
/**
 * @method sortAutoValueFunctions
 * @private
 * @param autoValueFunctions - Array of objects to be sorted
 * @returns Sorted array
 *
 * Stable sort of the autoValueFunctions (preserves order at the same field depth).
 */
export declare function sortAutoValueFunctions(autoValueFunctions: AutoValueFunctionDetails[]): AutoValueFunctionDetails[];
/**
 * @method setAutoValues
 * @private
 * @param autoValueFunctions - An array of objects with func, fieldName, and closestSubschemaFieldName props
 * @param mongoObject
 * @param [isModifier=false] - Is it a modifier doc?
 * @param [extendedAutoValueContext] - Object that will be added to the context when calling each autoValue function
 *
 * Updates doc with automatic values from autoValue functions or default
 * values from defaultValue. Modifies the referenced object in place.
 */
declare function setAutoValues(autoValueFunctions: AutoValueFunctionDetails[], mongoObject: MongoObject, isModifier: boolean, isUpsert: boolean, extendedAutoValueContext?: CustomAutoValueContext): void;
export default setAutoValues;
