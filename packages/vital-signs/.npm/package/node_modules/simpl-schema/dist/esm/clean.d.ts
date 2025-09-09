import { SimpleSchema } from './SimpleSchema.js';
import { CleanOptions } from './types.js';
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
declare function clean(ss: SimpleSchema, doc: Record<string | number | symbol, unknown>, options?: CleanOptions): Record<string | number | symbol, unknown>;
export default clean;
