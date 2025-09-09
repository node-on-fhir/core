"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientError = void 0;
class ClientError extends Error {
    constructor(message, error) {
        super(message);
        this.errorType = 'ClientError';
        this.name = 'ClientError';
        this.error = error;
    }
}
exports.ClientError = ClientError;
