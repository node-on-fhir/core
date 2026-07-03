export declare class ClientError<DetailsType> extends Error {
    details?: DetailsType;
    error?: string;
    errorType: string;
    name: string;
    constructor(message?: string, error?: string);
}
