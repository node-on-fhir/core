import MongoObject from 'mongo-object';
class SimpleSchemaGroup {
    constructor(...definitions) {
        this.definitions = [];
        this.definitions = definitions.map((definition) => {
            if (MongoObject.isBasicObject(definition)) {
                return Object.assign({}, definition);
            }
            if (definition instanceof RegExp) {
                return {
                    type: String,
                    regEx: definition
                };
            }
            return { type: definition };
        });
    }
    get singleType() {
        return this.definitions[0].type;
    }
    clone() {
        return new SimpleSchemaGroup(...this.definitions);
    }
    extend(otherGroup) {
        // We extend based on index being the same. No better way I can think of at the moment.
        this.definitions = this.definitions.map((def, index) => {
            const otherDef = otherGroup.definitions[index];
            if (otherDef === undefined)
                return def;
            return Object.assign(Object.assign({}, def), otherDef);
        });
    }
}
export default SimpleSchemaGroup;
