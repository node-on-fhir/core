import { SimpleSchema } from '../../SimpleSchema.js';
import { dateToDateString } from '../../utility/index.js';
export default function checkDateValue(def, value) {
    // Is it an invalid date?
    if (isNaN(value.getTime())) {
        return { type: SimpleSchema.ErrorTypes.BAD_DATE };
    }
    // Is it earlier than the minimum date?
    if (def.min !== undefined &&
        typeof def.min.getTime === 'function' &&
        def.min.getTime() > value.getTime()) {
        return {
            type: SimpleSchema.ErrorTypes.MIN_DATE,
            min: dateToDateString(def.min)
        };
    }
    // Is it later than the maximum date?
    if (def.max !== undefined &&
        typeof def.max.getTime === 'function' &&
        def.max.getTime() < value.getTime()) {
        return {
            type: SimpleSchema.ErrorTypes.MAX_DATE,
            max: dateToDateString(def.max)
        };
    }
}
