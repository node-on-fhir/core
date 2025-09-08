import clone from 'clone';
import { getParentOfKey } from '../utility/index.js';
function getFieldInfo(mongoObject, key) {
    var _a;
    const keyInfo = (_a = mongoObject.getInfoForKey(key)) !== null && _a !== void 0 ? _a : {
        operator: null,
        value: undefined
    };
    return Object.assign(Object.assign({}, keyInfo), { isSet: keyInfo.value !== undefined });
}
export default class AutoValueRunner {
    constructor(options) {
        this.doneKeys = [];
        this.options = options;
    }
    runForPosition({ key: affectedKey, operator, position, value }) {
        const { closestSubschemaFieldName, extendedAutoValueContext, func, isModifier, isUpsert, mongoObject } = this.options;
        // If already called for this key, skip it
        if (this.doneKeys.includes(affectedKey))
            return;
        const fieldParentName = getParentOfKey(affectedKey, true);
        const parentFieldInfo = getFieldInfo(mongoObject, fieldParentName.slice(0, -1));
        let doUnset = false;
        if (Array.isArray(parentFieldInfo.value)) {
            const innerKey = affectedKey.split('.').slice(-1).pop();
            if (innerKey === undefined || isNaN(Number(innerKey))) {
                // parent is an array, but the key to be set is not an integer (see issue #80)
                return;
            }
        }
        const autoValueContext = Object.assign({ closestSubschemaFieldName: closestSubschemaFieldName.length > 0
                ? closestSubschemaFieldName
                : null, field(fName) {
                return getFieldInfo(mongoObject, closestSubschemaFieldName + fName);
            },
            isModifier,
            isUpsert, isSet: value !== undefined, key: affectedKey, operator,
            parentField() {
                return parentFieldInfo;
            },
            siblingField(fName) {
                return getFieldInfo(mongoObject, fieldParentName + fName);
            },
            unset() {
                doUnset = true;
            },
            value }, (extendedAutoValueContext !== null && extendedAutoValueContext !== void 0 ? extendedAutoValueContext : {}));
        const autoValue = func.call(autoValueContext, mongoObject.getObject());
        // Update tracking of which keys we've run autovalue for
        this.doneKeys.push(affectedKey);
        if (doUnset && position != null)
            mongoObject.removeValueForPosition(position);
        if (autoValue === undefined)
            return;
        // If the user's auto value is of the pseudo-modifier format, parse it
        // into operator and value.
        if (isModifier) {
            let op;
            let newValue;
            if (autoValue != null && typeof autoValue === 'object') {
                const avOperator = Object.keys(autoValue).find((avProp) => avProp.substring(0, 1) === '$');
                if (avOperator !== undefined) {
                    op = avOperator;
                    newValue = autoValue[avOperator];
                }
            }
            // Add $set for updates and upserts if necessary. Keep this
            // above the "if (op)" block below since we might change op
            // in this line.
            if (op == null && position.slice(0, 1) !== '$') {
                op = '$set';
                newValue = autoValue;
            }
            if (op != null) {
                // Update/change value
                mongoObject.removeValueForPosition(position);
                mongoObject.setValueForPosition(`${op}[${affectedKey}]`, clone(newValue));
                return;
            }
        }
        // Update/change value. Cloning is necessary in case it's an object, because
        // if we later set some keys within it, they'd be set on the original object, too.
        mongoObject.setValueForPosition(position, clone(autoValue));
    }
}
