import { ContentType, TransactionType } from './core.interfaces';
import { JSONSchema } from './json-schema.interfaces';
import { AdjustFieldDto } from 'src/dtos/schema-workflow.dto';
import { FieldMapping } from './schema.interfaces';
// import { JSONSchema, AdjustFieldDto } from './SchemaValidation';

export interface CreateConfigDto {
  msgFam?: string;
  transactionType: TransactionType;
  version?: string;
  contentType?: ContentType;
  payload?: string | any; // Accept both string and object for convenience
  endpointPath?: string; // Generated endpoint path
  mapping?: FieldMapping[];
  functions?: FunctionDefinition[];
  fieldAdjustments?: AdjustFieldDto[];
}

export interface CloneConfigDto {
  sourceConfigId: number;
  newTransactionType: TransactionType;
  newVersion?: string;
  newMsgFam?: string;
  functions?: FunctionDefinition[];
  fieldAdjustments?: AdjustFieldDto[];
}

export interface UpdateConfigDto {
  msgFam?: string;
  transactionType?: TransactionType;
  endpointPath?: string;
  version?: string;
  contentType?: ContentType;
  schema?: JSONSchema;
  mapping?: FieldMapping[];
  functions?: FunctionDefinition[];
  fieldAdjustments?: AdjustFieldDto[];
  status?: ConfigStatus; // Allow status updates with proper enum type
  comments?: string; // Comments from approvers to editors (CHANGES_REQUESTED)
}
// export interface FieldMapping {
//   source?: string | string[]; // Optional when using constants
//   destination: string | string[];
//   transformation?: 'NONE' | 'CONCAT' | 'SUM' | 'SPLIT' | 'CONSTANT' | 'MATH';
//   delimiter?: string; // Used for one-to-many mapping to split source value
//   constantValue?: any; // Fixed value to map to destination (replaces constants)
//   operator?: 'ADD' | 'SUBTRACT' | 'MULTIPLY' | 'DIVIDE'; // Mathematical operators for MATH transformation
// }

export interface FunctionDefinition {
  params: string[]; // Array of parameter names
  functionName: AllowedFunctionName;
}

export type AllowedFunctionName =
  | 'addAccountHolder'
  | 'addEntity'
  | 'addAccount'
  | 'transactionRelationship';

// export enum ContentType {
//   JSON = 'application/json',
//   XML = 'application/xml',
// }
// export type TransactionType = string;
/* eslint-disable no-unused-vars */
export enum ConfigStatus {
  IN_PROGRESS = 'STATUS_01_IN_PROGRESS',
  SUSPENDED = 'STATUS_02_SUSPENDED',
  UNDER_REVIEW = 'STATUS_03_UNDER_REVIEW',
  APPROVED = 'STATUS_04_APPROVED',
  REJECTED = 'STATUS_05_REJECTED',
  EXPORTED = 'STATUS_06_EXPORTED',
  READY_FOR_DEPLOYMENT = 'STATUS_07_READY_FOR_DEPLOYMENT',
  DEPLOYED = 'STATUS_08_DEPLOYED',
}
/* eslint-enable no-unused-vars */
export interface MappingSource {
  field: string; // Field path in source schema
}
export interface MappingDestination {
  field: string; // Field path in destination schema
}
export interface Config {
  id: number;
  msgFam: string; // Message family (pain.001, pacs.008, etc.)
  transactionType: TransactionType;
  endpointPath: string;
  version: string;
  contentType: ContentType;
  schema: JSONSchema;
  mapping?: FieldMapping[];
  functions?: FunctionDefinition[];
  status?: ConfigStatus;
  tenantId?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  comments?: string; // Comments from approvers to editors (CHANGES_REQUESTED status)
}
export interface AddMappingDto {
  source?: string;
  destination?: string;
  destinations?: string[];
  sources?: string[];
  sumFields?: string[];
  delimiter?: string;
  constantValue?: any;
  prefix?: string;
  transformation?: 'NONE' | 'CONCAT' | 'SUM' | 'SPLIT' | 'CONSTANT' | 'MATH';
  operator?: 'ADD' | 'SUBTRACT' | 'MULTIPLY' | 'DIVIDE';
}

export interface AddFunctionDto {
  params: string[];
  functionName: AllowedFunctionName;
}
export interface ConfigResponseDto {
  success: boolean;
  message: string;
  config?: Config;
  validation?: {
    success: boolean;
    errors: string[];
    warnings: string[];
  };
}

export interface StatusTransitionDto {
  userId: string;
  userRole: string;
  comment?: string;
  metadata?: Record<string, any>;
}

export interface SubmitForApprovalDto extends StatusTransitionDto {
  configId: number;
}

export interface ApprovalDto extends StatusTransitionDto {
  configId: number;
  approvalNotes?: string;
}

export interface RejectionDto extends StatusTransitionDto {
  configId: number;
  rejectionReason: string;
}

export interface ChangeRequestDto extends StatusTransitionDto {
  configId: number;
  requestedChanges: string;
}

export interface DeploymentDto extends StatusTransitionDto {
  configId: number;
  deploymentEnvironment?: string;
  deploymentNotes?: string;
}

export interface WorkflowValidationResult {
  canEdit: boolean;
  canSubmit: boolean;
  canApprove: boolean;
  canReject: boolean;
  canRequestChanges: boolean;
  canExport: boolean;
  canDeploy: boolean;
  canReturnToProgress: boolean;
  reason?: string;
}

export interface StatusTransitionValidation {
  isValid: boolean;
  currentStatus: ConfigStatus;
  targetStatus: ConfigStatus;
  allowedNextStatuses: ConfigStatus[];
  reason?: string;
}

export type WorkflowAction =
  | 'submit_for_approval'
  | 'approve'
  | 'reject'
  | 'request_changes'
  | 'export'
  | 'deploy'
  | 'return_to_progress';

export interface AuditLogEntry {
  configId: number;
  action: string;
  userId: string;
  userRole: string;
  previousStatus?: ConfigStatus;
  newStatus?: ConfigStatus;
  comment?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}
