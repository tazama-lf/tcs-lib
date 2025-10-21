import { SchemaField } from '../interfaces/schema.interfaces';
import { ContentType } from '../interfaces/core.interfaces';
import { JSONSchema } from '../interfaces/json-schema.interfaces';
import { SchemaValidationResultDto, AdjustFieldDto } from '../dtos/schema-workflow.dto';
import { JSONSchemaConverterService } from '../schemas/json-schema-converter.service';
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
export declare class PayloadParsingService {
    private readonly _jsonSchemaConverter;
    private readonly logger;
    constructor(_jsonSchemaConverter: JSONSchemaConverterService);
    parsePayloadToSchema(payload: string, contentType: ContentType, _filename?: string): Promise<PayloadParsingResult>;
    applyFieldAdjustments(sourceFields: SchemaField[], adjustments: AdjustFieldDto[]): SchemaField[];
    private validatePayloadStructure;
    private addStructureError;
    private validateJsonStructure;
    private validateXmlStructure;
    private calculateObjectDepth;
    private parsePayloadToObject;
    private generateHierarchicalSchema;
    private createSchemaField;
    private inferPrimitiveType;
    private inferArrayElementType;
    private validateGeneratedSchema;
    private validateFieldsRecursively;
    private collectAllPaths;
    private applyAdjustmentsRecursively;
    private calculateSchemaMetadata;
    private flattenFields;
    private calculateMaxNestedLevels;
    private createEmptyMetadata;
    private createEmptyJSONSchema;
}
