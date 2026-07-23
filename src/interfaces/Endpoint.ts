import type { ContentType, TransactionType } from './core.interfaces';
import type { JSONSchema } from './json-schema.interfaces';
import type { FieldMapping } from './schema.interfaces';
import type {
  FunctionDefinition,
  AllowedFunctionName,
  ConfigStatus,
  Config,
} from '../types/config.types';
export interface CreateConfigDto {
  msgFam?: string;
  transactionType: TransactionType;
  version: string;
  contentType?: ContentType;
  payload: string | Record<string, unknown>;
  endpointPath?: string;
  mapping?: FieldMapping[];
  functions?: FunctionDefinition[];
  schema?: Record<string, unknown>;
  related_transaction?: string;
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
  status?: ConfigStatus; // Allow status updates with proper enum type
  comments?: string; // Comments from approvers to editors (CHANGES_REQUESTED)
  related_transaction?: string;
}

export interface MappingSource {
  field: string; // Field path in source schema
}
export interface MappingDestination {
  field: string; // Field path in destination schema
}
export interface AddMappingDto {
  source?: string[];
  destination?: string;
  destinations?: string[];
  sources?: string[];
  sumFields?: string[];
  delimiter?: string;
  constantValue?: string;
  prefix?: string;
  transformation?: 'NONE' | 'CONCAT' | 'SUM' | 'SPLIT' | 'CONSTANT' | 'MATH';
  operator?: 'ADD' | 'SUBTRACT' | 'MULTIPLY' | 'DIVIDE';
  type?: string;
}
export interface AddFunctionDto {
  params?: string[];
  columns?: Array<Record<string, string>>;
  tableName?: string;
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
  metadata?: Record<string, unknown>;
}
export interface SubmitForApprovalDto extends StatusTransitionDto {
  configId: number;
}
export interface ApprovalDto extends StatusTransitionDto {
  configId: number;
  comment?: string;
}
export interface RejectionDto extends StatusTransitionDto {
  configId: number;
  comment: string;
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
  'submit_for_approval' | 'approve' | 'reject' | 'export' | 'deploy' | 'return_to_progress';
