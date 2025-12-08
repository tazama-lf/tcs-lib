import { FieldType } from './core.interfaces';
import { TransformationType } from './schema.interfaces';
export interface SourceField {
  path: string;
  type: FieldType;
  isRequired: boolean;
}
export interface DestinationField {
  path: string;
  type: FieldType;
  isRequired: boolean;
  isExtension: boolean;
}
export interface TransformationConfig {
  separator?: string;
  concatFields?: string[]; 
  operation?: 'SUM' | 'AVERAGE' | 'COUNT';
  sumFields?: string[]; 
  delimiter?: string;
  targetFields?: string[];
  customLogic?: string;
}
export interface ConstantValue {
  path: string; 
  value: any; 
  type: FieldType;
}

export type MultiFieldMappingStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT';
export type MappingAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'ACTIVATE' | 'DEACTIVATE';
export interface MultiFieldMappingEntity {
  id?: number;
  endpointId: number;
  name: string;
  description?: string;
  sourceFields: SourceField[];
  destinationFields: DestinationField[];
  transformation: TransformationType;
  transformationConfig?: TransformationConfig;
  constants?: Record<string, any>;
  status: MultiFieldMappingStatus;
  orderIndex: number;
  version: number;
  tenantId: string;
  createdBy: string;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
export interface MultiFieldMappingHistoryEntity {
  id?: number;
  mappingId: number;
  mappingSnapshot: MultiFieldMappingEntity;
  version: number;
  action: MappingAction;
  changedBy: string;
  changeReason?: string;
  changedAt?: Date;
}
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: ValidationError[];
}
export interface SimulationInput {
  mappingId: number;
  testPayload: Record<string, any>;
  tenantId: string;
}
export interface SimulationResult {
  success: boolean;
  transformedOutput: Record<string, any>;
  validationResult: ValidationResult;
  appliedTransformations: string[];
  appliedConstants: string[];
  processingTime: number;
}
export interface MappingTreeNode {
  id: string;
  name: string;
  type: 'source' | 'destination' | 'transformation' | 'constant';
  path?: string;
  fieldType?: FieldType;
  isRequired?: boolean;
  isExtension?: boolean;
  value?: any;
  children?: MappingTreeNode[];
  parentId?: string;
}
export interface MappingTreeView {
  mappingId: number;
  mappingName: string;
  sourceNodes: MappingTreeNode[];
  destinationNodes: MappingTreeNode[];
  transformationNodes: MappingTreeNode[];
  constantNodes: MappingTreeNode[];
}
