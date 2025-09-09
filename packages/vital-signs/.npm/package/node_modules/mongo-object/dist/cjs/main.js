"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoObject = exports.reportNulls = exports.makeKeyGeneric = exports.keyToPosition = exports.isBasicObject = exports.genericKeyAffectsOtherGenericKey = exports.extractOp = exports.expandKey = exports.cleanNulls = exports.appendAffectedKey = void 0;
const mongo_object_js_1 = __importDefault(require("./mongo-object.js"));
exports.MongoObject = mongo_object_js_1.default;
var util_js_1 = require("./util.js");
Object.defineProperty(exports, "appendAffectedKey", { enumerable: true, get: function () { return util_js_1.appendAffectedKey; } });
Object.defineProperty(exports, "cleanNulls", { enumerable: true, get: function () { return util_js_1.cleanNulls; } });
Object.defineProperty(exports, "expandKey", { enumerable: true, get: function () { return util_js_1.expandKey; } });
Object.defineProperty(exports, "extractOp", { enumerable: true, get: function () { return util_js_1.extractOp; } });
Object.defineProperty(exports, "genericKeyAffectsOtherGenericKey", { enumerable: true, get: function () { return util_js_1.genericKeyAffectsOtherGenericKey; } });
Object.defineProperty(exports, "isBasicObject", { enumerable: true, get: function () { return util_js_1.isBasicObject; } });
Object.defineProperty(exports, "keyToPosition", { enumerable: true, get: function () { return util_js_1.keyToPosition; } });
Object.defineProperty(exports, "makeKeyGeneric", { enumerable: true, get: function () { return util_js_1.makeKeyGeneric; } });
Object.defineProperty(exports, "reportNulls", { enumerable: true, get: function () { return util_js_1.reportNulls; } });
exports.default = mongo_object_js_1.default;
