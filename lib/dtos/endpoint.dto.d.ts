import { TransactionType, HttpMethod, ContentType } from '../interfaces/core.interfaces';
export declare class CreateEndpointDto {
    path: string;
    method: HttpMethod;
    version: string;
    transactionType: TransactionType;
    description?: string;
    samplePayload: string;
    contentType: ContentType;
}
export declare class InferSchemaDto {
    payload: string;
    contentType: ContentType;
}
