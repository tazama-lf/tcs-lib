import { FieldType, ContentType } from '../interfaces/core.interfaces';
export declare class ParsePayloadDto {
    payload: string;
    contentType: ContentType;
    filename?: string;
}
export declare class AdjustFieldDto {
    path: string;
    type: FieldType;
    isRequired: boolean;
}
export declare class CreateEndpointWithSchemaDto {
    name: string;
    path: string;
    method: string;
    version: string;
    transactionType: string;
    description?: string;
    payload: string;
    contentType: ContentType;
    fieldAdjustments?: AdjustFieldDto[];
}
export declare class SchemaValidationResultDto {
    success: boolean;
    errors: string[];
    warnings: string[];
    duplicateFields?: string[];
    invalidTypes?: string[];
    conflictingPaths?: string[];
}
export declare class EndpointLifecycleTransitionDto {
    targetStatus: string;
    comment?: string;
}
export declare class GenerateSourceFieldsDto {
    payload: string;
    contentType: ContentType;
}
export declare class CreateEndpointWithSourceFieldsDto {
    name: string;
    path: string;
    method: string;
    version: string;
    transactionType: string;
    description?: string;
    sourceFields: SchemaFieldDto[];
    contentType: ContentType;
    payload: string;
}
export declare class SchemaFieldDto {
    name: string;
    path: string;
    type: FieldType;
    isRequired: boolean;
    children?: SchemaFieldDto[];
    arrayElementType?: FieldType;
}
export declare class AdvancedFileUploadDto {
    expectedContentType: ContentType;
    autoDetectType?: boolean;
}
export declare class ToggleFieldRequiredDto {
    isRequired: boolean;
}
export declare class AddFieldDto {
    name: string;
    path: string;
    type: FieldType;
    isRequired: boolean;
    parentFieldId?: number;
    arrayElementType?: FieldType;
}
export declare class ReorderFieldsDto {
    fieldIds: number[];
}
export declare class ParsedSchemaResponseDto {
    success: boolean;
    schema?: {
        sourceFields: any[];
        metadata: {
            totalFields: number;
            requiredFields: number;
            optionalFields: number;
            nestedLevels: number;
        };
    };
    validation: SchemaValidationResultDto;
}
export declare class EndpointCreationResponseDto {
    success: boolean;
    endpointId?: number;
    message: string;
    validation?: SchemaValidationResultDto;
    auditLogId?: string;
}
