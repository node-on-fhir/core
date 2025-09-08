"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValueTypeValid = exports.checkValueType = void 0;
const SimpleSchema_js_1 = require("../../SimpleSchema.js");
const checkArrayValue_js_1 = __importDefault(require("./checkArrayValue.js"));
const checkDateValue_js_1 = __importDefault(require("./checkDateValue.js"));
const checkNumberValue_js_1 = __importDefault(require("./checkNumberValue.js"));
const checkStringValue_js_1 = __importDefault(require("./checkStringValue.js"));
function checkValueType(info) {
    const { definition: def, operator: op, value, valueShouldBeChecked } = info;
    if (!valueShouldBeChecked)
        return;
    const expectedType = def.type;
    if (expectedType === String)
        return (0, checkStringValue_js_1.default)(def, value);
    if (expectedType === Number)
        return (0, checkNumberValue_js_1.default)(def, value, op, false);
    if (expectedType === SimpleSchema_js_1.SimpleSchema.Integer)
        return (0, checkNumberValue_js_1.default)(def, value, op, true);
    if (expectedType === Boolean) {
        // Is it a boolean?
        if (typeof value === 'boolean')
            return;
        return { type: SimpleSchema_js_1.SimpleSchema.ErrorTypes.EXPECTED_TYPE, dataType: 'Boolean' };
    }
    if (expectedType === Object || SimpleSchema_js_1.SimpleSchema.isSimpleSchema(expectedType)) {
        // Is it an object?
        if (value === Object(value) &&
            typeof value[Symbol.iterator] !== 'function' &&
            !(value instanceof Date)) {
            return;
        }
        return { type: SimpleSchema_js_1.SimpleSchema.ErrorTypes.EXPECTED_TYPE, dataType: 'Object' };
    }
    if (expectedType === Array)
        return (0, checkArrayValue_js_1.default)(def, value);
    if (expectedType instanceof Function) {
        // Generic constructor checks
        if (!(value instanceof expectedType)) {
            // https://docs.mongodb.com/manual/reference/operator/update/currentDate/
            const dateTypeIsOkay = expectedType === Date &&
                op === '$currentDate' &&
                (value === true || JSON.stringify(value) === '{"$type":"date"}');
            if (expectedType !== Date || !dateTypeIsOkay) {
                return {
                    type: SimpleSchema_js_1.SimpleSchema.ErrorTypes.EXPECTED_TYPE,
                    dataType: expectedType.name
                };
            }
        }
        // Date checks
        if (expectedType === Date) {
            // https://docs.mongodb.com/manual/reference/operator/update/currentDate/
            if (op === '$currentDate') {
                return (0, checkDateValue_js_1.default)(def, new Date());
            }
            return (0, checkDateValue_js_1.default)(def, value);
        }
    }
}
exports.checkValueType = checkValueType;
function isValueTypeValid(typeDefinitions, value, operator) {
    return typeDefinitions.some((definition) => {
        const typeValidationError = checkValueType({
            valueShouldBeChecked: true,
            definition,
            value,
            operator
        });
        return typeValidationError === undefined;
    });
}
exports.isValueTypeValid = isValueTypeValid;
function typeValidator() {
    return checkValueType(this);
}
exports.default = typeValidator;
