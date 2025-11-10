import type { ContentType, TransactionType } from '../interfaces/core.interfaces';
import type { JSONSchema } from '../interfaces/json-schema.interfaces';
import type { FieldMapping } from '../interfaces/schema.interfaces';

export enum ConfigStatus {
  IN_PROGRESS = 'STATUS_01_IN_PROGRESS',
  ON_HOLD = 'STATUS_02_ON_HOLD',
  UNDER_REVIEW = 'STATUS_03_UNDER_REVIEW',
  APPROVED = 'STATUS_04_APPROVED',
  REJECTED = 'STATUS_05_REJECTED',
  EXPORTED = 'STATUS_06_EXPORTED',
  READY_FOR_DEPLOYMENT = 'STATUS_07_READY_FOR_DEPLOYMENT',
  DEPLOYED = 'STATUS_08_DEPLOYED',
}


export type AllowedFunctionName =
  | 'addAccountHolder'
  | 'addEntity'
  | 'addAccount'
  | 'saveTransactionDetails'
  | 'transactionRelationship';


export interface FunctionDefinition {
  params: string[];
  functionName: AllowedFunctionName;
}


export interface Config {
  id: number;
  msgFam: string;
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
  comments?: string;
  publishing_status?: 'active' | 'inactive';
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

export type WorkflowAction =
  | 'submit_for_approval'
  | 'approve'
  | 'reject'
  | 'export'
  | 'deploy'
  | 'return_to_progress';

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
