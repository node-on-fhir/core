export class ClientError extends Error {
    constructor(message, error) {
        super(message);
        this.errorType = 'ClientError';
        this.name = 'ClientError';
        this.error = error;
    }
}
