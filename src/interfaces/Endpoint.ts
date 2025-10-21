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
  payload?: string;
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
  functionName: 'addAccountHolder' | 'addEntity' | 'addAccount'; // Only these three functions are allowed
}

export type AllowedFunctionName = 'addAccountHolder' | 'addEntity' | 'addAccount';

// export enum ContentType {
//   JSON = 'application/json',
//   XML = 'application/xml',
// }
// export type TransactionType = string;
export enum ConfigStatus {
  IN_PROGRESS = 'inprogress',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  DEPLOYED = 'deployed',
  REJECTED = 'rejected',
  CHANGES_REQUESTED = 'changes_requested',
}
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
}
export interface AddMappingDto {
  source?: string;
  destination?: string;
  destinations?: string[];
  sources?: string[];
  delimiter?: string;
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
