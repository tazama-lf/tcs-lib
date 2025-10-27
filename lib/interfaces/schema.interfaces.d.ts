import { JSONSchema } from './json-schema.interfaces';
import { FieldType, HttpMethod, TransactionType, EndpointStatus } from './core.interfaces';
export interface SchemaField {
  name: string;
  path: string;
  type: FieldType;
  isRequired: boolean;
  children?: SchemaField[];
  arrayElementType?: FieldType;
}
export interface FieldMapping {
  source?: string | string[];
  destination: string | string[];
  transformation?: 'NONE' | 'CONCAT' | 'SUM' | 'SPLIT' | 'CONSTANT' | 'MATH';
  delimiter?: string;
  constants?: any;
  constantValue?: any;
  operator?: 'ADD' | 'SUBTRACT' | 'MULTIPLY' | 'DIVIDE';
  prefix?: string;
}
export type TransformationType = 'NONE' | 'CONCAT' | 'SUM' | 'SPLIT';
export type MappingStatus = 'ACTIVE' | 'INACTIVE' | 'DEPRECATED';
export type ExtensionFieldStatus = 'DRAFT' | 'ACTIVE' | 'DEPRECATED';
export type ExtensionFieldCategory = 'CUSTOM' | 'REGULATORY' | 'BUSINESS';
export interface FieldMappingEntity {
  id?: number;
  endpointId: number;
  sourceFieldPath: string;
  sourceFieldType: FieldType;
  sourceFieldRequired: boolean;
  destinationFieldPath: string;
  destinationFieldType: FieldType;
  destinationFieldRequired: boolean;
  transformation: TransformationType;
  transformationConfig?: Record<string, any>;
  constants?: Record<string, any>;
  status: MappingStatus;
  orderIndex: number;
  tenantId: string;
  createdBy: string;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
export interface DestinationFieldExtension {
  id?: number;
  name: string;
  path: string;
  type: FieldType;
  isRequired: boolean;
  description?: string;
  parentId?: number;
  orderIndex: number;
  category: ExtensionFieldCategory;
  collection?: string;
  status: ExtensionFieldStatus;
  version: string;
  tenantId: string;
  createdBy: string;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
  children?: DestinationFieldExtension[];
}
export interface SourceSchema {
  schema: JSONSchema;
  version: string;
  lastUpdated: Date;
  createdBy: string;
  metadata?: {
    originalFormat?: string;
    parsedAt?: Date;
    fieldCount?: number;
  };
}
export interface UnifiedSchema {
  sourceFields: SchemaField[];
  destinationFields: SchemaField[];
  mappings: FieldMapping[];
  extensions: SchemaField[];
  version: string;
  lastUpdated: Date;
  createdBy: string;
}
export interface Endpoint {
  id: number;
  path: string;
  method: HttpMethod;
  version: string;
  transactionType: TransactionType;
  status: EndpointStatus;
  description?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
  schemaJson?: SourceSchema;
  schemaVersion?: number;
}
