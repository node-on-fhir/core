import type { JSONSchema7 } from 'json-schema';
import { SimpleSchema } from './SimpleSchema.js';
/**
 * Convert a SimpleSchema to a JSONSchema Document.
 *
 * Notes:
 * - Date fields will become string fields with built-in 'date-time' format.
 * - JSONSchema does not support minimum or maximum values for date fields
 * - Custom validators are ignored
 * - Field definition properties that are a function are ignored
 * - Custom objects are treated as regular objects
 *
 * @param simpleSchema SimpleSchema instance to convert
 * @param id Optional ID to use for the `$id` field
 * @returns JSONSchema Document
 */
export declare function toJsonSchema(simpleSchema: SimpleSchema, id?: string): JSONSchema7;
