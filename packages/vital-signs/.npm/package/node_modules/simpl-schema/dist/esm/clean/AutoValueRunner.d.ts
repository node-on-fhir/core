import MongoObject from 'mongo-object';
import { AutoValueFunction } from '../types.js';
interface AutoValueRunnerOptions {
    closestSubschemaFieldName: string;
    extendedAutoValueContext?: Record<string | number | symbol, unknown>;
    func: AutoValueFunction;
    isModifier: boolean;
    isUpsert: boolean;
    mongoObject: MongoObject;
}
interface RunForPositionProps {
    key: string;
    operator: string;
    position: string;
    value: any;
}
export default class AutoValueRunner {
    doneKeys: string[];
    options: AutoValueRunnerOptions;
    constructor(options: AutoValueRunnerOptions);
    runForPosition({ key: affectedKey, operator, position, value }: RunForPositionProps): void;
}
export {};
