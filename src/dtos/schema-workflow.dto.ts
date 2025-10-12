import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  ValidateNested,
  IsArray,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FieldType, ContentType } from '../interfaces/core.interfaces';
export class ParsePayloadDto {
  @IsString()
  @IsNotEmpty()
  payload!: string;
  @IsEnum(ContentType)
  contentType!: ContentType;
  @IsOptional()
  @IsString()
  filename?: string;
}
export class AdjustFieldDto {
  @IsString()
  @IsNotEmpty()
  path!: string;
  @IsEnum(FieldType)
  type!: FieldType;
  @IsBoolean()
  isRequired!: boolean;
}
export class CreateEndpointWithSchemaDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
  @IsString()
  @IsNotEmpty()
  path!: string;
  @IsString()
  @IsNotEmpty()
  method!: string;
  @IsString()
  @IsNotEmpty()
  version!: string;
  @IsString()
  @IsNotEmpty()
  transactionType!: string;
  @IsOptional()
  @IsString()
  description?: string;
  @IsString()
  @IsNotEmpty()
  payload!: string;
  @IsEnum(ContentType)
  contentType!: ContentType;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdjustFieldDto)
  fieldAdjustments?: AdjustFieldDto[];
}
export class SchemaValidationResultDto {
  success!: boolean;
  errors!: string[];
  warnings!: string[];
  duplicateFields?: string[];
  invalidTypes?: string[];
  conflictingPaths?: string[];
}
export class EndpointLifecycleTransitionDto {
  @IsString()
  @IsNotEmpty()
  targetStatus!: string;
  @IsOptional()
  @IsString()
  comment?: string;
}
export class GenerateSourceFieldsDto {
  @IsString()
  @IsNotEmpty()
  payload!: string;
  @IsEnum(ContentType)
  contentType!: ContentType;
}
export class CreateEndpointWithSourceFieldsDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
  @IsString()
  @IsNotEmpty()
  path!: string;
  @IsString()
  @IsNotEmpty()
  method!: string;
  @IsString()
  @IsNotEmpty()
  version!: string;
  @IsString()
  @IsNotEmpty()
  transactionType!: string;
  @IsOptional()
  @IsString()
  description?: string;
  sourceFields!: SchemaFieldDto[];
  @IsEnum(ContentType)
  contentType!: ContentType;
  @IsString()
  @IsNotEmpty()
  payload!: string;
}
export class SchemaFieldDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
  @IsString()
  @IsNotEmpty()
  path!: string;
  @IsEnum(FieldType)
  type!: FieldType;
  @IsBoolean()
  isRequired: boolean = false;
  @IsOptional()
  children?: SchemaFieldDto[];
  @IsOptional()
  @IsEnum(FieldType)
  arrayElementType?: FieldType;
}
export class AdvancedFileUploadDto {
  @IsEnum(ContentType)
  expectedContentType!: ContentType;
  @IsOptional()
  @IsBoolean()
  autoDetectType?: boolean;
}
export class ToggleFieldRequiredDto {
  @IsBoolean()
  isRequired!: boolean;
}
export class AddFieldDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
  @IsString()
  @IsNotEmpty()
  path!: string;
  @IsEnum(FieldType)
  type!: FieldType;
  @IsBoolean()
  isRequired: boolean = false;
  @IsOptional()
  @IsNumber()
  parentFieldId?: number;
  @IsOptional()
  @IsEnum(FieldType)
  arrayElementType?: FieldType;
}
export class ReorderFieldsDto {
  @IsNumber({}, { each: true })
  fieldIds!: number[];
}
export class ParsedSchemaResponseDto {
  success!: boolean;
  schema?: {
    sourceFields: any[];
    metadata: {
      totalFields: number;
      requiredFields: number;
      optionalFields: number;
      nestedLevels: number;
    };
  };
  validation!: SchemaValidationResultDto;
}
export class EndpointCreationResponseDto {
  success!: boolean;
  endpointId?: number;
  message!: string;
  validation?: SchemaValidationResultDto;
  auditLogId?: string;
}
