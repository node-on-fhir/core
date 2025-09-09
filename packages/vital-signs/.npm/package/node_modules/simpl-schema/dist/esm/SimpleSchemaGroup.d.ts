import { SchemaKeyDefinitionWithOneType, SupportedTypes } from './types.js';
declare class SimpleSchemaGroup {
    definitions: SchemaKeyDefinitionWithOneType[];
    constructor(...definitions: Array<SchemaKeyDefinitionWithOneType | SupportedTypes | RegExpConstructor>);
    get singleType(): SupportedTypes;
    clone(): SimpleSchemaGroup;
    extend(otherGroup: SimpleSchemaGroup): void;
}
export default SimpleSchemaGroup;
