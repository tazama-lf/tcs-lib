import type { SchemaField } from '../interfaces/schema.interfaces';
import type { FieldType, ContentType } from '../interfaces/core.interfaces';
import type { JSONSchema } from '../interfaces/json-schema.interfaces';
import type { SchemaValidationResultDto, AdjustFieldDto } from '../dtos/schema-workflow.dto';
export interface PayloadParsingResult {
    success: boolean;
    jsonSchema: JSONSchema;
    sourceFields: SchemaField[];
    metadata: {
        totalFields: number;
        requiredFields: number;
        optionalFields: number;
        nestedLevels: number;
        originalSize: number;
        processingTime: number;
    };
    validation: SchemaValidationResultDto;
}
export declare const parsePayloadToSchema: (payload: string, contentType: ContentType, _filename?: string) => Promise<PayloadParsingResult | undefined>;
export declare const applyFieldAdjustments: (sourceFields: SchemaField[], adjustments: AdjustFieldDto[]) => SchemaField[];
export declare const validatePayloadStructure: (payload: string, contentType: ContentType) => Promise<SchemaValidationResultDto>;
export declare const addStructureError: (error: any, contentType: ContentType, errors: string[]) => void;
export declare const validateJsonStructure: (parsed: any, errors: string[], warnings: string[]) => void;
export declare const validateXmlStructure: (xmlString: string, errors: string[], warnings: string[]) => void;
export declare const calculateObjectDepth: (obj: any, currentDepth?: number) => number;
export declare const parsePayloadToObject: (payload: string, contentType: ContentType) => Promise<any>;
export declare const generateHierarchicalSchema: (obj: any, parentPath: string, level?: number) => SchemaField[];
export declare const createSchemaField: (name: string, path: string, value: any, level: number) => SchemaField | null;
export declare const inferPrimitiveType: (value: any) => FieldType;
export declare const inferArrayElementType: (array: any[]) => FieldType;
export declare const validateGeneratedSchema: (fields: SchemaField[]) => SchemaValidationResultDto;
export declare const validateFieldsRecursively: (fields: SchemaField[], errors: string[], warnings: string[], invalidTypes: string[], conflictingPaths: string[]) => void;
export declare const collectAllPaths: (fields: SchemaField[]) => string[];
export declare const applyAdjustmentsRecursively: (fields: SchemaField[], adjustmentMap: Map<string, AdjustFieldDto>) => SchemaField[];
export declare const calculateSchemaMetadata: (fields: SchemaField[], originalPayload: string, processingTime: number) => PayloadParsingResult['metadata'];
export declare const flattenFields: (fields: SchemaField[]) => SchemaField[];
export declare const calculateMaxNestedLevels: (fields: SchemaField[], currentLevel?: number) => number;
export declare const createEmptyMetadata: (payload: string, processingTime: number) => PayloadParsingResult['metadata'];
export declare const createEmptyJSONSchema: () => JSONSchema;
